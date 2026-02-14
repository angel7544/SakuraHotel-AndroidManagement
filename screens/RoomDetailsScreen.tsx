import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bed, Users, Wifi, Tv, Wind, Car, Waves, Dumbbell, Coffee, Utensils, Flame, Star, ArrowLeft, MapPin, Share2, Heart } from 'lucide-react-native';
import Header from '../components/Header';

const { width } = Dimensions.get('window');

const RoomDetailsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { room } = route.params;

  const images = room.images && room.images.length > 0 ? room.images : (room.image_url ? [room.image_url] : []);
  const [activeSlide, setActiveSlide] = React.useState(0);

  const getAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes("wifi")) return <Wifi size={20} color="#4b5563" />;
    if (lower.includes("tv")) return <Tv size={20} color="#4b5563" />;
    if (lower.includes("ac") || lower.includes("air")) return <Wind size={20} color="#4b5563" />;
    if (lower.includes("park")) return <Car size={20} color="#4b5563" />;
    if (lower.includes("pool")) return <Waves size={20} color="#4b5563" />;
    if (lower.includes("gym") || lower.includes("fitness")) return <Dumbbell size={20} color="#4b5563" />;
    if (lower.includes("breakfast") || lower.includes("coffee")) return <Coffee size={20} color="#4b5563" />;
    if (lower.includes("dining") || lower.includes("food")) return <Utensils size={20} color="#4b5563" />;
    if (lower.includes("heat") || lower.includes("fire")) return <Flame size={20} color="#4b5563" />;
    return <Star size={20} color="#4b5563" />;
  };

  const handleBookNow = () => {
    navigation.navigate('Contact', {
      interest: `Room Booking: ${room.type} (Room ${room.room_number})`,
      type: 'room',
      details: `Room: ${room.type} #${room.room_number}\nPrice: ₹${room.price}\nDescription: ${room.description}`
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const slide = Math.ceil(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
              if (slide !== activeSlide) setActiveSlide(slide);
            }}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.image} />
            )}
            keyExtractor={(_, index) => index.toString()}
          />
          <View style={styles.pagination}>
            {images.map((_: any, index: number) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === activeSlide ? styles.paginationDotActive : styles.paginationDotInactive
                ]}
              />
            ))}
          </View>
          
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
                <Share2 size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
                <Heart size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{room.type}</Text>
              <View style={styles.locationRow}>
                <MapPin size={14} color="#6b7280" />
                <Text style={styles.locationText}>MG Road, Gangtok</Text>
              </View>
            </View>
            <View style={styles.ratingBadge}>
              <Star size={12} color="#fbbf24" fill="#fbbf24" />
              <Text style={styles.ratingText}>4.8 (365 reviews)</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{room.description}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Users size={20} color="#db2777" />
              <Text style={styles.detailText}>{room.capacity} Guests</Text>
            </View>
            <View style={styles.detailItem}>
              <Bed size={20} color="#db2777" />
              <Text style={styles.detailText}>{room.bed_count} {room.bed_type}</Text>
            </View>
             <View style={styles.detailItem}>
              <Text style={styles.roomNumberLabel}>Room No.</Text>
              <Text style={styles.detailText}>{room.room_number}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {room.amenities?.map((amenity: string, index: number) => (
              <View key={index} style={styles.amenityBadge}>
                {getAmenityIcon(amenity)}
                <Text style={styles.amenityLabel}>{amenity}</Text>
              </View>
            ))}
          </View>

        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.priceLabel}>Price per night</Text>
          <Text style={styles.priceValue}>₹{room.price}</Text>
        </View>
        <TouchableOpacity style={styles.bookButton} onPress={handleBookNow}>
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    height: 300,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: width,
    height: 300,
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 8,
    borderRadius: 20,
  },
  headerActions: {
    position: 'absolute',
    top: 40,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 8,
    borderRadius: 20,
  },
  pagination: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paginationDotActive: {
    backgroundColor: '#fff',
  },
  paginationDotInactive: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  contentContainer: {
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: '#6b7280',
    fontSize: 14,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    color: '#b45309',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    minWidth: '45%',
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  roomNumberLabel: {
    fontSize: 12,
    color: '#db2777',
    fontWeight: 'bold',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  amenityLabel: {
    fontSize: 14,
    color: '#4b5563',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#db2777',
  },
  bookButton: {
    backgroundColor: '#db2777',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RoomDetailsScreen;
