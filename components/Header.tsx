import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MapPin, User, LogOut } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export default function Header() {
  const navigation = useNavigation<any>();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await fetchUserProfile(session?.user ?? null);
      setLoading(false);
    };

    initUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await fetchUserProfile(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (currentUser: any) => {
    if (!currentUser) {
      setUser(null);
      return;
    }
    try {
      const { data: staffData } = await supabase
        .from('staff')
        .select('image_url')
        .eq('user_id', currentUser.id)
        .single();
        
      if (staffData?.image_url) {
        setUser({ ...currentUser, image_url: staffData.image_url });
      } else {
        setUser(currentUser);
      }
    } catch (e) {
      console.log('Error fetching staff profile', e);
      setUser(currentUser);
    }
  };

  const checkUser = async () => {
    // Legacy function kept for compatibility if called elsewhere, but logic moved to fetchUserProfile
    const { data: { session } } = await supabase.auth.getSession();
    await fetchUserProfile(session?.user ?? null);
  };

  const openMap = () => {
    Linking.openURL('https://maps.app.goo.gl/9RFtydCm1TzC9QK99');
  };

  const handleUserPress = () => {
    // Navigate to More tab if logged in, or Login if not?
    // Usually avatar click goes to profile or settings
    navigation.navigate('More'); 
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.logoContainer}>
        <View style={styles.logoIconBg}>
           <Image source={require('../assets/logo.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />
        </View>
        <Text style={styles.logoText}>Sakura Hotel</Text>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={openMap}
        >
          <MapPin size={24} color="#db2777" />
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="small" color="#db2777" />
        ) : user ? (
          <TouchableOpacity 
            style={styles.userButton}
            onPress={handleUserPress}
          >
            {user.image_url ? (
              <Image source={{ uri: user.image_url }} style={{ width: 36, height: 36, borderRadius: 18 }} />
            ) : (
              <View style={styles.avatar}>
                 <Text style={styles.avatarText}>
                   {user.email?.charAt(0).toUpperCase() || 'U'}
                 </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={() => navigation.navigate('Rooms')} 
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIconBg: {
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800', 
    color: '#111827',
    fontFamily: 'serif', 
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  bookButton: {
    backgroundColor: '#db2777', 
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  userButton: {
    padding: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fce7f3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#db2777',
  },
  avatarText: {
    color: '#db2777',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
