import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Check, Star } from 'lucide-react-native';
import Header from '../components/Header';

export type PackageItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  items: string[];
  status?: string;
  image_url?: string;
  images?: string[];
  number_of_days?: number;
  number_of_nights?: number;
};

export default function PackagesScreen() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();

  useEffect(() => {
    fetchPackages();
    
    const channel = supabase
      .channel('realtime-packages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'packages' }, fetchPackages)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('status', 'Active');
      
      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (item: PackageItem) => {
    navigation.navigate('Contact', {
      interest: item.name,
      type: 'package',
      details: `Package: ${item.name}\nPrice: ${item.price ? `₹${item.price}` : 'On Request'}\nDescription: ${item.description}\nItems: ${item.items.join(', ')}`
    });
  };

  const renderPackage = ({ item }: { item: PackageItem }) => {
    const images = item.images && item.images.length > 0 ? item.images : (item.image_url ? [item.image_url] : []);
    const mainImage = images[0] || 'https://via.placeholder.com/400x300?text=Package';

    return (
      <View style={styles.card}>
        <Image source={{ uri: mainImage }} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.packageName}>{item.name}</Text>
            <View style={styles.priceContainer}>
               <Text style={styles.priceText}>{item.price ? `₹${item.price}` : 'On Request'}</Text>
            </View>
          </View>
          
          <Text style={styles.description}>{item.description}</Text>
          
          {item.number_of_days && (
            <View style={styles.badgeContainer}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.number_of_days} Days / {item.number_of_nights} Nights</Text>
              </View>
            </View>
          )}

          <View style={styles.itemsList}>
            {item.items.map((pkgItem, idx) => (
              <View key={idx} style={styles.pkgItem}>
                <Check size={16} color="#db2777" />
                <Text style={styles.pkgItemText}>{pkgItem}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.bookButton} onPress={() => handleBookNow(item)}>
            <Text style={styles.bookButtonText}>Book Package</Text>
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
        <Text style={styles.title}>Our Packages</Text>
        <Text style={styles.subtitle}>Curated experiences for you.</Text>
      </View>
      <FlatList
        data={packages}
        renderItem={renderPackage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No packages available.</Text>}
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
    height: 180,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  packageName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  priceContainer: {
    backgroundColor: '#fdf2f8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  priceText: {
    color: '#db2777',
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  itemsList: {
    gap: 8,
    marginBottom: 16,
  },
  pkgItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pkgItemText: {
    fontSize: 14,
    color: '#4b5563',
  },
  bookButton: {
    backgroundColor: '#db2777',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
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
});
