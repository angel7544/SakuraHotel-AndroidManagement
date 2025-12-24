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
  Image
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { uploadImage } from '../../lib/upload';
import { Save, ArrowLeft, X, Upload } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';

export default function AdminServiceFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { id } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'lodging',
    price: '',
    description: '',
    image_url: '',
    images: [] as string[],
    status: 'Active',
  });

  const [newImages, setNewImages] = useState<string[]>([]);
  const serviceTypes = ['lodging', 'fooding', 'travel', 'sightseeing', 'party', 'other'];

  useEffect(() => {
    if (id) {
      fetchService();
    }
  }, [id]);

  const fetchService = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      Alert.alert('Error', 'Failed to fetch service details');
      navigation.goBack();
    } else {
      setFormData({
        ...data,
        price: data.price?.toString() || '',
        images: data.images || (data.image_url ? [data.image_url] : []),
        status: data.status || 'Active',
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

  const handleSave = async () => {
    if (!formData.name) {
      Alert.alert('Validation', 'Name is required');
      return;
    }

    setLoading(true);
    try {
      // Upload new images
      const uploadedUrls: string[] = [];
      for (const uri of newImages) {
        const url = await uploadImage(uri, 'sakura', 'services');
        if (url) uploadedUrls.push(url);
      }

      const finalImages = [...formData.images, ...uploadedUrls];
      const finalImageUrl = finalImages.length > 0 ? finalImages[0] : '';

      const payload = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
        image_url: finalImageUrl,
        images: finalImages,
      };

      if (id) {
        const { error } = await supabase.from('services').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('services').insert([payload]);
        if (error) throw error;
      }
      
      Alert.alert(
        'Success',
        'Service saved successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
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
        <Text style={styles.title}>{id ? 'Edit Service' : 'Add Service'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveButton}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Save size={20} color="#fff" />}
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Service Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="e.g. Airport Transfer"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.type}
              onValueChange={(itemValue) => setFormData({ ...formData, type: itemValue })}
            >
              {serviceTypes.map(t => (
                <Picker.Item key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} value={t} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price (₹) (Optional)</Text>
          <TextInput
            style={styles.input}
            value={formData.price}
            onChangeText={(text) => setFormData({ ...formData, price: text })}
            placeholder="0.00"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Service details..."
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#db2777',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  saveText: { color: '#fff', fontWeight: '600' },
  form: { padding: 16 },
  inputGroup: { marginBottom: 16 },
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
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
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
});
