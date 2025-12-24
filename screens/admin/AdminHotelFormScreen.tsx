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
import { Save, ArrowLeft, Trash2, Upload, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../../context/ThemeContext';

export default function AdminHotelFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { id } = route.params || {};
  const { colors } = useTheme();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    // description: '',
    image_url: '',
    status: 'Active',
  });

  const [newImage, setNewImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchHotel();
    }
  }, [id]);

  const fetchHotel = async () => {
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      Alert.alert('Error', 'Failed to fetch hotel details');
      navigation.goBack();
    } else {
      setFormData({
        name: data?.name ?? '',
        address: data?.address ?? '',
        // description: data?.description ?? '',
        image_url: data?.image_url ?? '',
        status: data?.status ?? 'Active',
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
    if (!formData.name || !formData.address) {
      Alert.alert('Validation', 'Name and Address are required');
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = formData.image_url;

      if (newImage) {
        const url = await uploadImage(newImage, 'sakura', 'hotels');
        if (url) finalImageUrl = url;
      }

      const payload = {
        name: formData.name,
        address: formData.address,
        // description: formData.description,
        image_url: finalImageUrl,
        status: formData.status,
      };

      if (id) {
        const { error } = await supabase
          .from('hotels')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hotels')
          .insert([payload]);
        if (error) throw error;
      }
      
      Alert.alert(
        'Success',
        'Hotel saved successfully',
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
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{id ? 'Edit Hotel' : 'Add Hotel'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Hotel Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="e.g. Sakura Grand"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Address *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            placeholder="Full address"
            multiline
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
            // value={formData.description}
            // onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Hotel description..."
            multiline
            numberOfLines={4}
            placeholderTextColor={colors.textMuted}
          />
        </View> */}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Hotel Image</Text>
          {(formData.image_url || newImage) ? (
            <View style={[styles.imagePreviewContainer, { backgroundColor: colors.border }]}>
              <Image 
                source={{ uri: newImage || formData.image_url }} 
                style={styles.previewImage} 
              />
              <TouchableOpacity 
                style={styles.changeImageButton}
                onPress={pickImage}
              >
                <Text style={styles.changeImageText}>Change</Text>
              </TouchableOpacity>
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
          ) : (
            <TouchableOpacity onPress={pickImage} style={[styles.uploadButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Upload size={20} color={colors.textMuted} />
              <Text style={[styles.uploadText, { color: colors.textMuted }]}>Choose Image</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Status</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
            <Picker
              selectedValue={formData.status}
              onValueChange={(itemValue) => setFormData({ ...formData, status: itemValue })}
              style={{ color: colors.text }}
              dropdownIconColor={colors.text}
            >
              <Picker.Item label="Active" value="Active" color={colors.text} />
              <Picker.Item label="Maintenance" value="Maintenance" color={colors.text} />
              <Picker.Item label="Closed" value="Closed" color={colors.text} />
            </Picker>
          </View>
        </View>

        <View style={styles.footerButtons}>
          <TouchableOpacity 
            style={[styles.cancelButton, { backgroundColor: colors.card, borderColor: colors.border }]} 
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: colors.primary }]} 
            onPress={handleSave} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Save size={20} color="#fff" />
                <Text style={styles.saveText}>Save Hotel</Text>
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
    margin: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: { padding: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  form: { padding: 16, paddingBottom: 50 },
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
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
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
    padding: 24,
    gap: 8,
  },
  uploadText: { color: '#4b5563', fontSize: 16 },
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  changeImageText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    padding: 6,
    borderRadius: 20,
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
