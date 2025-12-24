import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  Image,
  TouchableOpacity,
  Alert,
  useWindowDimensions
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Package, Plus, Edit2, Trash2 } from 'lucide-react-native';

import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

export default function AdminPackagesScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const numColumns = isLargeScreen ? 2 : 1;

  useEffect(() => {
    fetchPackages();
    const channel = supabase.channel('admin-packages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'packages' }, fetchPackages)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchPackages = async () => {
    const { data } = await supabase.from('packages').select('*').order('created_at');
    if (data) setPackages(data);
    setLoading(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Package',
      'Are you sure you want to delete this package?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            const { error } = await supabase.from('packages').delete().eq('id', id);
            if (error) Alert.alert('Error', error.message);
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.imageContainer}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholderImage, { backgroundColor: colors.background }]}>
             <Package size={32} color={colors.textMuted} />
             <Text style={[styles.placeholderText, { color: colors.textMuted }]}>No Image</Text>
          </View>
        )}
        <View style={[
          styles.statusBadge, 
          { backgroundColor: item.status === 'Active' ? '#dcfce7' : '#fee2e2' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.status === 'Active' ? '#166534' : '#991b1b' }
          ]}>
            {item.status || 'Active'}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.price, { color: colors.primary }]}>₹{item.price}</Text>
        </View>
        
        <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>
        
        <View style={styles.detailsRow}>
           {item.number_of_days && (
               <View style={[styles.detailBadge, { backgroundColor: colors.background }]}>
                   <Text style={[styles.detailText, { color: colors.textSecondary }]}>{item.number_of_days} Days</Text>
               </View>
           )}
           {item.is_featured && (
               <View style={[styles.detailBadge, { backgroundColor: '#fff7ed' }]}>
                   <Text style={[styles.detailText, { color: '#c2410c' }]}>Featured</Text>
               </View>
           )}
           {item.is_corporate && (
               <View style={[styles.detailBadge, { backgroundColor: '#eff6ff' }]}>
                   <Text style={[styles.detailText, { color: '#1d4ed8' }]}>Corporate</Text>
               </View>
           )}
           {item.is_wedding && (
               <View style={[styles.detailBadge, { backgroundColor: '#fdf2f8' }]}>
                   <Text style={[styles.detailText, { color: '#db2777' }]}>Wedding</Text>
               </View>
           )}
        </View>

        <View style={styles.actions}>
            <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('AdminPackageForm', { id: item.id })}>
                <Edit2 size={16} color={colors.textSecondary} />
                <Text style={[styles.actionText, { color: colors.textSecondary }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                <Trash2 size={16} color={colors.error} />
                <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topActions, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Manage Packages</Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AdminPackageForm')}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          key={numColumns}
          data={packages}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={numColumns}
          columnWrapperStyle={isLargeScreen ? styles.columnWrapper : undefined}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No packages found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  addButton: {
    backgroundColor: '#db2777',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 8 },
  columnWrapper: { },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 8,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    height: 160,
    backgroundColor: '#f3f4f6',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  placeholderImage: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#9ca3af', marginTop: 8 },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  content: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 18, fontWeight: '700', color: '#111827', flex: 1 },
  price: { fontSize: 16, fontWeight: '600', color: '#db2777' },
  desc: { color: '#6b7280', marginBottom: 12, lineHeight: 20 },
  detailsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  detailBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  detailText: { fontSize: 12, color: '#4b5563', fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 12 },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fee2e2',
    gap: 8,
  },
  actionText: { fontSize: 14, fontWeight: '500', color: '#4b5563' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { color: '#6b7280', fontSize: 16 },
});