import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, ScrollView, TextInput, RefreshControl } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Search } from 'lucide-react-native';
import Header from '../components/Header';

export type ServiceItem = {
  id: string;
  name: string;
  type: string;
  description: string;
  image_url?: string;
  images?: string[];
  price?: number;
  status?: string;
};

const filters = ["all", "lodging", "fooding", "travel", "sightseeing", "party"];

export default function CatalogScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialFilter = route.params?.filter || 'all';

  const [items, setItems] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (route.params?.filter) {
      setActiveFilter(route.params.filter);
    }
  }, [route.params?.filter]);

  useEffect(() => {
    fetchServices();

    const channel = supabase
      .channel('realtime-services')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, fetchServices)
      .subscribe();

    const interval = setInterval(() => {
      fetchServices();
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('status', 'Active');
      
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  };

  const filteredItems = items.filter(item => {
    const matchesFilter = activeFilter === "all" || item.type.toLowerCase() === activeFilter.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleInquire = (item: ServiceItem) => {
    navigation.navigate('Contact', {
      interest: item.name,
      type: item.type,
      details: `Type: ${item.type}\nPrice: ${item.price ? `₹${item.price}` : 'On Request'}\nDescription: ${item.description || 'N/A'}`
    });
  };

  const renderService = ({ item }: { item: ServiceItem }) => {
    const images = item.images && item.images.length > 0 ? item.images : (item.image_url ? [item.image_url] : []);
    const mainImage = images[0] || 'https://via.placeholder.com/400x300?text=Service';

    return (
      <View style={styles.card}>
        <Image source={{ uri: mainImage }} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <Text style={styles.serviceName}>{item.name}</Text>
          <Text style={styles.serviceType}>{item.type}</Text>
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          
          <View style={styles.footer}>
            <Text style={styles.priceText}>{item.price ? `₹${item.price}` : 'On Request'}</Text>
            <TouchableOpacity style={styles.inquireButton} onPress={() => handleInquire(item)}>
              <Text style={styles.inquireButtonText}>Inquire</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <View style={styles.header}>
        <Text style={styles.title}>Service Catalog</Text>
        <View style={styles.searchContainer}>
          <Search size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, activeFilter === f && styles.activeFilterChip]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.activeFilterText]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#db2777" />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderService}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={<Text style={styles.emptyText}>No services found.</Text>}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  filterContainer: {
    height: 80,
    backgroundColor: '#fff',
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  activeFilterText: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 16,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    maxWidth: '48%', // Approx for 2 columns with gap
  },
  cardImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  serviceType: {
    fontSize: 12,
    color: '#db2777',
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
    height: 36, // limit height for alignment
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  inquireButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#db2777',
    borderRadius: 6,
  },
  inquireButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 40,
  },
});
