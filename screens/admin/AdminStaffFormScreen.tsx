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
import { ArrowLeft, X } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';

const BACKEND_URL = "https://hotelsakura.in";

export default function AdminStaffFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { id } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [hotels, setHotels] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Other',
    hotel_id: '',
    image_url: '',
    password: '',
  });

  const [newImage, setNewImage] = useState<string | null>(null);

  useEffect(() => {
    fetchHotels();
    if (id) {
      fetchStaff();
    }
  }, [id]);

  const fetchHotels = async () => {
    const { data } = await supabase.from('hotels').select('id, name');
    if (data) setHotels(data);
  };

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      Alert.alert('Error', 'Failed to fetch staff details');
      navigation.goBack();
    } else {
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        role: data.role || 'Other',
        hotel_id: data.hotel_id || '',
        image_url: data.image_url || '',
        password: '',
      });
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
    if (!formData.name) {
      Alert.alert('Validation', 'Name is required');
      return;
    }

    if (!id && (!formData.email || !formData.password || formData.password.length < 6)) {
      Alert.alert('Validation', 'Email and Password (min 6 chars) are required for new staff');
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = formData.image_url;

      if (newImage) {
        const url = await uploadImage(newImage, 'sakura', 'staff');
        if (url) finalImageUrl = url;
      }

      if (id) {
        // Update existing staff profile
        const payload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          hotel_id: formData.hotel_id || null,
          image_url: finalImageUrl,
        };

        const { error } = await supabase
          .from('staff')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
      } else {
        // Create new staff using backend API
        const response = await fetch(`${BACKEND_URL}/api/admin/create-staff`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            phone: formData.phone,
            hotel_id: formData.hotel_id || null,
            image_url: finalImageUrl,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to create staff");
        }
      }
      
      Alert.alert('Success', 'Staff saved successfully');
      navigation.goBack();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to save staff');
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
        <Text style={styles.title}>{id ? 'Edit Staff' : 'Add Staff'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder=""
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Role</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.role}
                onValueChange={(val) => setFormData({ ...formData, role: val })}
              >
                <Picker.Item label="Manager" value="Manager" />
                <Picker.Item label="Receptionist" value="Receptionist" />
                <Picker.Item label="Housekeeping" value="Housekeeping" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Assign Hotel</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.hotel_id}
                onValueChange={(val) => setFormData({ ...formData, hotel_id: val })}
              >
                <Picker.Item label="-- No Hotel --" value="" />
                {hotels.map((hotel) => (
                  <Picker.Item key={hotel.id} label={hotel.name} value={hotel.id} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="ajktalent@gmail.in"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {!id && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              placeholder="Min 6 characters"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder=""
            keyboardType="phone-pad"
          />
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
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
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
