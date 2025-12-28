import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  RefreshControl,
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { Calendar, User, BookOpen, ArrowRight, Clock } from 'lucide-react-native';
import Header from '../components/Header';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

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
  read_time?: string;
};

const { width } = Dimensions.get('window');

export default function BlogScreen() {
  const { colors } = useTheme();
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setBlogs((data || []).map(blog => ({
        ...blog,
        read_time: `${Math.max(1, Math.ceil((blog.content?.length || 0) / 1000))} min read`
      })) as BlogItem[]);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
    const channel = supabase
      .channel('client-blogs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blogs' }, fetchBlogs)
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBlogs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBlogs();
    setRefreshing(false);
  };

  const openArticle = (slug?: string | null) => {
    if (!slug) return;
    navigation.navigate('BlogArticle', { slug });
  };

  const renderFeaturedItem = ({ item }: { item: BlogItem }) => {
    const image = item.cover_image || (item.gallery_images?.[0]) || null;
    
    return (
      <TouchableOpacity 
        style={styles.featuredCard} 
        onPress={() => openArticle(item.slug)}
        activeOpacity={0.9}
      >
        <View style={styles.featuredImageContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.featuredImage} />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: colors.card }]}>
              <BookOpen size={40} color={colors.textMuted} />
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradientOverlay}
          />
          <View style={styles.featuredContent}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Featured</Text>
            </View>
            <Text style={styles.featuredTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.metaRowLight}>
              <Text style={styles.metaTextLight}>
                {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </Text>
              <Text style={styles.metaDotLight}>•</Text>
              <Text style={styles.metaTextLight}>{item.read_time || '3 min read'}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderListItem = ({ item }: { item: BlogItem }) => {
    const image = item.cover_image || (item.gallery_images?.[0]) || null;

    return (
      <TouchableOpacity 
        style={styles.listCard} 
        onPress={() => openArticle(item.slug)}
        activeOpacity={0.7}
      >
        <View style={styles.listImageContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.listImage} />
          ) : (
            <View style={[styles.listPlaceholder, { backgroundColor: colors.background }]}>
              <BookOpen size={20} color={colors.textMuted} />
            </View>
          )}
        </View>

        <View style={styles.listContent}>
          <View style={styles.categoryRow}>
            <Text style={[styles.categoryText, { color: colors.primary }]}>Hotel News</Text>
            <Text style={[styles.dateText, { color: colors.textMuted }]}>
               {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </Text>
          </View>
          
          <Text style={[styles.listTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          
          <Text style={[styles.listExcerpt, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.excerpt || 'No description available for this article.'}
          </Text>
          
          <View style={styles.listFooter}>
            <View style={styles.authorRow}>
              {item.author ? (
                <>
                  <User size={12} color={colors.textMuted} />
                  <Text style={[styles.authorText, { color: colors.textMuted }]} numberOfLines={1}>
                    {item.author}
                  </Text>
                </>
              ) : (
                 <Text style={[styles.authorText, { color: colors.textMuted }]}>Sakura Team</Text>
              )}
            </View>
            <View style={styles.readMore}>
               <Text style={[styles.readMoreText, { color: colors.primary }]}>Read</Text>
               <ArrowRight size={12} color={colors.primary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Our Stories" />
      {blogs.length === 0 ? (
        <View style={styles.empty}>
          <BookOpen size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No stories yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Check back later for updates and news.
          </Text>
        </View>
      ) : (
        <FlatList
          data={blogs.slice(1)} // Everything after the first one
          keyExtractor={(item) => item.id}
          renderItem={renderListItem}
          ListHeaderComponent={
            blogs.length > 0 ? (
              <View style={styles.headerContainer}>
                <Text style={styles.sectionTitle}>Featured Story</Text>
                {renderFeaturedItem({ item: blogs[0] })}
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Latest Updates</Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  center: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  listContainer: { 
    padding: 16, 
    paddingBottom: 100 
  },
  headerContainer: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  
  // Featured Card Styles
  featuredCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  featuredImageContainer: {
    height: 240,
    width: '100%',
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  badge: {
    backgroundColor: '#db2777',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 28,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  metaRowLight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaTextLight: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '500',
  },
  metaDotLight: {
    color: 'rgba(255,255,255,0.6)',
    marginHorizontal: 6,
  },

  // List Item Styles
  listCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  listImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  listImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  listPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 10,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 20,
  },
  listExcerpt: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorText: {
    fontSize: 11,
    fontWeight: '500',
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  readMoreText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Empty State
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
});
