import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { Phone, Mail, MapPin, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ContactScreen() {
  const route = useRoute<any>();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { interest, type, details } = route.params || {};
    if (interest) {
      let text = `I am interested in booking the ${type ? type : "item"}: "${interest}".\n`;
      if (details) {
        text += `\nDetails:\n${details}\n`;
      }
      text += `\nPlease provide more information and availability.`;
      
      // Only set if message is empty or starts with "I am interested"
      if (!message || message.startsWith("I am interested")) {
        setMessage(text);
      }
    }
  }, [route.params]);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const handleCheckInChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowCheckInPicker(false);
    }
    if (selectedDate) {
      setCheckIn(selectedDate);
    }
  };

  const handleCheckOutChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowCheckOutPicker(false);
    }
    if (selectedDate) {
      setCheckOut(selectedDate);
    }
  };

  const handleSubmit = async () => {
    if (!name || !phone || !checkIn || !checkOut) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('reservations').insert([{
        customer_name: name,
        customer_phone: phone,
        customer_email: email,
        check_in: formatDate(checkIn),
        check_out: formatDate(checkOut),
        notes: message,
        status: 'Pending',
      }]);

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Inquiry submitted successfully!');
      setName('');
      setPhone('');
      setEmail('');
      setCheckIn(null);
      setCheckOut(null);
      setMessage('');
    } catch (error: any) {
      console.error('Submission error:', error);
      Alert.alert('Error', 'Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  function openLink(arg0: string): void {
    // Implement linking if needed, e.g. Linking.openURL(arg0)
    console.log('Open link:', arg0); 
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Contact & Inquiry</Text>
        <Text style={styles.subtitle}>Have questions or ready to book? Fill out the form below.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Send Inquiry</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="John Doe"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Phone *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 234..."
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="john@example.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Check In *</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowCheckInPicker(true)}
            >
              <Text style={checkIn ? styles.dateText : styles.placeholderText}>
                {checkIn ? formatDate(checkIn) : 'YYYY-MM-DD'}
              </Text>
              <Calendar size={16} color="#6b7280" />
            </TouchableOpacity>
            {showCheckInPicker && (
              <DateTimePicker
                value={checkIn || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleCheckInChange}
                minimumDate={new Date()}
              />
            )}
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Check Out *</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowCheckOutPicker(true)}
            >
              <Text style={checkOut ? styles.dateText : styles.placeholderText}>
                {checkOut ? formatDate(checkOut) : 'YYYY-MM-DD'}
              </Text>
              <Calendar size={16} color="#6b7280" />
            </TouchableOpacity>
            {showCheckOutPicker && (
              <DateTimePicker
                value={checkOut || new Date(new Date().setDate(new Date().getDate() + 1))}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleCheckOutChange}
                minimumDate={checkIn || new Date()}
              />
            )}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={message}
            onChangeText={setMessage}
            placeholder="I would like to book..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Inquiry</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <TouchableOpacity 
          style={styles.infoItem}
          onPress={() => openLink('tel:+919135893002')}
        >
          <View style={styles.iconContainer}>
            <Phone size={20} color="#db2777" />
          </View>
          <View>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>+91 91358 93002</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.infoItem}
          onPress={() => openLink('https://maps.google.com/?q=br31+technologies')}
        >
          <View style={styles.iconContainer}>
            <MapPin size={20} color="#db2777" />
          </View>
          <View>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>Gangtok, Sikkim, India</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.infoItem}
          onPress={() => openLink('mailto:support@br31tech.live')}
        >
          <View style={styles.iconContainer}>
            <Mail size={20} color="#db2777" />
          </View>
          <View>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>support@br31tech.live</Text>
          </View>
        </TouchableOpacity></View>
      </ScrollView>
    
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  dateInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
  },
  placeholderText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  textArea: {
    height: 100,
  },
  submitButton: {
    backgroundColor: '#db2777',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#fce7f3',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  infoValue: {
    fontSize: 14,
    color: '#6b7280',
  },
});
