import React, { useState, useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Bed, Utensils, Car, Camera, PartyPopper, ArrowRight, Star, MapPin, Wifi, Tv, Wind, Heart } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Testimonials from '../components/Testimonials';
import LocationMap from '../components/LocationMap';
import HomeRoomCard from '../components/HomeRoomCard';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const gangtokImages = [
  require('../assets/slidesho/img1.jpg'),
  require('../assets/slidesho/img2.jpg'),
  require('../assets/slidesho/img3.jpg')
];

const services = [
  { icon: Bed, title: "Lodging", desc: "Comfortable rooms and suites.", link: "Catalog", filter: "lodging" },
  { icon: Utensils, title: "Fooding", desc: "Exquisite cuisines.", link: "Catalog", filter: "fooding" },
  { icon: Car, title: "Travel", desc: "Hassle-free transportation.", link: "Catalog", filter: "travel" },
  { icon: Camera, title: "Sightseeing", desc: "Guided tours.", link: "Catalog", filter: "sightseeing" },
  { icon: PartyPopper, title: "Events", desc: "Venues for moments.", link: "Catalog", filter: "party" },
  { icon: ArrowRight, title: "Packages", desc: "All-in-one bundles.", link: "Packages", filter: null },
];

// --- Sub-components to prevent re-renders ---

const HomeHero = memo(() => {
  const navigation = useNavigation<any>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => {
        const next = (prev + 1) % gangtokImages.length;
        // Check if ref is current and list has data
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({
              index: next,
              animated: true,
              viewPosition: 0 // Align to center
          });
        }
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Animated.View style={styles.heroContainer} entering={FadeInDown.duration(800)}>
      <FlatList
        ref={flatListRef}
        data={gangtokImages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialNumToRender={4}
        removeClippedSubviews={false}
        keyExtractor={(_, index) => index.toString()}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        renderItem={({ item }) => (
          <View style={styles.heroSlide}>
            <Image source={item} style={styles.heroImage} />
            <View style={styles.overlay} />
          </View>
        )}
        onScrollToIndexFailed={info => {
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
          });
        }}
        onMomentumScrollEnd={(ev) => {
          const newIndex = Math.floor(ev.nativeEvent.contentOffset.x / width);
          setCurrentImageIndex(newIndex);
        }}
      />
      <View style={styles.heroContent}>
        <Text style={styles.heroTitle}>
          Experience <Text style={styles.highlightText}>Gangtok</Text> Like Never Before
        </Text>
        <Text style={styles.heroSubtitle}>
          Luxury stays in the heart of Sikkim. Discover mountains, culture, and comfort.
        </Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={() => navigation.navigate('Rooms')}
          >
            <Text style={styles.primaryButtonText}>Explore Rooms</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
});

// RoomCard component removed in favor of HomeRoomCard
// const RoomCard = memo(({ item }: { item: any }) => {
//   ...
// });

const FeaturedStays = memo(({ rooms }: { rooms: any[] }) => {
  if (!rooms || rooms.length === 0) return null;
  return (
    <Animated.View style={styles.sectionContainer} entering={FadeInDown.duration(800).delay(200)}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Suites & Stays</Text>
        <Text style={styles.sectionSubtitle}>Swipe to explore our premium collection</Text>
      </View>
      <FlatList
        data={rooms}
        renderItem={({ item }) => <HomeRoomCard item={item} />}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.featuredList,
          rooms.length === 1 && styles.centeredList
        ]}
      />
    </Animated.View>
  );
});

const HomeFooter = memo(() => (
  <View style={styles.footerContainer}>
    <Testimonials />
    <LocationMap />
  </View>
));

