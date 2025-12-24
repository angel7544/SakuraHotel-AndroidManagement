import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  Image,
  Switch,
  useWindowDimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { uploadImage } from '../../lib/upload';
import { Save, ArrowLeft, X, Upload, CheckSquare, Square, Plus, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';

export default function AdminPackageFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { id } = route.params || {};
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    number_of_days: '',
    number_of_nights: '',
    room_capacity: '',
    bed_count: '',
    image_url: '',
    images: [] as string[],
    status: 'Active',
    is_featured: false,
    is_corporate: false,
    is_wedding: false,
    items: [] as string[], // Included items list
  });

  const [newImages, setNewImages] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      fetchPackage();
    }
  }, [id]);

  const fetchPackage = async () => {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      Alert.alert('Error', 'Failed to fetch package details');
      navigation.goBack();
    } else {
      setFormData({
        ...data,
        price: data.price?.toString() || '',
        number_of_days: data.number_of_days?.toString() || '',
        number_of_nights: data.number_of_nights?.toString() || '',
        room_capacity: data.room_capacity?.toString() || '',
        bed_count: data.bed_count?.toString() || '',
        images: data.images || (data.image_url ? [data.image_url] : []),
        items: data.items || [],
        is_corporate: data.is_corporate || false,
        is_wedding: data.is_wedding || false,
      });
    }
    setFetching(false);
  };

  const pickImage = async () => {
    if (formData.images.length + newImages.length >= 4) {
      Alert.alert('Limit Reached', 'You can only add up to 4 images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setNewImages([...newImages, result.assets[0].uri]);
    }
  };

  const removeNewImage = (index: number) => {
    const updated = [...newImages];
    updated.splice(index, 1);
    setNewImages(updated);
  };

  const removeExistingImage = (index: number) => {
    const updated = [...formData.images];
    updated.splice(index, 1);
    setFormData({ ...formData, images: updated });
  };

  const addIncludedItem = () => {
    setFormData({ ...formData, items: [...formData.items, ''] });
  };

  const updateIncludedItem = (text: string, index: number) => {
    const newItems = [...formData.items];
    newItems[index] = text;
    setFormData({ ...formData, items: newItems });
  };

  const removeIncludedItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      Alert.alert('Validation', 'Name and Price are required');
      return;
    }

    setLoading(true);
    try {
      // Upload new images
      const uploadedUrls: string[] = [];
      for (const uri of newImages) {
        const url = await uploadImage(uri, 'sakura', 'packages');
        if (url) uploadedUrls.push(url);
      }

      const finalImages = [...formData.images, ...uploadedUrls];
      const finalImageUrl = finalImages.length > 0 ? finalImages[0] : '';

      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        number_of_days: parseInt(formData.number_of_days || '0'),
        number_of_nights: parseInt(formData.number_of_nights || '0'),
        room_capacity: parseInt(formData.room_capacity || '0'),
        bed_count: parseInt(formData.bed_count || '0'),
        image_url: finalImageUrl,
        images: finalImages,
      };

      if (id) {
        const { error } = await supabase.from('packages').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('packages').insert([payload]);
        if (error) throw error;
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#db2777" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>{id ? 'Edit Package' : 'Add Package'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.form, isLargeScreen && styles.formLarge]}>
        <View style={[styles.inputGroup, isLargeScreen && styles.halfWidth]}>
          <Text style={styles.label}>Package Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="e.g. Honeymoon Special"
          />
        </View>

        <View style={[styles.inputGroup, isLargeScreen && styles.halfWidth]}>
          <Text style={styles.label}>Price (₹) *</Text>
          <TextInput
            style={styles.input}
            value={formData.price}
            onChangeText={(text) => setFormData({ ...formData, price: text })}
            placeholder="0.00"
            keyboardType="numeric"
          />
        </View>



        <View style={styles.inputGroup}>
          <Text style={styles.label}>Images (Max 4)</Text>
          <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
            <Upload size={20} color="#4b5563" />
            <Text style={styles.uploadText}>Choose Files</Text>
          </TouchableOpacity>
          
          <View style={styles.imagesGrid}>
            {formData.images.map((url, index) => (
              <View key={`existing-${index}`} style={styles.imageWrapper}>
                <Image source={{ uri: url }} style={styles.previewImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton} 
                  onPress={() => removeExistingImage(index)}
                >
                  <X size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {newImages.map((uri, index) => (
              <View key={`new-${index}`} style={styles.imageWrapper}>
                <Image source={{ uri: uri }} style={styles.previewImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton} 
                  onPress={() => removeNewImage(index)}
                >
                  <X size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Package description..."
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={[styles.row, isLargeScreen ? styles.halfWidth : { width: '100%' }]}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Days</Text>
            <TextInput
              style={styles.input}
              value={formData.number_of_days}
              onChangeText={(text) => setFormData({ ...formData, number_of_days: text })}
              placeholder="e.g. 3"
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Nights</Text>
            <TextInput
              style={styles.input}
              value={formData.number_of_nights}
              onChangeText={(text) => setFormData({ ...formData, number_of_nights: text })}
              placeholder="e.g. 2"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={[styles.row, isLargeScreen ? styles.halfWidth : { width: '100%' }]}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Room Capacity</Text>
            <TextInput
              style={styles.input}
              value={formData.room_capacity}
              onChangeText={(text) => setFormData({ ...formData, room_capacity: text })}
              placeholder="e.g. 2"
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Bed Count</Text>
            <TextInput
              style={styles.input}
              value={formData.bed_count}
              onChangeText={(text) => setFormData({ ...formData, bed_count: text })}
              placeholder="e.g. 1"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={[styles.inputGroup, isLargeScreen && styles.halfWidth]}>
          <Text style={styles.label}>Package Category</Text>
          <View style={styles.checkboxGroup}>
             <TouchableOpacity 
              style={styles.checkboxRow} 
              onPress={() => setFormData({ ...formData, is_corporate: !formData.is_corporate })}
            >
              {formData.is_corporate ? (
                <CheckSquare size={20} color="#db2777" />
              ) : (
                <Square size={20} color="#6b7280" />
              )}
              <Text style={styles.checkboxLabel}>Corporate</Text>
            </TouchableOpacity>

             <TouchableOpacity 
              style={styles.checkboxRow} 
              onPress={() => setFormData({ ...formData, is_wedding: !formData.is_wedding })}
            >
              {formData.is_wedding ? (
                <CheckSquare size={20} color="#db2777" />
              ) : (
                <Square size={20} color="#6b7280" />
              )}
              <Text style={styles.checkboxLabel}>Wedding</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Included Items</Text>
            <TouchableOpacity onPress={addIncludedItem} style={styles.addItemButton}>
              <Plus size={16} color="#db2777" />
              <Text style={styles.addItemText}>Add Item</Text>
            </TouchableOpacity>
          </View>
          {formData.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={item}
                onChangeText={(text) => updateIncludedItem(text, index)}
                placeholder="Item description"
              />
              <TouchableOpacity onPress={() => removeIncludedItem(index)} style={styles.deleteItemButton}>
                <Trash2 size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={[styles.inputGroup, isLargeScreen && styles.halfWidth]}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.status}
              onValueChange={(itemValue) => setFormData({ ...formData, status: itemValue })}
            >
              <Picker.Item label="Active" value="Active" />
              <Picker.Item label="Disabled" value="Disabled" />
            </Picker>
          </View>
        </View>

        <View style={[styles.switchRow, isLargeScreen && styles.halfWidth]}>
          <Text style={styles.label}>Featured Package</Text>
          <Switch
            value={formData.is_featured}
            onValueChange={(val) => setFormData({ ...formData, is_featured: val })}
            trackColor={{ false: '#767577', true: '#db2777' }}
            thumbColor={'#f4f3f4'}
          />
        </View>

        <View style={styles.footerButtons}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Save size={20} color="#fff" />
                <Text style={styles.saveText}>Save Package</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: { padding: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  form: { padding: 16, paddingBottom: 100, gap: 16 },
  formLarge: { flexDirection: 'row', flexWrap: 'wrap' },
  inputGroup: { marginBottom: 0 },
  halfWidth: { width: '48%' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  rowBetween: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 8
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 0,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  uploadText: { color: '#4b5563', fontSize: 16 },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 12,
  },
  imageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e5e7eb',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    padding: 4,
  },
  checkboxGroup: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxLabel: { fontSize: 16, color: '#374151' },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addItemText: { color: '#db2777', fontWeight: '600' },
  itemRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  deleteItemButton: {
    padding: 8,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#db2777',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  saveText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
