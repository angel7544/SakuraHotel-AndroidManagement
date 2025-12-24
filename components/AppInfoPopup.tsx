import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking, Modal } from 'react-native';
import { 
  Globe,
  Github,
  X,
} from 'lucide-react-native';

interface AppInfoPopupProps {
  visible: boolean;
  onClose: () => void;
}

export default function AppInfoPopup({ visible, onClose }: AppInfoPopupProps) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
          >
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
          
          <Image 
            source={require('../assets/2logo.png')} 
            style={styles.modalLogo} 
            resizeMode="contain"
          />
          
          {/* <Text style={styles.modalTitle}>HotelSakura Management</Text> */}
          
          <View style={styles.divider} />
          
          <Text style={styles.developedBy}>Developed by</Text>
          <Text style={styles.developerName}>Angel Mehul Singh</Text>
          
          <View style={styles.techLogoContainer}>
              <Image 
              source={require('../assets/br31logo.png')} 
              style={styles.techLogo} 
              resizeMode="contain"
            />
            <Text style={styles.techText}>@br31tech.live</Text>
          </View>

          <View style={styles.socialLinks}>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => Linking.openURL('https://br31tech.live')}
            >
              <Globe size={20} color="#db2777" />
              <Text style={styles.socialText}>Website</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => Linking.openURL('https://github.com/angel7544')}
            >
              <Github size={20} color="#333" />
              <Text style={styles.socialText}>GitHub</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(205, 205, 205, 0.69)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#dfdddd',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    // shadowColor: '#000000',
    // shadowOffset: { width: 0, height: 0 },
    // shadowOpacity: 0.1,
    // shadowRadius: 0,
    // elevation: 0,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  modalLogo: {
    width: 240,
    height: 120,
    marginBottom: 5,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#db2777',
    marginBottom: 24,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#f3f4f6',
    marginBottom: 24,
  },
  developedBy: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  developerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  techLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4d4d4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 24,
  },
  techLogo: {
    width: 56,
    height: 24,
    marginRight: 8,
  },
  techText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#db2777',
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  socialText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
});
