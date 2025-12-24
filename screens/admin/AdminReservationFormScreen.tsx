import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { Save, ArrowLeft } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';

// Helper for date input since we don't have a date picker installed yet
const DateInput = ({ label, value, onChange }: { label: string, value: string, onChange: (t: string) => void }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label} (YYYY-MM-DD)</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholder="YYYY-MM-DD"
    />
  </View>
);

export default function AdminReservationFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { id } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    customer_name: '',
    check_in: new Date().toISOString().split('T')[0],
    check_out: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    status: 'Confirmed',
    notes: '',
    total_amount: '',
    hotel_id: '',
    room_id: '',
  });

  useEffect(() => {
    fetchAvailableRooms();
    if (id) {
      fetchReservation();
    }
  }, [id]);

  const fetchAvailableRooms = async () => {
    const { data } = await supabase
      .from('rooms')
      .select('id, room_number, type, price, hotel_id, hotels(name), status')
      .eq('status', 'Available');
    if (data) setAvailableRooms(data);
  };

  const fetchReservation = async () => {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      Alert.alert('Error', 'Failed to fetch reservation details');
      navigation.goBack();
    } else {
      setFormData({
        customer_name: data.customer_name || '',
        check_in: data.check_in || new Date().toISOString().split('T')[0],
        check_out: data.check_out || new Date(Date.now() + 86400000).toISOString().split('T')[0],
        status: data.status || 'Confirmed',
        notes: data.notes || '',
        total_amount: data.total_amount?.toString() || '',
        hotel_id: data.hotel_id || '',
        room_id: data.room_id || '',
      });
    }
    setFetching(false);
  };

  const handleSave = async () => {
    if (!formData.customer_name || !formData.check_in || !formData.check_out) {
      Alert.alert('Validation', 'Customer Name and Dates are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer_name: formData.customer_name,
        check_in: formData.check_in,
        check_out: formData.check_out,
        status: formData.status,
        notes: formData.notes || null,
        room_id: formData.room_id || null,
        total_amount: formData.total_amount ? parseFloat(formData.total_amount) : 0,
        // If hotel_id is empty string, make it null
        hotel_id: formData.hotel_id || null, 
      };

      if (id) {
        const { error } = await supabase.from('reservations').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('reservations').insert([payload]);
        if (error) throw error;
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#db2777" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>{id ? 'Edit Reservation' : 'New Reservation'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Customer Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.customer_name}
            onChangeText={(text) => setFormData({ ...formData, customer_name: text })}
            placeholder="Full Name"
          />
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <DateInput 
              label="Check In" 
              value={formData.check_in} 
              onChange={(t) => setFormData({ ...formData, check_in: t })}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
             <DateInput 
              label="Check Out" 
              value={formData.check_out} 
              onChange={(t) => setFormData({ ...formData, check_out: t })}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Room (Optional)</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.room_id}
              onValueChange={(itemValue) => {
                const room = availableRooms.find(r => r.id === itemValue);
                // Calculate total based on room price and days if dates are valid
                let newTotal = formData.total_amount;
                if (room && formData.check_in && formData.check_out) {
                    const start = new Date(formData.check_in);
                    const end = new Date(formData.check_out);
                    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
                    const total = (days > 0 ? days : 1) * room.price;
                    newTotal = total.toString();
                }

                setFormData({ 
                  ...formData, 
                  room_id: itemValue,
                  hotel_id: room ? room.hotel_id : '',
                  total_amount: newTotal
                });
              }}
            >
              <Picker.Item label="-- Select Room --" value="" />
              {availableRooms.map(r => (
                <Picker.Item 
                  key={r.id} 
                  label={`Room ${r.room_number} (${r.type}) - ₹${r.price}`} 
                  value={r.id} 
                />
              ))}
            </Picker>
          </View>
          <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            Leave empty to create an enquiry/pending reservation.
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.status}
              onValueChange={(itemValue) => setFormData({ ...formData, status: itemValue })}
            >
              <Picker.Item label="Pending" value="Pending" />
              <Picker.Item label="Confirmed" value="Confirmed" />
              <Picker.Item label="Checked In" value="Checked In" />
              <Picker.Item label="Checked Out" value="Checked Out" />
              <Picker.Item label="Cancelled" value="Cancelled" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Total Amount (₹)</Text>
          <TextInput
            style={styles.input}
            value={formData.total_amount}
            onChangeText={(text) => setFormData({ ...formData, total_amount: text })}
            placeholder="0.00"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            placeholder="Special requests or notes..."
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.footerButtons}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Save size={20} color="#fff" />
                <Text style={styles.saveText}>Save Reservation</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: { padding: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  form: { padding: 16, paddingBottom: 100 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  textArea: { textAlignVertical: 'top', minHeight: 100 },
  footerButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  saveButton: {
    flex: 2,
    backgroundColor: '#db2777',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
});
