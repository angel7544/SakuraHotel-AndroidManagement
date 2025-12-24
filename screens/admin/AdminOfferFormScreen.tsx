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
  Pressable
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { uploadImage } from '../../lib/upload';
import { ArrowLeft, CheckSquare, Square, X, Calendar } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import DateTimePicker from '@react-native-community/datetimepicker';

const DateInput = ({ label, value, onChange }: { label: string, value: string, onChange: (t: string) => void }) => {
  const [show, setShow] = useState(false);

  const handleChange = (event: any, selectedDate?: Date) => {
    setShow(false);
    if (selectedDate) {
      // Format to YYYY-MM-DD for consistency
      const formatted = selectedDate.toISOString().split('T')[0];
      onChange(formatted);
    }
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity 
        style={styles.dateInputContainer}
        onPress={() => setShow(true)}
      >
        <TextInput
          style={styles.dateInput}
          value={value}
          editable={false}
          placeholder="YYYY-MM-DD"
        />
        <Calendar size={20} color="#111827" />
      </TouchableOpacity>
      
      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={value ? new Date(value) : new Date()}
          mode="date"
          is24Hour={true}
          onChange={handleChange}
        />
      )}
    </View>
  );
};

export default function AdminOfferFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { id } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount_value: '',
    code: '',
    start_date: '',
    end_date: '',
    is_active: true,
    image_url: '',
  });

  const [newImage, setNewImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchOffer();
    }
  }, [id]);

  const fetchOffer = async () => {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      Alert.alert('Error', 'Failed to fetch offer details');
      navigation.goBack();
    } else {
      setFormData({
        title: data.title || '',
        description: data.description || '',
        discount_value: data.discount_value || '',
        code: data.discount_code || '',
        start_date: data.start_date ? new Date(data.start_date).toISOString().split('T')[0] : '',
        end_date: data.end_date ? new Date(data.end_date).toISOString().split('T')[0] : '',
        is_active: typeof data.is_active === 'boolean' ? data.is_active : true,
        image_url: data.image_url || '',
      });
    }
    setFetching(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      setNewImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.discount_value) {
      Alert.alert('Validation', 'Title and Discount Value are required');
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = formData.image_url;

      if (newImage) {
        const url = await uploadImage(newImage, 'sakura', 'offers');
        if (url) finalImageUrl = url;
      }

      const payload = {
        title: formData.title,
        description: formData.description || null,
        discount_code: formData.code || null,
        discount_value: formData.discount_value,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        is_active: formData.is_active,
        image_url: finalImageUrl,
      };

      if (id) {
        const { error } = await supabase
          .from('offers')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('offers')
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
        <Text style={styles.title}>{id ? 'Edit Offer' : 'Create Offer'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            placeholder=""
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder=""
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Discount Value</Text>
            <TextInput
              style={styles.input}
              value={formData.discount_value}
              onChangeText={(text) => setFormData({ ...formData, discount_value: text })}
              placeholder="e.g. 20% OFF"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Code (Optional)</Text>
            <TextInput
              style={styles.input}
              value={formData.code}
              onChangeText={(text) => setFormData({ ...formData, code: text })}
              placeholder="e.g. SUMMER20"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Image</Text>
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

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <DateInput 
              label="Start Date" 
              value={formData.start_date} 
              onChange={(t) => setFormData({ ...formData, start_date: t })}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
             <DateInput 
              label="End Date" 
              value={formData.end_date} 
              onChange={(t) => setFormData({ ...formData, end_date: t })}
            />
          </View>
        </View>

        <View style={styles.checkboxGroup}>
          <Pressable 
            style={styles.checkboxRow} 
            onPress={() => setFormData({ ...formData, is_active: !formData.is_active })}
          >
            {formData.is_active ? (
              <View style={styles.checkboxChecked}>
                <CheckSquare size={20} color="#db2777" />
              </View>
            ) : (
               <Square size={20} color="#d1d5db" />
            )}
            <Text style={styles.checkboxLabel}>Active</Text>
          </Pressable>
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
                <Text style={styles.saveText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 40,
    backgroundColor: '#fff',
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
    width: '100%',
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f3f4f6',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    padding: 4,
    borderRadius: 12,
  },
  
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    paddingHorizontal: 12,
  },
  dateInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  
  checkboxGroup: { marginBottom: 24 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkboxChecked: { },
  checkboxLabel: { fontSize: 16, color: '#111827' },

  footerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#db2777',
  },
  saveText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
