import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Image as ImageIcon, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../../lib/upload';

export default function AdminNotificationsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deviceCount, setDeviceCount] = useState<number | null>(null);
  const [sendViaFCM, setSendViaFCM] = useState(false); // New state for toggling FCM

  React.useEffect(() => {
    fetchDeviceCount();
  }, []);

  const fetchDeviceCount = async () => {
    try {
      const { count, error } = await supabase
        .from('push_tokens')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      setDeviceCount(count);
    } catch (error) {
      console.error('Error fetching device count:', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setImage(null);
  };

  const sendNotifications = async () => {
    if (!title || !body) {
      Alert.alert('Error', 'Please enter both title and body');
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = null;

      if (image) {
        finalImageUrl = await uploadImage(image, 'sakura', 'notifications');
      }

      // 1. Fetch all tokens
      const { data: tokens, error } = await supabase
        .from('push_tokens')
        .select('token');

      if (error) {
        throw error;
      }

      if (!tokens || tokens.length === 0) {
        Alert.alert('Info', 'No registered devices found to send notification. Please open the app on a physical device to register a token.');
        setLoading(false);
        return;
      }

      // 2. Prepare messages
      const messages = tokens.map(t => ({
        to: t.token,
        sound: 'default',
        title: title,
        body: body,
        data: { someData: 'admin_broadcast', url: finalImageUrl },
        ...(finalImageUrl && { image: finalImageUrl }), // For Android
      }));

      // 3. Send in batches of 100
      const CHUNK_SIZE = 100;
      const chunks = [];
      for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
        chunks.push(messages.slice(i, i + CHUNK_SIZE));
      }

      let successCount = 0;

      for (const chunk of chunks) {
        try {
          const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Accept-encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(chunk),
          });
          
          const result = await response.json();
          // Expo returns { data: [{ status: "ok" | "error" }] }
          if (result.data) {
             successCount += result.data.length; 
          }
        } catch (e) {
          console.error("Error sending chunk", e);
        }
      }

      Alert.alert('Success', `Notification sent to ${tokens.length} devices!`);
      setTitle('');
      setBody('');
      setImage(null);
    } catch (error: any) {
      console.error('Error sending notifications:', error);
      Alert.alert('Error', error.message || 'Failed to send notifications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Send Notification</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>Title</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Notification Title"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={[styles.label, { color: colors.text }]}>Message</Text>
          <TextInput
            style={[styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            value={body}
            onChangeText={setBody}
            placeholder="Notification Message"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={[styles.label, { color: colors.text }]}>Image (Optional)</Text>
          {image ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: image }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                <X color="#fff" size={20} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[styles.imageButton, { borderColor: colors.border }]} onPress={pickImage}>
              <ImageIcon color={colors.textMuted} size={24} />
              <Text style={[styles.imageButtonText, { color: colors.textMuted }]}>Select Image</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.checkboxContainer, { borderColor: colors.border }]} 
            onPress={() => setSendViaFCM(!sendViaFCM)}
          >
             <View style={[styles.checkbox, sendViaFCM && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                {sendViaFCM && <Send color="#fff" size={12} />}
             </View>
             <Text style={[styles.checkboxLabel, { color: colors.text }]}>
               Send via Firebase (FCM) 
               <Text style={{ fontSize: 10, color: colors.textMuted }}> (Experimental)</Text>
             </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={sendNotifications}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Send color="#fff" size={20} style={{ marginRight: 10 }} />
                <Text style={styles.buttonText}>Send to All Devices</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoContainer}>
            <Text style={[styles.infoText, { color: colors.textMuted, marginBottom: 5 }]}>
                {deviceCount !== null 
                  ? `Currently ${deviceCount} device(s) registered.` 
                  : 'Checking registered devices...'}
            </Text>
            <Text style={[styles.infoText, { color: colors.textMuted }]}>
                This will send a push notification to all devices that have installed the app and granted permission.
            </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 120,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
    marginTop: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    marginTop: 8,
  },
  imageButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    marginTop: 10,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    padding: 5,
  },
  infoContainer: {
      marginTop: 20,
      padding: 10,
  },
  infoText: {
      textAlign: 'center',
      fontSize: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
