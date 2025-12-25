import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Linking, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { Calendar, User, BookOpen, ExternalLink } from 'lucide-react-native';
import Header from '../components/Header';
import { useNavigation } from '@react-navigation/native';

type BlogItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  is_published: boolean;
  cover_image: string | null;
  gallery_images: string[] | null;
  created_at: string;
  author: string | null;
  author_avatar?: string | null;
};

const SITE_URL = 'https://hotelsakura.in';

export default function BlogScreen() {
  const { colors } = useTheme();
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    if (!error) {
      setBlogs((data || []) as BlogItem[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBlogs();
    const channel = supabase
      .channel('client-blogs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blogs' }, fetchBlogs)
      .subscribe();
    const interval = setInterval(() => {
      fetchBlogs();
    }, 5000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchBlogs]);

  const navigation = useNavigation<any>();
  const openArticle = (slug?: string | null) => {
    if (!slug) return;
    navigation.navigate('BlogArticle', { slug });
  };

  const renderItem = ({ item }: { item: BlogItem }) => {
    const image =
      item.cover_image ||
      (item.gallery_images && item.gallery_images.length > 0 ? item.gallery_images[0] : null);

    return (
      <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => openArticle(item.slug)}>
        <View style={styles.thumb}>
          {image ? (
            <Image source={{ uri: image }} style={styles.thumbImage} />
          ) : (
            <View style={[styles.thumbPlaceholder, { backgroundColor: colors.background }]}>
              <BookOpen size={24} color={colors.textMuted} />
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.excerpt, { color: colors.textSecondary }]} numberOfLines={3}>
            {item.excerpt || ''}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Calendar size={14} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
            {item.author ? (
              <View style={styles.metaItem}>
                <User size={14} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textMuted }]} numberOfLines={1}>
                  {item.author}
                </Text>
              </View>
            ) : null}
            <View style={[styles.readBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <ExternalLink size={14} color={colors.primary} />
              <Text style={[styles.readText, { color: colors.primary }]}>Read</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      {/* <View style={[styles.topBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>Blogs</Text>
      </View> */}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : blogs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No stories yet</Text>
        </View>
      ) : (
        <FlatList
          data={blogs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await fetchBlogs();
                setRefreshing(false);
              }}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, paddingBottom: 32 },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
    overflow: 'hidden',
  },
  thumb: {
    height: 160,
    backgroundColor: '#f3f4f6',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  excerpt: { fontSize: 14, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12 },
  readBadge: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
  },
   empty: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 40,
  }, emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 40,
  },
  readText: { fontSize: 12, fontWeight: '600' },
});
