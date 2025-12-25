import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Facebook,
  Instagram,
  X as XIcon,
  LayoutDashboard,
  LogIn,
  LogOut,
  User as UserIcon,
  X,
} from 'lucide-react-native';

const { height } = Dimensions.get('window');
const SHEET_HEIGHT = height * 0.55; // 55% of screen height

export default function MoreScreen() {
  const navigation = useNavigation<any>();
  const [user, setUser] = useState<User | null>(null);

  // Animation values
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Pan responder for swipe-down-to-close
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
          opacity.setValue(1 - gestureState.dy / SHEET_HEIGHT);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          closeSheet();
        } else {
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  useFocusEffect(
    useCallback(() => {
      // Reset values
      translateY.setValue(SHEET_HEIGHT);
      opacity.setValue(0);

      // Slide up on focus
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      return () => {
        // Reset on blur to ensure clean state next time
        translateY.setValue(SHEET_HEIGHT);
        opacity.setValue(0);
      };
    }, [SHEET_HEIGHT])
  );

  useEffect(() => {
    // Auth listener
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => navigation.goBack());
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Couldn't load page", err)
    );
  };

  return (
    <View style={styles.backdrop}>
      <Animated.View
        style={[
          styles.overlay,
          { opacity },
        ]}
      >
        <TouchableOpacity style={styles.flex1} onPress={closeSheet} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{ translateY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <SafeAreaView style={styles.safe} edges={['bottom']}>
          {/* Drag indicator */}
          <View style={styles.dragIndicator} />

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={closeSheet}>
            <X size={16} color="#6b7280" />
          </TouchableOpacity>

          {/* User Section */}
          <View style={styles.card}>
            {user ? (
              <View style={styles.userContainer}>
                <View style={styles.userInfoHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {user.email?.[0].toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.signedInLabel}>Signed in as</Text>
                    <Text style={styles.userEmail} numberOfLines={1}>
                      {user.email}
                    </Text>
                  </View>
                </View>

                <View style={styles.userActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.dashboardButton]}
                    onPress={() => {
                      closeSheet();
                      navigation.navigate('AdminDashboard');
                    }}
                  >
                    <LayoutDashboard size={14} color="#fff" />
                    <Text style={styles.dashboardButtonText}>Dashboard</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.logoutButton]}
                    onPress={handleLogout}
                  >
                    <LogOut size={14} color="#374151" />
                    <Text style={styles.logoutButtonText}>Sign Out</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.loginContainer}>
                <View style={styles.loginIconContainer}>
                  <LogIn size={18} color="#db2777" />
                </View>
                <Text style={styles.loginTitle}>Hotel Management</Text>
                <Text style={styles.loginSubtitle}>
                  Manage reservations and services
                </Text>

                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={() => {
                    closeSheet();
                    navigation.navigate('Login');
                  }}
                >
                  <Text style={styles.loginButtonText}>Login to Dashboard</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <Text style={styles.sectionHeader}>Connect With Us</Text>
          <View style={styles.grid}>
            <TouchableOpacity
              style={[
                styles.gridItem,
                { backgroundColor: '#eff6ff', borderColor: '#dbeafe' },
              ]}
              onPress={() => openLink('tel:+919135893002')}
            >
              <Phone size={18} color="#1d4ed8" />
              <Text style={[styles.gridLabel, { color: '#1d4ed8' }]}>
                Call Now
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.gridItem,
                { backgroundColor: '#fdf2f8', borderColor: '#fce7f3' },
              ]}
              onPress={() => {
                closeSheet();
                navigation.navigate('Contact');
              }}
            >
              <Mail size={18} color="#be185d" />
              <Text style={[styles.gridLabel, { color: '#be185d' }]}>
                Enquiry
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.gridItem,
                { backgroundColor: '#ecfdf5', borderColor: '#d1fae5' },
              ]}
              onPress={() =>
                openLink('https://maps.google.com/?q=br31+technologies')
              }
            >
              <MapPin size={18} color="#047857" />
              <Text style={[styles.gridLabel, { color: '#047857' }]}>
                Locate
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.gridItem,
                { backgroundColor: '#faf5ff', borderColor: '#f3e8ff' },
              ]}
              onPress={() => openLink('mailto:support@br31tech.live')}
            >
              <ExternalLink size={18} color="#7e22ce" />
              <Text style={[styles.gridLabel, { color: '#7e22ce' }]}>
                Email
              </Text>
            </TouchableOpacity>
          </View>

          {/* Socials */}
          <View style={styles.socialsContainer}>
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: '#eff6ff' }]}
              onPress={() => openLink('https://facebook.com/br31technologies')}
            >
              <Facebook size={16} color="#2563eb" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: '#fdf2f8' }]}
              onPress={() => openLink('https://instagram.com/br31tech.live')}
            >
              <Instagram size={16} color="#db2777" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: '#f3f4f6' }]}
              onPress={() => openLink('https://x.com/angelmehul')}
            >
              <XIcon size={16} color="#1f2937" />
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Powered by BR31 Technologies</Text>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  flex1: { flex: 1 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  safe: { flex: 1 },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d1d5db',
    alignSelf: 'center',
    marginVertical: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 6,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    zIndex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  userContainer: { padding: 12 },
  userInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fce7f3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#db2777',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#db2777',
  },
  userDetails: { flex: 1 },
  signedInLabel: {
    fontSize: 10,
    color: '#db2777',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  userEmail: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111827',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  dashboardButton: { backgroundColor: '#111827' },
  dashboardButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 11,
  },
  logoutButton: { backgroundColor: '#f3f4f6' },
  logoutButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 11,
  },
  loginContainer: {
    padding: 6,
    alignItems: 'center',
  },
  loginIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fdf2f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  loginTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  loginSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 10,
    textAlign: 'center',
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#db2777',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom:6,
  },
  gridItem: {
    width: '23%',
    aspectRatio: 1.3,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  socialsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginBottom: 4,
  },
  socialButton: {
    padding: 2,
    borderRadius: 999,
  },
  footer: { alignItems: 'center', opacity: 0.6 },
  footerText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
});
