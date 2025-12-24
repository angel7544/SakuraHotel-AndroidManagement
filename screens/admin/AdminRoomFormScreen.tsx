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
  FlatList
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { uploadImage } from '../../lib/upload';
import { Save, ArrowLeft, Image as ImageIcon, X, Upload } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';

export default function AdminRoomFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { id } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [hotels, setHotels] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    room_number: '',
    type: 'Standard',
    price: '',
    description: '',
    image_url: '',
    images: [] as string[],
    status: 'Available',
    hotel_id: '',
    capacity: '2',
    bed_type: 'Queen',
    bed_count: '1',
    amenities: '',
    view_type: 'City View'
  });

  const [newImages, setNewImages] = useState<string[]>([]); // Local URIs

  useEffect(() => {
    fetchHotels();
    if (id) {
      fetchRoom();
    }
  }, [id]);

  const fetchHotels = async () => {
    const { data } = await supabase.from('hotels').select('id, name');
    if (data) {
      setHotels(data);
      if (!formData.hotel_id && data.length > 0) {
        setFormData(prev => ({ ...prev, hotel_id: data[0].id }));
      }
    }
  };

  const fetchRoom = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      Alert.alert('Error', 'Failed to fetch room details');
      navigation.goBack();
    } else {
      setFormData({
        ...data,
        price: data.price?.toString() || '',
        capacity: data.capacity?.toString() || '2',
        bed_count: data.bed_count?.toString() || '1',
        amenities: data.amenities ? data.amenities.join(', ') : '',
        images: data.images || (data.image_url ? [data.image_url] : [])
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
    if (!formData.room_number || !formData.price || !formData.hotel_id) {
      Alert.alert('Validation', 'Room Number, Price, and Hotel are required');
      return;
    }

    setLoading(true);
    try {
      // Upload new images
      const uploadedUrls: string[] = [];
      for (const uri of newImages) {
        const url = await uploadImage(uri, 'sakura', 'rooms');
        if (url) uploadedUrls.push(url);
      }

      const finalImages = [...formData.images, ...uploadedUrls];
      const finalImageUrl = finalImages.length > 0 ? finalImages[0] : '';
      const amenitiesArray = formData.amenities.split(',').map(i => i.trim()).filter(i => i !== '');

      const payload = {
        room_number: formData.room_number,
        type: formData.type,
        price: parseFloat(formData.price),
        status: formData.status,
        hotel_id: formData.hotel_id,
        description: formData.description,
        image_url: finalImageUrl,
        images: finalImages,
        capacity: parseInt(formData.capacity) || 2,
        bed_type: formData.bed_type,
        bed_count: parseInt(formData.bed_count) || 1,
        amenities: amenitiesArray,
        view_type: formData.view_type
      };

      if (id) {
        const { error } = await supabase.from('rooms').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('rooms').insert([payload]);
        if (error) throw error;
      }
      
      Alert.alert(
        'Success',
        'Room saved successfully',
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
        <Text style={styles.title}>{id ? 'Edit Room' : 'Add Room'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveButton}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Save size={20} color="#fff" />}
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hotel *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.hotel_id}
              onValueChange={(itemValue) => setFormData({ ...formData, hotel_id: itemValue })}
            >
              {hotels.map(h => (
                <Picker.Item key={h.id} label={h.name} value={h.id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Room Number *</Text>
          <TextInput
            style={styles.input}
            value={formData.room_number}
            onChangeText={(text) => setFormData({ ...formData, room_number: text })}
            placeholder="e.g. 101"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.type}
                onValueChange={(itemValue) => setFormData({ ...formData, type: itemValue })}
              >
                <Picker.Item label="Standard" value="Standard" />
                <Picker.Item label="Deluxe" value="Deluxe" />
                <Picker.Item label="Suite" value="Suite" />
                <Picker.Item label="Family" value="Family" />
              </Picker>
            </View>
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Price (₹) *</Text>
            <TextInput
              style={styles.input}
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Capacity</Text>
            <TextInput
              style={styles.input}
              value={formData.capacity}
              onChangeText={(text) => setFormData({ ...formData, capacity: text })}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>View Type</Text>
            <TextInput
              style={styles.input}
              value={formData.view_type}
              onChangeText={(text) => setFormData({ ...formData, view_type: text })}
              placeholder="City View"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Bed Count</Text>
            <TextInput
              style={styles.input}
              value={formData.bed_count}
              onChangeText={(text) => setFormData({ ...formData, bed_count: text })}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Bed Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.bed_type}
                onValueChange={(itemValue) => setFormData({ ...formData, bed_type: itemValue })}
              >
                <Picker.Item label="Queen" value="Queen" />
                <Picker.Item label="King" value="King" />
                <Picker.Item label="Single" value="Single" />
                <Picker.Item label="Double" value="Double" />
                <Picker.Item label="Twin" value="Twin" />
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amenities (comma separated)</Text>
          <TextInput
            style={styles.input}
            value={formData.amenities}
            onChangeText={(text) => setFormData({ ...formData, amenities: text })}
            placeholder="WiFi, TV, AC..."
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.status}
              onValueChange={(itemValue) => setFormData({ ...formData, status: itemValue })}
            >
              <Picker.Item label="Available" value="Available" />
              <Picker.Item label="Occupied" value="Occupied" />
              <Picker.Item label="Maintenance" value="Maintenance" />
              <Picker.Item label="Reserved" value="Reserved" />
              <Picker.Item label="Blocked" value="Blocked" />
              <Picker.Item label="Booked" value="Booked" />
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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Room details..."
            multiline
            numberOfLines={4}
          />
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
  backButton: { padding: 4 },
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
  row: { flexDirection: 'row' },
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
