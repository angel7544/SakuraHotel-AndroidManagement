import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Dimensions, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Users, Bed, Wifi, Tv, Wind, Car, Dumbbell, Coffee, Utensils, Star, Flame, Waves } from 'lucide-react-native';
import Header from '../components/Header';

const { width } = Dimensions.get('window');

export type RoomItem = {
  id: string;
  room_number: string;
  type: string;
  price: number;
  description: string;
  image_url?: string;
  images?: string[];
  capacity: number;
  bed_type: string;
  bed_count: number;
  amenities: string[];
  view_type: string;
  status: string;
};

const RoomCard = ({ item, handleBookNow }: { item: RoomItem, handleBookNow: (item: RoomItem) => void }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const images = item.images && item.images.length > 0 ? item.images : (item.image_url ? [item.image_url] : []);
  const hasMultipleImages = images.length > 1;
  const cardWidth = width - 32; // Container padding is 16*2

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setActiveIndex(roundIndex);
  };

  const getAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes("wifi")) return <Wifi size={16} color="#6b7280" />;
    if (lower.includes("tv")) return <Tv size={16} color="#6b7280" />;
    if (lower.includes("ac") || lower.includes("air")) return <Wind size={16} color="#6b7280" />;
    if (lower.includes("park")) return <Car size={16} color="#6b7280" />;
    if (lower.includes("pool")) return <Waves size={16} color="#6b7280" />;
    if (lower.includes("gym") || lower.includes("fitness")) return <Dumbbell size={16} color="#6b7280" />;
    if (lower.includes("breakfast") || lower.includes("coffee")) return <Coffee size={16} color="#6b7280" />;
    if (lower.includes("dining") || lower.includes("food")) return <Utensils size={16} color="#6b7280" />;
    if (lower.includes("heat") || lower.includes("fire")) return <Flame size={16} color="#6b7280" />;
    return <Star size={16} color="#6b7280" />;
  };

  return (
    <View style={styles.card}>
      <View style={{ height: 200, position: 'relative' }}>
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          renderItem={({ item: img }) => (
            <Image 
              source={{ uri: img }} 
              style={{ width: cardWidth, height: 200, resizeMode: 'cover' }} 
            />
          )}
          keyExtractor={(_, index) => index.toString()}
        />
        {hasMultipleImages && (
          <View style={styles.pagination}>
            {images.map((_, idx) => (
              <View 
                key={idx} 
                style={[
                  styles.dot, 
                  { backgroundColor: idx === activeIndex ? '#fff' : 'rgba(255,255,255,0.5)' }
                ]} 
              />
            ))}
          </View>
        )}
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.roomType}>{item.type}</Text>
            <Text style={styles.roomNumber}>Room {item.room_number}</Text>
          </View>
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>
              {item.price ? `₹${item.price}` : 'On Request'}
            </Text>
            {item.price ? <Text style={styles.perNight}>/night</Text> : null}
          </View>
        </View>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Users size={16} color="#6b7280" />
            <Text style={styles.featureText}>{item.capacity} Guests</Text>
          </View>
          <View style={styles.featureItem}>
            <Bed size={16} color="#6b7280" />
            <Text style={styles.featureText}>{item.bed_count} {item.bed_type}</Text>
          </View>
        </View>

        <View style={styles.amenities}>
          {item.amenities?.slice(0, 5).map((amenity, idx) => (
            <View key={idx} style={styles.amenityItem}>
              {getAmenityIcon(amenity)}
              <Text style={styles.amenityText}>{amenity}</Text>
            </View>
          ))}
          {item.amenities && item.amenities.length > 5 && (
            <Text style={styles.moreAmenities}>+{item.amenities.length - 5} more</Text>
          )}
        </View>

        <TouchableOpacity 
          style={[
            styles.bookButton, 
            item.status === 'Booked' && styles.disabledButton
          ]}
          onPress={() => item.status !== 'Booked' && handleBookNow(item)}
          disabled={item.status === 'Booked'}
        >
          <Text style={styles.bookButtonText}>
            {item.status === 'Booked' ? 'Unavailable' : 'Book Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function RoomsScreen() {
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRooms();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('realtime-rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetchRooms)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, fetchRooms)
      .subscribe();

    const interval = setInterval(() => {
      fetchRooms();
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const fetchRooms = async () => {
    try {
      const { data: roomsData, error } = await supabase.from('rooms').select('*');
      if (error) throw error;

      // Check availability
      const { data: resData } = await supabase
        .from('reservations')
        .select('room_id')
        .in('status', ['Confirmed', 'Checked In']);

      const bookedRoomIds = new Set(resData?.map(r => r.room_id).filter(Boolean));

      const updatedRooms = (roomsData || []).map((room: any) => ({
        ...room,
        status: bookedRoomIds.has(room.id) ? 'Booked' : room.status
      }));

      setRooms(updatedRooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRooms();
    setRefreshing(false);
  };

  const handleBookNow = (room: RoomItem) => {
    // Navigate to Contact with pre-filled interest
    navigation.navigate('Contact', {
      interest: `${room.type} (Room ${room.room_number})`,
      type: 'room',
      details: `Room: ${room.type} #${room.room_number}\nPrice: ${room.price ? `₹${room.price}` : 'On Request'}\nDescription: ${room.description || 'N/A'}\nCapacity: ${room.capacity} Guests\nBed: ${room.bed_count} ${room.bed_type}\nAmenities: ${room.amenities?.join(', ') || 'N/A'}`
    });
  };

  const getAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes("wifi")) return <Wifi size={16} color="#6b7280" />;
    if (lower.includes("tv")) return <Tv size={16} color="#6b7280" />;
    if (lower.includes("ac") || lower.includes("air")) return <Wind size={16} color="#6b7280" />;
    if (lower.includes("park")) return <Car size={16} color="#6b7280" />;
    if (lower.includes("pool")) return <Waves size={16} color="#6b7280" />;
    if (lower.includes("gym") || lower.includes("fitness")) return <Dumbbell size={16} color="#6b7280" />;
    if (lower.includes("breakfast") || lower.includes("coffee")) return <Coffee size={16} color="#6b7280" />;
    if (lower.includes("dining") || lower.includes("food")) return <Utensils size={16} color="#6b7280" />;
    if (lower.includes("heat") || lower.includes("fire")) return <Flame size={16} color="#6b7280" />;
    return <Star size={16} color="#6b7280" />;
  };

  const renderRoom = ({ item }: { item: RoomItem }) => {
    const images = item.images && item.images.length > 0 ? item.images : (item.image_url ? [item.image_url] : []);
    const mainImage = images[0] || 'https://via.placeholder.com/400x300?text=No+Image';

    return (
      <View style={styles.card}>
        <Image source={{ uri: mainImage }} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.roomType}>{item.type}</Text>
              <Text style={styles.roomNumber}>Room {item.room_number}</Text>
            </View>
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>
                {item.price ? `₹${item.price}` : 'On Request'}
              </Text>
              {item.price ? <Text style={styles.perNight}>/night</Text> : null}
            </View>
          </View>

          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Users size={16} color="#6b7280" />
              <Text style={styles.featureText}>{item.capacity} Guests</Text>
            </View>
            <View style={styles.featureItem}>
              <Bed size={16} color="#6b7280" />
              <Text style={styles.featureText}>{item.bed_count} {item.bed_type}</Text>
            </View>
          </View>

          <View style={styles.amenities}>
            {item.amenities?.slice(0, 5).map((amenity, idx) => (
              <View key={idx} style={styles.amenityItem}>
                {getAmenityIcon(amenity)}
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
            {item.amenities && item.amenities.length > 5 && (
              <Text style={styles.moreAmenities}>+{item.amenities.length - 5} more</Text>
            )}
          </View>

          <TouchableOpacity 
            style={[
              styles.bookButton, 
              item.status === 'Booked' && styles.disabledButton
            ]}
            onPress={() => item.status !== 'Booked' && handleBookNow(item)}
            disabled={item.status === 'Booked'}
          >
            <Text style={styles.bookButtonText}>
              {item.status === 'Booked' ? 'Unavailable' : 'Book Now'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#db2777" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <View style={styles.header}>
        <Text style={styles.title}>Our Rooms</Text>
        <Text style={styles.subtitle}>Comfort & Luxury defined.</Text>
      </View>
      <FlatList
        data={rooms}
        renderItem={renderRoom}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No rooms available at the moment.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  roomType: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  roomNumber: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  priceTag: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#db2777',
  },
  perNight: {
    fontSize: 12,
    color: '#6b7280',
  },
  features: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
  },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  amenityText: {
    fontSize: 12,
    color: '#4b5563',
  },
  moreAmenities: {
    fontSize: 12,
    color: '#6b7280',
    alignSelf: 'center',
  },
  bookButton: {
    backgroundColor: '#db2777',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 40,
  },
  pagination: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
