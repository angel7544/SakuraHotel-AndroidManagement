import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking, ActivityIndicator, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MapPin } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

export default function Header({ title }: { title?: string }) {
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
    navigation.navigate('Login'); 
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: 0 }]}>
      <View style={styles.contentContainer}>
        <View style={styles.logoContainer}>
          <TouchableOpacity 
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
            style={styles.logoButton}
          >
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logoImage} 
              resizeMode="contain" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}>
            <View style={styles.titleContainer}>
              <Text style={styles.logoText} numberOfLines={1}>
                {title || 'Sakura Hotel'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={openMap}
          >
            <MapPin size={22} color="#db2777" />
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="small" color="#db2777" />
          ) : user ? (
            <TouchableOpacity onPress={handleUserPress} style={styles.profileButton}>
              {user.image_url ? (
                <Image 
                  source={{ uri: user.image_url }} 
                  style={styles.profileImage} 
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#ffffffe9',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoButton: {
    marginRight: 12,
    padding: 4,
  },
  logoImage: {
    width: 36,
    height: 36,
  },
  titleContainer: {
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fdf2f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fdf2f8',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#db2777',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#db2777',
    borderRadius: 20,
  },
  loginText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});