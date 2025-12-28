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
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { uploadImage } from '../../lib/upload';
import { Save, ArrowLeft, Image as ImageIcon, Star, Trash2 } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';

export default function AdminTestimonialFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { id } = route.params || {};
  const { colors } = useTheme();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    message: "",
    rating: 5,
    rooms_rating: 5.0,
    service_rating: 5.0,
    location_rating: 5.0,
    hotel_highlights: "",
    walkability: "",
    food_and_drinks: "",
    status: "Active",
    image_url: ""
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
      Alert.alert('Error', 'Failed to fetch testimonial');
      navigation.goBack();
    } else {
      setFormData({
        name: data.name || "",
        role: data.role || "",
        message: data.message || "",
        rating: data.rating || 5,
        rooms_rating: data.rooms_rating || 5.0,
        service_rating: data.service_rating || 5.0,
        location_rating: data.location_rating || 5.0,
        hotel_highlights: data.hotel_highlights || "",
        walkability: data.walkability || "",
        food_and_drinks: data.food_and_drinks || "",
        status: data.status || "Active",
        image_url: data.image_url || ""
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
    if (!formData.name || !formData.message) {
      Alert.alert('Validation', 'Name and Message are required');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = formData.image_url;

      if (newImage) {
        const url = await uploadImage(newImage, 'sakura', 'testimonials');
        if (url) imageUrl = url;
      }

      const payload = {
        name: formData.name,
        role: formData.role || null,
        message: formData.message,
        rating: Number(formData.rating),
        rooms_rating: formData.rooms_rating ? Number(formData.rooms_rating) : null,
        service_rating: formData.service_rating ? Number(formData.service_rating) : null,
        location_rating: formData.location_rating ? Number(formData.location_rating) : null,
        hotel_highlights: formData.hotel_highlights || null,
        walkability: formData.walkability || null,
        food_and_drinks: formData.food_and_drinks || null,
        status: formData.status,
        image_url: imageUrl
      };

      if (id) {
        const { error } = await supabase.from('testimonials').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('testimonials').insert([payload]);
        if (error) throw error;
      }
      
      Alert.alert(
        'Success',
        'Testimonial saved successfully',
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
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{id ? 'Edit Testimonial' : 'Add Testimonial'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading} style={[styles.saveButton, { backgroundColor: colors.primary }]}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Save size={20} color="#fff" />}
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        
        {/* Image Upload */}
        <View style={styles.imageSection}>
          <TouchableOpacity onPress={pickImage} style={[styles.imagePlaceholder, { borderColor: colors.border, backgroundColor: colors.card }]}>
            {newImage || formData.image_url ? (
              <Image source={{ uri: newImage || formData.image_url }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholderContent}>
                <ImageIcon size={32} color={colors.textMuted} />
                <Text style={[styles.imagePlaceholderText, { color: colors.textMuted }]}>Add Photo</Text>
              </View>
            )}
            <View style={[styles.editIconBadge, { backgroundColor: colors.primary }]}>
                <ImageIcon size={14} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Basic Info */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Guest Name *</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="e.g. John Doe"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Role / Title</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={formData.role}
              onChangeText={(text) => setFormData({ ...formData, role: text })}
              placeholder="e.g. Business Traveler"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Message *</Text>
            <TextInput
              style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={formData.message}
              onChangeText={(text) => setFormData({ ...formData, message: text })}
              placeholder="Guest's feedback..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Ratings */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ratings</Text>
          
          <View style={styles.ratingInputRow}>
            <Text style={[styles.label, { color: colors.textSecondary, flex: 1 }]}>Overall Rating</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={formData.rating}
                    onValueChange={(itemValue) => setFormData({ ...formData, rating: itemValue })}
                    style={{ height: 50, width: 120, color: colors.text }}
                    dropdownIconColor={colors.text}
                >
                    {[1, 2, 3, 4, 5].map((r) => (
                        <Picker.Item key={r} label={r.toString()} value={r} />
                    ))}
                </Picker>
            </View>
          </View>

          <View style={styles.ratingInputRow}>
            <Text style={[styles.label, { color: colors.textSecondary, flex: 1 }]}>Rooms Rating</Text>
             <TextInput
              style={[styles.smallInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={formData.rooms_rating.toString()}
              onChangeText={(text) => setFormData({ ...formData, rooms_rating: parseFloat(text) || 0 })}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.ratingInputRow}>
            <Text style={[styles.label, { color: colors.textSecondary, flex: 1 }]}>Service Rating</Text>
            <TextInput
              style={[styles.smallInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={formData.service_rating.toString()}
              onChangeText={(text) => setFormData({ ...formData, service_rating: parseFloat(text) || 0 })}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.ratingInputRow}>
            <Text style={[styles.label, { color: colors.textSecondary, flex: 1 }]}>Location Rating</Text>
            <TextInput
              style={[styles.smallInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={formData.location_rating.toString()}
              onChangeText={(text) => setFormData({ ...formData, location_rating: parseFloat(text) || 0 })}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Additional Details */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Highlights & Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Hotel Highlights</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={formData.hotel_highlights}
              onChangeText={(text) => setFormData({ ...formData, hotel_highlights: text })}
              placeholder="e.g. Great view, Clean rooms"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Walkability</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={formData.walkability}
              onChangeText={(text) => setFormData({ ...formData, walkability: text })}
              placeholder="e.g. Near to city center"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Food & Drinks</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={formData.food_and_drinks}
              onChangeText={(text) => setFormData({ ...formData, food_and_drinks: text })}
              placeholder="e.g. Excellent breakfast"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        {/* Status */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Status</Text>
          <View style={[styles.pickerContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Picker
              selectedValue={formData.status}
              onValueChange={(itemValue) => setFormData({ ...formData, status: itemValue })}
              style={{ color: colors.text }}
              dropdownIconColor={colors.text}
            >
              <Picker.Item label="Active" value="Active" />
              <Picker.Item label="Inactive" value="Inactive" />
            </Picker>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: 'bold' },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  saveText: { color: '#fff', fontWeight: '600' },
  form: { padding: 16 },
  imageSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  imagePlaceholderContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imagePlaceholderText: {
    fontSize: 10,
    marginTop: 4,
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  smallInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    width: 80,
    textAlign: 'center',
  },
  textArea: {
    height: 100,
  },
  ratingInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
