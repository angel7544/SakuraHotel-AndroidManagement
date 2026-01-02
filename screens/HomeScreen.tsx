import React, { useState, useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Bed, Utensils, Car, Camera, PartyPopper, ArrowRight, Star, MapPin, Wifi, Tv, Wind, Heart } from 'lucide-react-native';
import Testimonials from '../components/Testimonials';
import LocationMap from '../components/LocationMap';
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
    <View style={styles.heroContainer}>
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
    </View>
  );
});

const RoomCard = memo(({ item }: { item: any }) => {
  const navigation = useNavigation<any>();
  const images = item.images && item.images.length > 0 ? item.images : (item.image_url ? [item.image_url] : []);
  const mainImage = images[0] || 'https://via.placeholder.com/300x200?text=No+Image';

  return (
    <TouchableOpacity 
      style={styles.roomCard}
      onPress={() => navigation.navigate('Contact', {
          interest: `${item.type} (Room ${item.room_number})`,
          type: 'room',
          details: `Room: ${item.type} #${item.room_number}\nPrice: ${item.price ? `₹${item.price}` : 'On Request'}\nDescription: ${item.description || 'N/A'}`
      })}
    >
      <LinearGradient
        colors={['#6e7176', '#1c263e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.roomGradient}
      >
      <View style={styles.imageContainer}>
          <Image source={{ uri: mainImage }} style={styles.roomImage} />
          <View style={styles.roomRatingBadge}>
              <Star size={10} color="#fbbf24" fill="#fbbf24" />
              <Text style={styles.roomRatingText}>4.8/5</Text>
          </View>
          <View style={styles.roomHeartBadge}>
              <Heart size={14} color="#fff" />
          </View>
      </View>
      
      <View style={styles.roomContent}>
          <View>
             <Text style={styles.roomTitle} numberOfLines={1}>Room :- {item.room_number}</Text>
              <Text style={styles.roomTitle} numberOfLines={1}>{item.type}</Text>
              {/* <Text style={styles.hotelName}>{item.hotels?.name || 'Hotel Sakura'}</Text> */}
              <View style={styles.roomLocation}>
                  <MapPin size={12} color="#9ca3af" />
                  <Text style={styles.roomLocationText} numberOfLines={1}>MG Road, Gangtok, Sikkim</Text>
              </View>
              
              <Text style={styles.roomDescription} numberOfLines={1}>{item.description || 'Luxury stay experience'}</Text>

              {/* Amenities Row */}
              <View style={styles.amenitiesRow}>
                  {/* <View style={styles.amenityBadge}>
                      <Wifi size={12} color="#9ca3af" />
                      <Text style={styles.amenityText}>Wifi</Text>
                  </View> */}
                  <View style={styles.amenityBadge}>
                      <Tv size={11} color="#9ca3af" />
                      <Text style={styles.amenityText}>TV</Text>
                  </View>
                  <View style={styles.amenityBadge}>
                      <Wind size={11} color="#9ca3af" />
                      <Text style={styles.amenityText}>AC</Text>
                  </View>
                  <View style={styles.amenityBadge}>
                      <Bed size={11} color="#9ca3af" />
                      <Text style={styles.amenityText}>{item.bed_count || 1} Beds</Text>
                  </View>
              </View>
          </View>

          <View style={styles.roomFooter}>
              <View style={{ flexDirection: 'column' }}>
                  <Text style={styles.roomPrice}>₹{item.price} /night</Text>
                  
              </View>
              {/* <View style={{ flexDirection: 'column' }}>
                  <TouchableOpacity style={styles.inquireButton}>
                      <Text style={styles.inquireButtonText}>Inquire Now</Text>
                  </TouchableOpacity>
              </View> */}
          </View>
      </View>
      </LinearGradient>
    </TouchableOpacity>
  );
});

const FeaturedStays = memo(({ rooms }: { rooms: any[] }) => {
  if (!rooms || rooms.length === 0) return null;
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Suites & Stays</Text>
        <Text style={styles.sectionSubtitle}>Swipe to explore our premium collection</Text>
      </View>
      <FlatList
        data={rooms}
        renderItem={({ item }) => <RoomCard item={item} />}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.featuredList}
      />
    </View>
  );
});

const HomeFooter = memo(() => (
  <View style={styles.footerContainer}>
    <Testimonials />
    <LocationMap />
  </View>
));

const ServiceCard = memo(({ item }: { item: any }) => {
  const navigation = useNavigation<any>();
  const Icon = item.icon;
  return (
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
  );
});

export default function HomeScreen() {
  const [featuredRooms, setFeaturedRooms] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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

    const interval = setInterval(() => {
      fetchFeaturedRooms();
    }, 10000); // Increased to 10s to reduce load

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const fetchFeaturedRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*, hotels(name)')
        .limit(5); // Fetch top 5 rooms
      
      if (!error && data) {
        setFeaturedRooms(data);
      }
    } catch (err) {
      console.error('Error fetching featured rooms:', err);
    }
  };

  const renderListHeader = () => (
    <View>
      <HomeHero />
      <FeaturedStays rooms={featuredRooms} />
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
        renderItem={({ item }) => <ServiceCard item={item} />}
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
    color: '#dd720eff', // pink-400
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
  serviceCard: {
    width: (width - 48) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
