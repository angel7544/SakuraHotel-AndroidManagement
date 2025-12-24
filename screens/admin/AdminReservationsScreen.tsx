import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  Modal,
  ScrollView,
  DeviceEventEmitter,
  RefreshControl
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  MessageSquare,
  Trash2,
  Plus,
  Edit2,
  RefreshCw,
  Bed
} from 'lucide-react-native';

import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function AdminReservationsScreen() {
  const navigation = useNavigation<any>();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All'); // All, Pending, Confirmed
  
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReservations = useCallback(async () => {
    if (!refreshing) setLoading(true);
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) setReservations(data);
    if (!refreshing) setLoading(false);
  }, [refreshing]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReservations();
    setRefreshing(false);
  }, [fetchReservations]);

  useFocusEffect(
    useCallback(() => {
      fetchReservations();
    }, [fetchReservations])
  );

  useEffect(() => {
    const channel = supabase.channel('admin-res')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, fetchReservations)
      .subscribe();
      
    const refreshSub = DeviceEventEmitter.addListener('refresh', (screenName) => {
      if (screenName === 'Enquirey') {
        fetchReservations();
      }
    });

    return () => { 
      supabase.removeChannel(channel); 
      refreshSub.remove();
    };
  }, [fetchReservations]);

  const fetchAvailableRooms = async () => {
    setLoadingRooms(true);
    const { data, error } = await supabase
      .from('rooms')
      .select('*, hotels(name)')
      .eq('status', 'Available');
      
    if (!error && data) {
       // Filter out rooms that are already booked in active reservations?
       // For now just show all 'Available' status rooms from DB
       setAvailableRooms(data);
    }
    setLoadingRooms(false);
  };

  const openAssignModal = (reservation: any) => {
    setSelectedReservation(reservation);
    setAssignModalVisible(true);
    fetchAvailableRooms();
  };

  const handleAssignRoom = async (room: any) => {
    if (!selectedReservation) return;

    const { error } = await supabase
      .from('reservations')
      .update({
        room_id: room.id,
        room_number: room.room_number,
        hotel_name: room.hotels?.name,
        status: 'Confirmed' 
      })
      .eq('id', selectedReservation.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', `Assigned Room ${room.room_number} to ${selectedReservation.customer_name}`);
      setAssignModalVisible(false);
      fetchReservations();
    }
  };


  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('reservations').update({ status }).eq('id', id);
    if (error) Alert.alert('Error', error.message);
    else fetchReservations();
  };

  const handleDelete = (item: any) => {
    Alert.alert(
      'Delete Reservation',
      `Are you sure you want to delete the reservation for "${item.customer_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('reservations').delete().eq('id', item.id);
            if (error) Alert.alert('Error', error.message);
          }
        }
      ]
    );
  };

  const filteredData = reservations.filter(r => {
    const matchesSearch = (r.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (r.id || '').includes(searchTerm);
    const matchesFilter = filter === 'All' || r.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return '#10b981';
      case 'Checked In': return '#3b82f6';
      case 'Pending': return '#f59e0b';
      case 'Cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerTop}>
          <Text style={styles.customerName}>{item.customer_name}</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => navigation.navigate('AdminReservationForm', { id: item.id })}>
              <Edit2 size={18} color="#4b5563" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)}>
              <Trash2 size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.datesContainer}>
        <View style={styles.dateRow}>
          <Calendar size={14} color="#6b7280" />
          <Text style={styles.detailText}>In: {item.check_in}</Text>
        </View>
        <View style={styles.dateRow}>
          <Calendar size={14} color="#6b7280" />
          <Text style={styles.detailText}>Out: {item.check_out}</Text>
        </View>
      </View>

      {(item.hotel_name || item.room_number) && (
        <View style={styles.roomInfo}>
          <Text style={styles.roomText}>
            {item.hotel_name ? item.hotel_name : ''} 
            {item.hotel_name && item.room_number ? ' - ' : ''}
            {item.room_number ? `Room ${item.room_number}` : ''}
          </Text>
        </View>
      )}

      {item.notes && (
        <View style={styles.notesContainer}>
          <MessageSquare size={14} color="#6b7280" />
          <Text style={styles.notes}>"{item.notes}"</Text>
        </View>
      )}

      <View style={styles.actions}>
        {item.status === 'Pending' && (
          <>
            <TouchableOpacity style={[styles.actionButton, styles.confirmButton]} onPress={() => updateStatus(item.id, 'Confirmed')}>
              <CheckCircle size={16} color="#fff" />
              <Text style={styles.actionText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={() => updateStatus(item.id, 'Cancelled')}>
              <XCircle size={16} color="#fff" />
              <Text style={styles.actionText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
        {item.status === 'Confirmed' && (
             <TouchableOpacity style={[styles.actionButton, styles.checkInButton]} onPress={() => updateStatus(item.id, 'Checked In')}>
              <CheckCircle size={16} color="#fff" />
              <Text style={styles.actionText}>Check In</Text>
            </TouchableOpacity>
        )}
        {item.status === 'Checked In' && (
             <TouchableOpacity style={[styles.actionButton, styles.checkOutButton]} onPress={() => updateStatus(item.id, 'Checked Out')}>
              <Clock size={16} color="#fff" />
              <Text style={styles.actionText}>Check Out</Text>
            </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Modal
        visible={assignModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Room</Text>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                <XCircle size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Select a room for {selectedReservation?.customer_name}
            </Text>

            {loadingRooms ? (
              <ActivityIndicator size="large" color="#db2777" style={{ marginVertical: 20 }} />
            ) : (
              <FlatList
                data={availableRooms}
                keyExtractor={item => item.id}
                style={{ maxHeight: 400 }}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.roomItem}
                    onPress={() => handleAssignRoom(item)}
                  >
                    <View>
                      <Text style={styles.roomItemName}>{item.hotels?.name}</Text>
                      <Text style={styles.roomItemNumber}>Room {item.room_number} ({item.type})</Text>
                    </View>
                    <Text style={styles.roomItemPrice}>₹{item.price}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No available rooms found.</Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      <View style={styles.topActions}>
        <Text style={styles.title}>Reservations</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('AdminReservationForm')}
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.addButtonText}>New Booking</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#9ca3af" />
          <TextInput 
            style={styles.input} 
            placeholder="Search Name or ID..." 
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        {['All', 'Pending', 'Confirmed'].map(f => (
          <TouchableOpacity 
            key={f} 
            style={[styles.filterChip, filter === f && styles.activeFilter]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.activeFilterText]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#db2777" />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#db2777']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No reservations found.</Text>
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
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addButtonText: { color: '#fff', fontWeight: '600' },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f3f4f6', 
    padding: 12, 
    borderRadius: 12, 
  },
  input: { flex: 1, marginLeft: 8, fontSize: 14 },
  filterRow: { 
    justifyContent: 'center',
    flexDirection: 'row', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activeFilter: { backgroundColor: '#111827', borderColor: '#111827' },
  filterText: { color: '#4b5563', fontWeight: '600', fontSize: 13 },
  activeFilterText: { color: '#fff' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12, 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: 12 
  },
  headerTop: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginRight: 8,
  },
  customerName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700' },
  datesContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  roomInfo: { marginBottom: 12 },
  roomText: { color: '#4b5563', fontSize: 14, fontWeight: '500' },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: { color: '#4b5563', fontSize: 14 },
  notesContainer: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#f9fafb',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  notes: { fontStyle: 'italic', color: '#6b7280', flex: 1, fontSize: 13 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionButton: { 
    flex: 1,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 10, 
    borderRadius: 8, 
    gap: 6 
  },
  confirmButton: { backgroundColor: '#10b981' },
  cancelButton: { backgroundColor: '#ef4444' },
  checkInButton: { backgroundColor: '#3b82f6' },
  checkOutButton: { backgroundColor: '#6366f1' },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: { textAlign: 'center', color: '#9ca3af' },
  modalSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  roomCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  roomCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roomCardNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  roomCardType: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  roomCardHotel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  roomCardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#db2777',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  roomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  roomItemName: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  roomItemNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  roomItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#db2777',
  },
});
