import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ActivityIndicator, 
  ScrollView, 
  FlatList, 
  TouchableOpacity, 
  Dimensions, 
  Linking,
  Modal,
  StatusBar,
  Animated
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Share2,
  Clock,
  ZoomIn
} from 'lucide-react-native';
// import { Marquee } from '@animatereactnative/marquee';
import ImageViewing from 'react-native-image-viewing';
import RenderHtml from 'react-native-render-html';
import { marked } from 'marked';

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
  author_bio?: string | null;
  read_time?: string;
  seo_title?: string | null;
  seo_description?: string | null;
  keywords?: string | null;
};

const SITE_URL = 'https://hotelsakura.in';
const { width, height } = Dimensions.get('window');

export default function BlogArticleScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { slug } = route.params || {};

  const [blog, setBlog] = useState<BlogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Animation for scrolling
  const scrollY = useRef(new Animated.Value(0)).current;

  const fetchBlog = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();
    
    if (!error && data) {
      let content = data.content || '';
      
      // Convert Markdown to HTML if content doesn't look like HTML
      // (Simple check: if it doesn't have <p> or <div> or <br> tags, assume markdown or plain text)
      // Or just always run it through marked. marked passes HTML through.
      try {
        content = await marked.parse(content);
      } catch (e) {
        console.log('Error parsing markdown', e);
      }

      // Fix relative image URLs in content
      content = content.replace(/src="\/([^"]*)"/g, `src="${SITE_URL}/$1"`);
      content = content.replace(/src='\/([^']*)'/g, `src='${SITE_URL}/$1'`);
      
      const readTime = `${Math.max(1, Math.ceil(content.length / 1000))} min read`;
      setBlog({ ...data, content, read_time: readTime } as BlogItem);
    } else if (error) {
      console.log('Error fetching blog:', error);
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchBlog();
  }, [fetchBlog]);

  const shareArticle = async () => {
    if (!blog?.slug) return;
    try {
      await Linking.openURL(`whatsapp://send?text=Check out this article: ${SITE_URL}/blog/${blog.slug}`);
    } catch (err) {
      console.log('Error sharing', err);
    }
  };

  const getGalleryImages = useCallback(() => {
    if (!blog?.gallery_images) return [];
    
    let rawImages = blog.gallery_images;
    
    // Fallback if it comes as a string
    if (typeof rawImages === 'string') {
      try {
        rawImages = JSON.parse(rawImages);
      } catch (e) {
        console.log('Error parsing gallery images', e);
        return [];
      }
    }
    
    if (Array.isArray(rawImages)) {
      return rawImages.filter(Boolean);
    }
    
    return [];
  }, [blog?.gallery_images]);

  const images = getGalleryImages();
  const allImages = [blog?.cover_image, ...images].filter(Boolean).map(url => ({ uri: url! }));
  const mainImage = blog?.cover_image || images[0] || null;

  const openZoomViewer = (index: number) => {
    setCurrentImageIndex(index);
    setIsImageViewerVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!blog) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textMuted }]}>Article not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { backgroundColor: '#fff' }]}>
      <StatusBar hidden />
      
      {/* Floating Header */}
      <View style={styles.floatingHeader}>
        <TouchableOpacity 
          style={styles.circleBtn} 
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={20} color="#1f2937" />
        </TouchableOpacity>
        
        <Animated.View style={[styles.headerTitleContainer, { opacity: headerOpacity }]}>
          <Text style={styles.headerTitleText} numberOfLines={1}>{blog.title}</Text>
        </Animated.View>

        <TouchableOpacity 
          style={styles.circleBtn} 
          onPress={shareArticle}
        >
          <Share2 size={20} color="#1f2937" />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Image with Zoom Tap */}
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => openZoomViewer(0)}
          style={styles.heroContainer}
        >
          {mainImage ? (
            <Image source={{ uri: mainImage }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor: colors.card }]} />
          )}
          <View style={styles.zoomIndicator}>
             <ZoomIn size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={styles.articleBody}>
          {/* Meta Info */}
          <View style={styles.metaContainer}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>Hotel News</Text>
            </View>
            <Text style={styles.title}>{blog.title}</Text>
            
            <View style={styles.authorRow}>
              <View style={styles.authorAvatar}>
                {blog.author_avatar ? (
                  <Image source={{ uri: blog.author_avatar }} style={styles.authorImage} />
                ) : (
                  <Text style={styles.authorInitial}>
                    {(blog.author?.[0] || 'S').toUpperCase()}
                  </Text>
                )}
              </View>
              <View>
                <Text style={styles.authorName}>
                  {blog.author || 'Sakura Team'}
                </Text>
                <View style={styles.dateRow}>
                  <Text style={styles.dateText}>
                    {new Date(blog.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </Text>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Clock size={12} color="#6b7280" style={{ marginRight: 4 }} />
                  <Text style={styles.dateText}>{blog.read_time || '3 min read'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Excerpt */}
          {blog.excerpt && (
            <View style={styles.excerptContainer}>
              <Text style={styles.excerpt}>{blog.excerpt}</Text>
            </View>
          )}

          {/* Content */}
          <View style={styles.mainContent}>
            {blog.content ? (
              <RenderHtml
                contentWidth={width - 40}
                source={{ html: blog.content }}
                tagsStyles={{
                  p: { fontSize: 17, lineHeight: 28, color: '#374151', marginBottom: 16 },
                  h1: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 16, marginTop: 24 },
                  h2: { fontSize: 22, fontWeight: '700', color: '#1f2937', marginBottom: 14, marginTop: 20 },
                  h3: { fontSize: 20, fontWeight: '700', color: '#1f2937', marginBottom: 12, marginTop: 16 },
                  li: { fontSize: 17, lineHeight: 28, color: '#374151', marginBottom: 8 },
                  ul: { marginBottom: 16 },
                  ol: { marginBottom: 16 },
                  a: { color: '#db2777', textDecorationLine: 'underline' },
                  img: { borderRadius: 12, marginVertical: 16 }
                }}
              />
            ) : null}
          </View>

          {/* About Author Card */}
          <View style={styles.authorCard}>
            <View style={styles.authorCardHeader}>
              <View style={styles.authorCardAvatarContainer}>
                 {blog.author_avatar ? (
                   <Image source={{ uri: blog.author_avatar }} style={styles.authorCardImage} />
                 ) : (
                   <Text style={styles.authorCardInitial}>
                     {(blog.author?.[0] || 'S').toUpperCase()}
                   </Text>
                 )}
              </View>
              <View style={styles.authorCardInfo}>
                <Text style={styles.authorCardLabel}>About The Author</Text>
                <Text style={styles.authorCardName}>{blog.author || 'Sakura Team'}</Text>
              </View>
            </View>
            {blog.author_bio && (
              <Text style={styles.authorCardBio}>{blog.author_bio}</Text>
            )}
          </View>

          {/* Gallery */}
          {images.length > 0 && (
            <View style={styles.gallerySection}>
              <Text style={styles.sectionTitle}>Gallery</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryList}>
                {images.map((img, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    onPress={() => openZoomViewer(idx + (mainImage === blog.cover_image ? 1 : 0))}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: img }} style={styles.galleryImage} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
        
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      <ImageViewing
        images={allImages}
        imageIndex={currentImageIndex}
        visible={isImageViewerVisible}
        onRequestClose={() => setIsImageViewerVisible(false)}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  
  // Floating Header
  floatingHeader: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },

  // Hero Image
  heroContainer: {
    width: width,
    height: width * 0.75,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
  },
  zoomIndicator: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 8,
  },

  // Article Body
  articleBody: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingTop: 32,
    paddingHorizontal: 20,
  },
  metaContainer: {
    marginBottom: 24,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#fce7f3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    marginBottom: 12,
  },
  categoryText: {
    color: '#db2777',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 20,
    lineHeight: 34,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  authorImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  authorInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 13,
    color: '#6b7280',
  },
  dotSeparator: {
    marginHorizontal: 6,
    color: '#9ca3af',
  },
  
  // Excerpt
  excerptContainer: {
    paddingLeft: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#db2777',
    marginBottom: 24,
  },
  excerpt: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#4b5563',
    lineHeight: 28,
  },

  // Main Content
  mainContent: {
    marginBottom: 32,
  },
  
  // Author Card
  authorCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  authorCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorCardAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  authorCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  authorCardInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
  },
  authorCardInfo: {
    flex: 1,
  },
  authorCardLabel: {
    fontSize: 12,
    color: '#db2777',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  authorCardName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  authorCardBio: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
  },

  // Gallery
  gallerySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  galleryList: {
    gap: 12,
  },
  galleryImage: {
    width: 200,
    height: 140,
    borderRadius: 12,
    marginRight: 12,
  },

  // Error State
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#db2777',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },

  content: {
    paddingBottom: 40,
  },
});
