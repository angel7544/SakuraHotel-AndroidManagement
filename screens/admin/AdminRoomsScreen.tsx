import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Image
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Bed, Plus, Edit2, Trash2, Hotel, RefreshCw } from 'lucide-react-native';

import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

export default function AdminRoomsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rooms')
      .select('*, hotels(name)')
      .order('room_number');
    
    if (data) setRooms(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRooms();
    }, [fetchRooms])
  );

  useEffect(() => {
    const channel = supabase.channel('admin-rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetchRooms)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchRooms]);

  const toggleStatus = async (room: any) => {
    const newStatus = room.status === 'Available' ? 'Maintenance' : 'Available';
    const { error } = await supabase.from('rooms').update({ status: newStatus }).eq('id', room.id);
    if (error) Alert.alert('Error', error.message);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Room',
      'Are you sure you want to delete this room?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            const { error } = await supabase.from('rooms').delete().eq('id', id);
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
             <Bed size={32} color={colors.textMuted} />
             <Text style={[styles.placeholderText, { color: colors.textMuted }]}>No Image</Text>
          </View>
        )}
        <TouchableOpacity 
          style={[
            styles.statusBadge, 
            { backgroundColor: item.status === 'Available' ? '#dcfce7' : '#fee2e2' }
          ]}
          onPress={() => toggleStatus(item)}
        >
          <Text style={[
            styles.statusText,
            { color: item.status === 'Available' ? '#166534' : '#991b1b' }
          ]}>
            {item.status}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.roomNumber, { color: colors.text }]}>Room {item.room_number}</Text>
          <Text style={[styles.price, { color: colors.primary }]}>₹{item.price}/night</Text>
        </View>
        
        <Text style={[styles.type, { color: colors.textSecondary }]}>{item.type}</Text>
        
        <View style={styles.hotelRow}>
            <Hotel size={14} color={colors.textMuted} />
            <Text style={[styles.hotelName, { color: colors.textMuted }]}>{item.hotels?.name || 'Unknown Hotel'}</Text>
        </View>

        <View style={styles.actions}>
            <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('AdminRoomForm', { id: item.id })}>
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
        <Text style={[styles.title, { color: colors.text }]}>Manage Rooms</Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AdminRoomForm')}
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
          data={rooms}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No rooms found</Text>
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
  listContent: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    height: 150,
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
  roomNumber: { fontSize: 18, fontWeight: '700', color: '#111827' },
  price: { fontSize: 16, fontWeight: '600', color: '#db2777' },
  type: { color: '#6b7280', marginBottom: 8 },
  hotelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  hotelName: { color: '#6b7280', fontSize: 14 },
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