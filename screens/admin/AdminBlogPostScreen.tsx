import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { Plus, Edit2, Trash2, BookOpen, CheckSquare, Square } from 'lucide-react-native';

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
};

export default function AdminBlogPostScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setBlogs((data || []) as BlogItem[]);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBlogs();
    }, [fetchBlogs])
  );

  useEffect(() => {
    const channel = supabase
      .channel('admin-blogs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blogs' }, fetchBlogs)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBlogs]);

  const togglePublish = async (blog: BlogItem) => {
    const { error } = await supabase
      .from('blogs')
      .update({ is_published: !blog.is_published })
      .eq('id', blog.id);
    if (error) {
      Alert.alert('Error', 'Failed to update publish status');
    } else {
      setBlogs((prev) =>
        prev.map((b) => (b.id === blog.id ? { ...b, is_published: !b.is_published } : b))
      );
    }
  };

  const deleteBlog = async (id: string) => {
    Alert.alert('Delete Blog', 'Are you sure you want to delete this blog?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('blogs').delete().eq('id', id);
          if (error) {
            Alert.alert('Error', 'Failed to delete blog');
          } else {
            setBlogs((prev) => prev.filter((b) => b.id !== id));
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: BlogItem }) => {
    const image =
      item.cover_image ||
      (item.gallery_images && item.gallery_images.length > 0 ? item.gallery_images[0] : null);

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.left}>
            <View style={styles.thumb}>
              {image ? (
                <Image source={{ uri: image }} style={styles.thumbImage} />
              ) : (
                <View style={[styles.thumbPlaceholder, { backgroundColor: colors.background }]}>
                  <BookOpen size={20} color={colors.textMuted} />
                </View>
              )}
            </View>
            <View style={styles.texts}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.excerpt || 'No excerpt'}
              </Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                {new Date(item.created_at).toLocaleDateString()} • {item.author || 'Unknown'}
              </Text>
            </View>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => navigation.navigate('AdminBlogPostForm', { id: item.id })}
            >
              <Edit2 size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => deleteBlog(item.id)}
            >
              <Trash2 size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Published</Text>
            <TouchableOpacity style={styles.publishToggle} onPress={() => togglePublish(item)}>
              {item.is_published ? (
                <CheckSquare size={18} color={colors.primary} />
              ) : (
                <Square size={18} color={colors.textMuted} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>Blogs</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AdminBlogPostForm')}
        >
          <Plus size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={blogs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No blogs found. Create your first blog post!
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: { fontSize: 18, fontWeight: '700' },
  addButton: {
    padding: 10,
    borderRadius: 10,
  },
  listContent: { padding: 12, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  thumb: { width: 64, height: 64, borderRadius: 8, overflow: 'hidden' },
  thumbImage: { width: '100%', height: '100%' },
  thumbPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },
  meta: { fontSize: 12, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 8 },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  footer: { marginTop: 12, paddingTop: 8, borderTopWidth: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusLabel: { fontSize: 13, fontWeight: '600' },
  publishToggle: { padding: 4 },
});
