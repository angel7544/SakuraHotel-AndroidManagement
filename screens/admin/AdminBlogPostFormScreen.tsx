import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { uploadImage } from '../../lib/upload';
import { ArrowLeft, Save, Upload, X, Image as ImageIcon, User } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';

type BlogFormData = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  gallery_images: string[];
  author: string;
  author_avatar: string;
  author_bio: string;
  tags: string;
  seo_title: string;
  seo_description: string;
  is_published: boolean;
};

export default function AdminBlogPostFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const { id } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);

  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image: '',
    gallery_images: [],
    author: '',
    author_avatar: '',
    author_bio: '',
    tags: '',
    seo_title: '',
    seo_description: '',
    is_published: false,
  });

  const [newCoverUri, setNewCoverUri] = useState<string | null>(null);
  const [newGalleryUris, setNewGalleryUris] = useState<string[]>([]);
  const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchBlog();
    }
  }, [id]);

  const fetchBlog = async () => {
    setFetching(true);
    const { data, error } = await supabase.from('blogs').select('*').eq('id', id).maybeSingle();
    if (error) {
      Alert.alert('Error', 'Failed to fetch blog');
      navigation.goBack();
    } else if (data) {
      setFormData({
        title: data.title || '',
        slug: data.slug || '',
        excerpt: data.excerpt || '',
        content: data.content || '',
        cover_image: data.cover_image || '',
        gallery_images: data.gallery_images || [],
        author: data.author || '',
        author_avatar: data.author_avatar || '',
        author_bio: data.author_bio || '',
        tags: (data.tags || []).join(', '),
        seo_title: data.seo_title || '',
        seo_description: data.seo_description || '',
        is_published: !!data.is_published,
      });
    }
    setFetching(false);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const pickImage = async (type: 'cover' | 'gallery' | 'avatar') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    if (type === 'cover') setNewCoverUri(uri);
    else if (type === 'avatar') setNewAvatarUri(uri);
    else setNewGalleryUris((prev) => [...prev, uri]);
  };

  const removeExistingGalleryImage = (index: number) => {
    const updated = [...formData.gallery_images];
    updated.splice(index, 1);
    setFormData({ ...formData, gallery_images: updated });
  };

  const removeNewGalleryImage = (index: number) => {
    const updated = [...newGalleryUris];
    updated.splice(index, 1);
    setNewGalleryUris(updated);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.slug || !formData.content) {
      Alert.alert('Validation', 'Title, Slug and Content are required');
      return;
    }

    setLoading(true);
    try {
      const payload: any = { ...formData };
      payload.tags = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t);

      if (newCoverUri) {
        const url = await uploadImage(newCoverUri, 'sakura', 'blogs');
        payload.cover_image = url;
      }
      if (newAvatarUri) {
        const url = await uploadImage(newAvatarUri, 'sakura', 'blogs');
        payload.author_avatar = url;
      }
      const uploadedGallery: string[] = [];
      for (const uri of newGalleryUris) {
        const url = await uploadImage(uri, 'sakura', 'blogs');
        uploadedGallery.push(url);
      }
      payload.gallery_images = [...(formData.gallery_images || []), ...uploadedGallery];

      if (id) {
        const { error } = await supabase.from('blogs').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('blogs').insert([payload]);
        if (error) throw error;
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save blog');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {id ? 'Edit Blog' : 'Create Blog'}
        </Text>
      </View>

      {fetching ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Content</Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Title</Text>
            <TextInput
              value={formData.title}
              onChangeText={(t) =>
                setFormData((prev) => ({ ...prev, title: t, slug: !id ? generateSlug(t) : prev.slug }))
              }
              placeholder="Enter blog title"
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Slug</Text>
            <TextInput
              value={formData.slug}
              onChangeText={(t) => setFormData({ ...formData, slug: t })}
              placeholder="url-friendly-slug"
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              autoCapitalize="none"
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Excerpt</Text>
            <TextInput
              value={formData.excerpt}
              onChangeText={(t) => setFormData({ ...formData, excerpt: t })}
              placeholder="Short summary..."
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              multiline
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Content</Text>
            <TextInput
              value={formData.content}
              onChangeText={(t) => setFormData({ ...formData, content: t })}
              placeholder="Write your blog content..."
              style={[styles.textarea, { borderColor: colors.border, color: colors.text }]}
              multiline
            />
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.rowBetween}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Gallery</Text>
              <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage('gallery')}>
                <Upload size={18} color={colors.textSecondary} />
                <Text style={[styles.uploadText, { color: colors.textSecondary }]}>Add Image</Text>
              </TouchableOpacity>
            </View>

            {formData.gallery_images.length === 0 && newGalleryUris.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: colors.border }]}>
                <ImageIcon size={24} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>No gallery images</Text>
              </View>
            ) : (
              <View style={styles.imagesGrid}>
                {formData.gallery_images.map((url, index) => (
                  <View key={`ex-${index}`} style={styles.imageWrapper}>
                    <Image source={{ uri: url }} style={styles.image} />
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => removeExistingGalleryImage(index)}
                    >
                      <X size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                {newGalleryUris.map((uri, index) => (
                  <View key={`new-${index}`} style={styles.imageWrapper}>
                    <Image source={{ uri }} style={styles.image} />
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeNewGalleryImage(index)}>
                      <X size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>SEO</Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>SEO Title</Text>
            <TextInput
              value={formData.seo_title}
              onChangeText={(t) => setFormData({ ...formData, seo_title: t })}
              placeholder="Optional"
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>SEO Description</Text>
            <TextInput
              value={formData.seo_description}
              onChangeText={(t) => setFormData({ ...formData, seo_description: t })}
              placeholder="Optional"
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              multiline
            />
          </View>

          

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Cover Image</Text>
            {formData.cover_image || newCoverUri ? (
              <View style={styles.coverPreview}>
                <Image source={{ uri: newCoverUri || formData.cover_image }} style={styles.coverImage} />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => {
                    setFormData({ ...formData, cover_image: '' });
                    setNewCoverUri(null);
                  }}
                >
                  <X size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadArea} onPress={() => pickImage('cover')}>
                <Upload size={22} color={colors.textSecondary} />
                <Text style={[styles.uploadText, { color: colors.textSecondary }]}>Upload Cover</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Author & Tags</Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Author Name</Text>
            <TextInput
              value={formData.author}
              onChangeText={(t) => setFormData({ ...formData, author: t })}
              placeholder="e.g. John Doe"
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Author Avatar</Text>
            <View style={styles.authorRow}>
              <View style={styles.avatarCircle}>
                {formData.author_avatar || newAvatarUri ? (
                  <Image source={{ uri: newAvatarUri || formData.author_avatar }} style={styles.avatarImage} />
                ) : (
                  <User size={22} color={colors.textMuted} />
                )}
              </View>
              <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage('avatar')}>
                <Upload size={18} color={colors.textSecondary} />
                <Text style={[styles.uploadText, { color: colors.textSecondary }]}>Change Avatar</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Author Bio</Text>
            <TextInput
              value={formData.author_bio}
              onChangeText={(t) => setFormData({ ...formData, author_bio: t })}
              placeholder="Short biography..."
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              multiline
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Tags (comma separated)</Text>
            <TextInput
              value={formData.tags}
              onChangeText={(t) => setFormData({ ...formData, tags: t })}
              placeholder="seo, travel, tips"
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              autoCapitalize="none"
            />
             </View>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Publishing</Text>
            <View style={styles.publishRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Published</Text>
              <TouchableOpacity
                onPress={() => setFormData((prev) => ({ ...prev, is_published: !prev.is_published }))}
                style={styles.toggleBtn}
              >
                <View
                  style={[
                    styles.toggleTrack,
                    { backgroundColor: formData.is_published ? colors.primary : colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      { transform: [{ translateX: formData.is_published ? 18 : 0 }] },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Save size={18} color="#fff" />
                  <Text style={styles.saveText}>Save Blog</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
         
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 12, gap: 12 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  label: { fontSize: 13, marginTop: 10, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 160,
    textAlignVertical: 'top',
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  uploadText: { fontSize: 13 },
  emptyBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: { fontSize: 12 },
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  imageWrapper: { width: 80, height: 80, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  image: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 4,
  },
  publishRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  toggleBtn: { padding: 4 },
  toggleTrack: { width: 40, height: 20, borderRadius: 20, justifyContent: 'center', padding: 2 },
  toggleThumb: { width: 16, height: 16, borderRadius: 16, backgroundColor: '#fff' },
  saveBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  center: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveText: { color: '#fff', fontWeight: '700' },
  uploadArea: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  coverPreview: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  coverImage: { width: '100%', height: '100%' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  avatarImage: { width: '100%', height: '100%' },
});
