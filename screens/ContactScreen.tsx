import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  Platform, 
  KeyboardAvoidingView,
  Linking,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  ArrowLeft, 
  Send, 
  User, 
  MessageSquare,
  Info
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

export default function ContactScreen() {
  const navigation = useNavigation();
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
      
      if (!message || message.startsWith("I am interested")) {
        setMessage(text);
      }
    }
  }, [route.params]);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleCheckInChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowCheckInPicker(false);
    }
    if (selectedDate) {
      setCheckIn(selectedDate);
      // Auto-set checkout to next day if not set or invalid
      if (!checkOut || selectedDate >= checkOut) {
        const nextDay = new Date(selectedDate);
        nextDay.setDate(selectedDate.getDate() + 1);
        setCheckOut(nextDay);
      }
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
      Alert.alert('Missing Information', 'Please fill in all required fields (Name, Phone, Dates).');
      return;
    }

    setLoading(true);
    try {
      console.log('Submitting reservation:', {
        customer_name: name,
        customer_phone: phone,
        customer_email: email,
        check_in: formatDate(checkIn),
        check_out: formatDate(checkOut),
        notes: message,
      });

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
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Database insertion failed');
      }

      console.log('Reservation submitted successfully');

      Alert.alert(
        'Success', 
        'Your inquiry has been submitted successfully! We will contact you shortly.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Submission error:', error);
      Alert.alert(
        'Submission Failed', 
        `We could not submit your inquiry.\n\nError: ${error.message || 'Unknown error'}\n\nPlease check your internet connection or try again later.`
      );
    } finally {
      setLoading(false);
    }
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Navbar / Header */}
      <View style={styles.navbar}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact & Booking</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Get in Touch</Text>
            <Text style={styles.heroSubtitle}>
              Plan your stay with us. Fill out the form or reach us directly.
            </Text>
          </View>

          {/* Contact Form Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Send size={20} color="#db2777" />
              <Text style={styles.cardTitle}>Reservation Inquiry</Text>
            </View>

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name *</Text>
              <View style={styles.inputWrapper}>
                <User size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. John Doe"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            {/* Phone & Email Row */}
            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Phone *</Text>
                <View style={styles.inputWrapper}>
                  <Phone size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+1 234..."
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
              
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Optional"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </View>

            {/* Dates Row */}
            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Check In *</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowCheckInPicker(true)}
                >
                  <Calendar size={20} color={checkIn ? "#db2777" : "#9ca3af"} />
                  <Text style={[styles.dateText, !checkIn && styles.placeholderText]}>
                    {checkIn ? formatDate(checkIn) : 'Select Date'}
                  </Text>
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

              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Check Out *</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowCheckOutPicker(true)}
                >
                  <Calendar size={20} color={checkOut ? "#db2777" : "#9ca3af"} />
                  <Text style={[styles.dateText, !checkOut && styles.placeholderText]}>
                    {checkOut ? formatDate(checkOut) : 'Select Date'}
                  </Text>
                </TouchableOpacity>
                {showCheckOutPicker && (
                  <DateTimePicker
                    value={checkOut || new Date(Date.now() + 86400000)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleCheckOutChange}
                    minimumDate={checkIn || new Date()}
                  />
                )}
              </View>
            </View>

            {/* Message Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Message / Special Requests</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <MessageSquare size={20} color="#9ca3af" style={[styles.inputIcon, { marginTop: 12 }]} />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="I would like to book a room with..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Send Request</Text>
                  <ArrowLeft size={18} color="#fff" style={{ transform: [{ rotate: '180deg' }] }} />
                </>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  scrollContent: {
    padding: 16,
  },
  hero: {
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  inputContainer: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  textAreaWrapper: {
    height: 120,
    alignItems: 'flex-start',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    height: '100%',
  },
  textArea: {
    paddingVertical: 12,
    height: '100%',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    gap: 8,
  },
  dateText: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  submitButton: {
    backgroundColor: '#db2777',
    borderRadius: 12,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: '#db2777',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
    marginLeft: 4,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  footerSpacer: {
    height: 40,
  }
});
