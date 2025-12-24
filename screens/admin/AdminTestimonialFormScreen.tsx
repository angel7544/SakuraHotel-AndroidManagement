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
import { Save, ArrowLeft, Upload, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';

export default function AdminTestimonialFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { id } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    message: '',
    rating: 5,
    status: 'Active',
    image_url: '',
  });

  const [newImage, setNewImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchTestimonial();
    }
  }, [id]);

  const fetchTestimonial = async () => {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      Alert.alert('Error', 'Failed to fetch testimonial details');
      navigation.goBack();
    } else {
      setFormData(data);
    }
    setFetching(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setNewImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.message) {
      Alert.alert('Validation', 'Name and Message are required');
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = formData.image_url;

      if (newImage) {
        const url = await uploadImage(newImage, 'sakura', 'testimonials');
        if (url) finalImageUrl = url;
      }

      const payload = {
        ...formData,
        image_url: finalImageUrl,
      };

      if (id) {
        const { error } = await supabase
          .from('testimonials')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('testimonials')
          .insert([payload]);
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
        <Text style={styles.title}>{id ? 'Edit Testimonial' : 'New Testimonial'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="John Doe"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Role</Text>
            <TextInput
              style={styles.input}
              value={formData.role}
              onChangeText={(text) => setFormData({ ...formData, role: text })}
              placeholder="CEO, Tech Corp"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Message *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.message}
            onChangeText={(text) => setFormData({ ...formData, message: text })}
            placeholder="Share the experience..."
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Rating</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.rating}
                onValueChange={(itemValue) => setFormData({ ...formData, rating: itemValue })}
              >
                <Picker.Item label="5 Stars" value={5} />
                <Picker.Item label="4 Stars" value={4} />
                <Picker.Item label="3 Stars" value={3} />
                <Picker.Item label="2 Stars" value={2} />
                <Picker.Item label="1 Star" value={1} />
              </Picker>
            </View>
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.status}
                onValueChange={(itemValue) => setFormData({ ...formData, status: itemValue })}
              >
                <Picker.Item label="Active" value="Active" />
                <Picker.Item label="Inactive" value="Inactive" />
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Photo</Text>
          <View style={styles.fileInputRow}>
            <TouchableOpacity onPress={pickImage} style={styles.chooseFileButton}>
              <Text style={styles.chooseFileText}>Choose File</Text>
            </TouchableOpacity>
            <Text style={styles.fileNameText}>
              {newImage ? 'Image selected' : (formData.image_url ? 'Current image' : 'No file chosen')}
            </Text>
          </View>
          
          {(formData.image_url || newImage) && (
             <View style={styles.imagePreviewContainer}>
               <Image 
                 source={{ uri: newImage || formData.image_url }} 
                 style={styles.previewImage} 
               />
               <TouchableOpacity 
                 style={styles.removeImageButton}
                 onPress={() => {
                   setNewImage(null);
                   setFormData({ ...formData, image_url: '' });
                 }}
               >
                 <X size={16} color="#fff" />
               </TouchableOpacity>
             </View>
          )}
        </View>

        <View style={styles.footerButtons}>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' }, // White bg as per mockup modal look, but screen is fine
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
  form: { padding: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  row: { flexDirection: 'row' },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  
  fileInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 6,
  },
  chooseFileButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  chooseFileText: {
    color: '#111827',
    fontSize: 14,
  },
  fileNameText: {
    color: '#6b7280',
    fontSize: 14,
  },
  imagePreviewContainer: {
    marginTop: 12,
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f3f4f6',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    padding: 4,
    borderRadius: 12,
  },

  footerButtons: {
    marginTop: 12,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 6,
    backgroundColor: '#db2777',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});