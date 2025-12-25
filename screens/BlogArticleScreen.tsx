import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, FlatList, TouchableOpacity, Dimensions, Linking } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Calendar, User, ExternalLink, ImageIcon } from 'lucide-react-native';
import Header from '../components/Header';

type BlogItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  is_published: boolean;
  cover_image: string | null;
  gallery_images: string[] | null;
  created_at: string;
  author: string | null;
  author_avatar?: string | null;
};

const SITE_URL = 'https://hotelsakura.in';
const { width } = Dimensions.get('window');

export default function BlogArticleScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { slug } = route.params || {};

  const [blog, setBlog] = useState<BlogItem | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBlog = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();
    if (!error) {
      setBlog(data as BlogItem);
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchBlog();
  }, [fetchBlog]);

  const openExternal = () => {
    if (!blog?.slug) return;
    Linking.openURL(`${SITE_URL}/blog/${blog.slug}`);
  };

  const images = (blog?.gallery_images || []).filter(Boolean);
  const mainImage = blog?.cover_image || images[0] || null;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!blog) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <Header />
        <View style={[styles.topBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { color: colors.text }]}>Article</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Article not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header />
      <View style={[styles.topBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: colors.text }]} numberOfLines={1}>{blog.title}</Text>
        <TouchableOpacity style={styles.externalBtn} onPress={openExternal}>
          <ExternalLink size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {mainImage ? (
          <Image source={{ uri: mainImage }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroPlaceholder, { backgroundColor: colors.card }]}>
            <ImageIcon size={28} color={colors.textMuted} />
          </View>
        )}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Calendar size={14} color={colors.textMuted} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              {new Date(blog.created_at).toLocaleDateString()}
            </Text>
          </View>
          {blog.author ? (
            <View style={styles.metaItem}>
              <User size={14} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textMuted }]} numberOfLines={1}>
                {blog.author}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.title}>{blog.title}</Text>
        {blog.excerpt ? <Text style={styles.excerpt}>{blog.excerpt}</Text> : null}

        {images.length > 1 && (
          <FlatList
            data={images}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gallery}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.galleryImage} />
            )}
            keyExtractor={(uri, idx) => `${uri}-${idx}`}
          />
        )}

        {blog.content ? (
          <Text style={styles.contentText}>{blog.content}</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  externalBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { fontSize: 18, fontWeight: '700' },
  content: { paddingBottom: 24 },
  heroImage: { width, height: width * 0.6 },
  heroPlaceholder: { width, height: width * 0.6, alignItems: 'center', justifyContent: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', paddingHorizontal: 16, marginTop: 4 },
  excerpt: { fontSize: 14, color: '#6b7280', paddingHorizontal: 16, marginTop: 6 },
  gallery: { paddingHorizontal: 16, gap: 8 },
  galleryImage: { width: 160, height: 100, borderRadius: 8, marginRight: 8 },
  contentText: { fontSize: 16, lineHeight: 24, color: '#374151', paddingHorizontal: 16, paddingTop: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16 },
})
