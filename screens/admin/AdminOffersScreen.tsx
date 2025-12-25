import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert, 
  DeviceEventEmitter
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Tag, Calendar } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function AdminOffersScreen() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();


  useEffect(() => {
    const channel = supabase.channel('admin-offers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, fetchOffers)
      .subscribe();
      
    const refreshSub = DeviceEventEmitter.addListener('refresh', (screenName) => {
      if (screenName === 'Offers') {
        fetchOffers();
      }
    });

    return () => { 
      supabase.removeChannel(channel); 
      refreshSub.remove();
    };
  }, );
  
  useEffect(() => {
    fetchOffers();

    const channel = supabase.channel('admin-offers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, fetchOffers)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error(error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Offer',
      'Are you sure you want to delete this offer?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('offers').delete().eq('id', id);
            if (error) Alert.alert('Error', error.message);
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { 
          backgroundColor: item.is_active ? '#dcfce7' : '#fee2e2' 
        }]}>
          <Text style={[styles.statusText, { 
            color: item.is_active ? '#166534' : '#991b1b' 
          }]}>{item.is_active ? 'Active' : 'Inactive'}</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={() => navigation.navigate('AdminOfferForm', { id: item.id })} style={styles.iconButton}>
            <Edit2 size={18} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconButton}>
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contentRow}>
        <View style={styles.imageContainer}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <Tag size={24} color="#9ca3af" />
            </View>
          )}
        </View>
        
        <View style={styles.textContent}>
          <Text style={styles.titleText}>{item.title}</Text>
          <Text style={styles.discount}>{item.discount_value}</Text>
          {item.discount_code && (
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>{item.discount_code}</Text>
            </View>
          )}
        </View>
      </View>
      
      <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      
      <View style={styles.datesRow}>
        <Calendar size={14} color="#6b7280" />
        <Text style={styles.dateText}>
          {item.start_date || 'N/A'} - {item.end_date || 'N/A'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topActions}>
        <Text style={styles.title}>Add Offers</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AdminOfferForm')}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Create Offer</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#db2777" />
        </View>
      ) : (
        <FlatList
          data={offers}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No offers found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#db2777',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  contentRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  discount: {
    fontSize: 14,
    color: '#db2777',
    fontWeight: '600',
    marginBottom: 4,
  },
  codeBadge: {
    backgroundColor: '#f3f4f6',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  codeText: {
    fontSize: 12,
    color: '#4b5563',
    fontFamily: 'monospace',
  },
  description: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
  },
});
