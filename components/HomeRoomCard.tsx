import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Share, Alert } from 'react-native';
import { Star, MapPin, Share2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface RoomItem {
  id: string;
  room_number: string;
  type: string;
  price: number;
  description: string;
  image_url?: string;
  images?: string[];
  hotels?: {
    name: string;
    address?: string;
  };
  rating?: number;
  review_count?: number;
}

const HomeRoomCard = ({ item }: { item: RoomItem }) => {
  const navigation = useNavigation<any>();
  const images = item.images && item.images.length > 0 ? item.images : (item.image_url ? [item.image_url] : []);
  const mainImage = images[0] || 'https://via.placeholder.com/300x200?text=No+Image';

  // Dummy data for missing fields if not present in DB
  const rating = item.rating || 5;
  const reviewCount = item.review_count || 365;
  const hotelName = item.hotels?.name || 'Sakura Hotel';
  const location = item.hotels?.address || 'MG Road, Gangtok';

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out this amazing room at ${hotelName}: ${item.type} (Room ${item.room_number}) for ₹${item.price}/night.`,
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('RoomDetails', { room: item })}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: mainImage }} style={styles.image} />
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>₹{item.price}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>{item.type}</Text>
            <View style={styles.roomInfoRow}>
                <Text style={styles.roomNumber}>Room {item.room_number}</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.subtitle} numberOfLines={1}>{hotelName}</Text>
            </View>
            <View style={styles.locationRow}>
                <MapPin size={12} color="#9ca3af" />
                <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Share2 size={20} color="#db2777" />
          </TouchableOpacity>
        </View>

        <View style={styles.ratingRow}>
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              size={14} 
              color={i < rating ? "#f59e0b" : "#d1d5db"} 
              fill={i < rating ? "#f59e0b" : "none"} 
              style={{ marginRight: 2 }}
            />
          ))}
          <Text style={styles.reviewCount}>{reviewCount} reviews</Text>
        </View>

        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => navigation.navigate('RoomDetails', { room: item })}
        >
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 24,
    marginRight: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    marginBottom: 10, // For shadow visibility
    paddingBottom: 16,
  },
  imageContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  priceTag: {
    position: 'absolute',
    top: 20,
    right: 0,
    backgroundColor: '#db2777', // Changed to match theme
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    elevation: 2,
  },
  priceText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  roomInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  roomNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#db2777',
  },
  dot: {
    marginHorizontal: 4,
    color: '#9ca3af',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#9ca3af',
    flex: 1,
  },
  shareButton: {
    padding: 8,
    backgroundColor: '#fce7f3', // light pink bg
    borderRadius: 50,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  reviewCount: {
    marginLeft: 8,
    fontSize: 12,
    color: '#9ca3af',
  },
  viewButton: {
    marginTop: 16,
    backgroundColor: '#db2777',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  viewButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default HomeRoomCard;
