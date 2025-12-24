import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  TextInput,
  Image,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { uploadImage } from '../../lib/upload';
import { Save, Upload, LogOut, Moon, Sun } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { signOut } from '../../lib/auth';
import { useTheme } from '../../context/ThemeContext';

export default function AdminSettingsScreen() {
  const navigation = useNavigation<any>();
  const { theme, toggleTheme, colors } = useTheme();
  const [loading, setLoading] = useState(false);
  
  const [settings, setSettings] = useState({
    siteName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    currency: 'INR',
    logo: null as string | null,
  });

  const [newLogo, setNewLogo] = useState<string | null>(null);

  React.useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows"
         console.error('Error fetching settings:', error);
      }
      
      if (data) {
        setSettings({
          siteName: data.site_name || '',
          contactEmail: data.contact_email || '',
          contactPhone: data.contact_phone || '',
          address: data.address || '',
          currency: data.currency || 'INR',
          logo: data.logo_url || null,
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setNewLogo(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let finalLogoUrl = settings.logo;

      if (newLogo) {
        const url = await uploadImage(newLogo, 'sakura', 'settings');
        if (url) finalLogoUrl = url;
      }

      const payload = {
        id: 'default', // Singleton row
        site_name: settings.siteName,
        contact_email: settings.contactEmail,
        contact_phone: settings.contactPhone,
        address: settings.address,
        currency: settings.currency,
        logo_url: finalLogoUrl,
      };

      const { error } = await supabase
        .from('settings')
        .upsert(payload);

      if (error) throw error;

      Alert.alert('Success', 'Settings saved successfully');
      setNewLogo(null);
      if (finalLogoUrl !== settings.logo) {
         setSettings(prev => ({ ...prev, logo: finalLogoUrl }));
      }

    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Logout', 
            style: 'destructive',
            onPress: async () => {
              await signOut();
            }
          }
        ]
      );
    };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topActions, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={styles.logoutButton} onPress={toggleTheme}>
            {theme === 'dark' ? <Sun size={20} color={colors.warning} /> : <Moon size={20} color={colors.text} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Site Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
            value={settings.siteName}
            onChangeText={(text) => setSettings({ ...settings, siteName: text })}
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Logo</Text>
          <View style={styles.logoContainer}>
            {(newLogo || settings.logo) ? (
              <Image source={{ uri: newLogo || settings.logo || '' }} style={styles.logoPreview} />
            ) : (
              <View style={[styles.logoPlaceholder, { backgroundColor: colors.border }]}>
                <Text style={[styles.logoPlaceholderText, { color: colors.textMuted }]}>No Logo</Text>
              </View>
            )}
            <TouchableOpacity style={[styles.chooseFileButton, { backgroundColor: colors.background, borderColor: colors.primary }]} onPress={pickImage}>
              <Text style={[styles.chooseFileText, { color: colors.primary }]}>Choose File</Text>
            </TouchableOpacity>
            <Text style={[styles.noFileChosenText, { color: colors.textMuted }]}>
              {newLogo ? 'Image selected' : (settings.logo ? 'Current logo' : 'No file chosen')}
            </Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Contact Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
            value={settings.contactEmail}
            onChangeText={(text) => setSettings({ ...settings, contactEmail: text })}
            keyboardType="email-address"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Contact Phone</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
            value={settings.contactPhone}
            onChangeText={(text) => setSettings({ ...settings, contactPhone: text })}
            keyboardType="phone-pad"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Address</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
            value={settings.address}
            onChangeText={(text) => setSettings({ ...settings, address: text })}
            multiline
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Currency</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
            <Picker
              selectedValue={settings.currency}
              onValueChange={(itemValue) => setSettings({ ...settings, currency: itemValue })}
              style={{ color: colors.text }}
              dropdownIconColor={colors.text}
            >
              <Picker.Item label="INR (₹)" value="INR" color={colors.text} />
              <Picker.Item label="USD ($)" value="USD" color={colors.text} />
              <Picker.Item label="EUR (€)" value="EUR" color={colors.text} />
            </Picker>
          </View>
        </View>

        <View style={styles.footer}>
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Save size={20} color="#fff" />}
                <Text style={styles.saveButtonText}>Save Settings</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    fontWeight: 'bold',
    color: '#111827',
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoPreview: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  logoPlaceholderText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  chooseFileButton: {
    backgroundColor: '#fdf2f8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fce7f3',
  },
  chooseFileText: {
    color: '#db2777',
    fontWeight: '600',
    fontSize: 14,
  },
  noFileChosenText: {
    color: '#6b7280',
    fontSize: 14,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  footer: {
      alignItems: 'flex-end',
      marginTop: 20,
      marginBottom: 40,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#db2777',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});