const ServiceCard = memo(({ item, index }: { item: any, index: number }) => {
  const navigation = useNavigation<any>();
  const Icon = item.icon;
  return (
    <Animated.View 
      entering={FadeInDown.duration(600).delay(index * 100 + 300)}
      style={styles.serviceCardContainer}
    >
      <TouchableOpacity 
        style={styles.serviceCard}
        onPress={() => navigation.navigate(item.link, { filter: item.filter })}
      >
        <View style={styles.iconContainer}>
          <Icon size={24} color="#db2777" />
        </View>
        <Text style={styles.serviceTitle}>{item.title}</Text>
        <Text style={styles.serviceDesc}>{item.desc}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function HomeScreen() {
  const [featuredRooms, setFeaturedRooms] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeaturedRooms();

    const channel = supabase.channel('home-rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, (payload) => {
          console.log('Realtime update received:', payload);
          fetchFeaturedRooms();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
          fetchFeaturedRooms();
      })
      .subscribe();

    // const interval = setInterval(() => {
    //   fetchFeaturedRooms();
    // }, 10000); // Increased to 10s to reduce load

    return () => {
      supabase.removeChannel(channel);
      // clearInterval(interval);
    };
  }, []);

  const fetchFeaturedRooms = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('rooms')
        .select('*, hotels(name)')
        .limit(5); // Fetch top 5 rooms
      
      if (error) throw error;

      if (data) {
        setFeaturedRooms(data);
      }
    } catch (err) {
      console.error('Error fetching featured rooms:', err);
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const renderListHeader = () => (
    <View>
      <HomeHero />
      {loading && featuredRooms.length === 0 ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#db2777" />
        </View>
      ) : error && featuredRooms.length === 0 ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
           <Text style={{ color: '#ef4444', marginBottom: 10 }}>Unable to load featured stays</Text>
           <TouchableOpacity 
             onPress={() => {
               setLoading(true);
               fetchFeaturedRooms();
             }}
             style={[styles.button, styles.primaryButton, { minWidth: 100, paddingVertical: 8 }]}
           >
             <Text style={styles.primaryButtonText}>Retry</Text>
           </TouchableOpacity>
        </View>
      ) : (
        <FeaturedStays rooms={featuredRooms} />
      )}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Our Premium Services</Text>
        <Text style={styles.sectionSubtitle}>Everything you need for a perfect stay.</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <FlatList
        data={services}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={HomeFooter}
        keyExtractor={(item) => item.title}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchFeaturedRooms();
              setRefreshing(false);
            }}
          />
        }
        renderItem={({ item, index }) => <ServiceCard item={item} index={index} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    paddingBottom: 20,
  },
  footerContainer: {
    paddingBottom: 20,
  },
  heroContainer: {
    height: 240,
    position: 'relative',
    marginBottom: 24,
  },
  heroSlide: {
    width: width,
    height: 240,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    alignItems: 'center',
    zIndex: 10,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontFamily: 'serif',
  },
  highlightText: {
    color: '#fbe604ff', // pink-400
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#f3f4f6',
    textAlign: 'center',
    marginBottom: 24,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 9999,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#db2777', // pink-600
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  outlineButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'serif',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  serviceCardContainer: {
    width: (width - 48) / 2,
    marginBottom: 16,
  },
  serviceCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  iconContainer: {
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  featuredList: {
    paddingHorizontal: 16,
    paddingRight: 8,
  },
  centeredList: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingRight: 16, // Match paddingHorizontal for visual centering
  },
  // Room Card Styles - Dark Theme
  roomCard: {
    width: 260,
    height: 380,
    backgroundColor: '#0f172a', // slate-900
    borderRadius: 20,
    marginRight: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  roomImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  roomRatingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 4,
  },
  roomRatingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  roomHeartBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomContent: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  roomTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  hotelName: {
    fontSize: 12,
    color: '#db2777', // pink
    fontWeight: '600',
    marginBottom: 6,
  },
  roomLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  roomLocationText: {
    color: '#94a3b8', // slate-400
    fontSize: 12,
  },
  roomDescription: {
    color: '#cbd5e1', // slate-300
    fontSize: 12,
    marginBottom: 12,
  },
  amenitiesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  amenityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b', // slate-800
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  amenityText: {
    color: '#94a3b8',
    fontSize: 10,
  },
  roomFooter: {
    flexDirection: 'row',
    // alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -6,
  },
  roomPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  roomPriceSuffix: {
    fontSize: 11,
    color: '#94a3b8',
  },
  inquireButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    paddingTop: 8,
  },
  inquireButtonText: {
    color: '#0f172a',
    fontSize: 11,
    fontWeight: '700',
  },
  roomGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
});
