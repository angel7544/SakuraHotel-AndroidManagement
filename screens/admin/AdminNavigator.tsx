import React, { useEffect, useState } from 'react';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking, Switch, Alert, Pressable, Modal, DeviceEventEmitter } from 'react-native';
import { 
  MessageCircle, 
  User as UserIcon, 
  LayoutDashboard, 
  Bed, 
  Package, 
  ConciergeBell, 
  Tag, 
  MessageSquare, 
  Building, 
  HelpCircle, 
  Users, 
  Settings, 
  LogOut, 
  Moon, 
  Sun,
  Info,
  Globe,
  Github,
  X,
  InfoIcon,
  RefreshCw,
  NewspaperIcon
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { signOut } from '../../lib/auth';
import { useTheme } from '../../context/ThemeContext';

import AdminDashboardScreen from './AdminDashboardScreen';
import AdminRoomsScreen from './AdminRoomsScreen';
import AdminPackagesScreen from './AdminPackagesScreen';
import AdminServicesScreen from './AdminServicesScreen';
import AdminHotelsScreen from './AdminHotelsScreen';
import AdminReservationsScreen from './AdminReservationsScreen';
import AdminStaffScreen from './AdminStaffScreen';
import AdminSettingsScreen from './AdminSettingsScreen';
import AdminOffersScreen from './AdminOffersScreen';
import AdminTestimonialsScreen from './AdminTestimonialsScreen';
import AppInfoPopup from '../../components/AppInfoPopup';

const Drawer = createDrawerNavigator();

const MENU_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { name: 'Rooms', icon: Bed, label: 'Rooms' },
  { name: 'Packages', icon: Package, label: 'Packages' },
  { name: 'Services', icon: ConciergeBell, label: 'Services' },
  { name: 'Offers', icon: Tag, label: 'Offers' },
  { name: 'Testimonial', icon: MessageSquare, label: 'Testimonials' },
  { name: 'Hotel', icon: Building, label: 'Hotels' },
  { name: 'Enquiries', icon: HelpCircle, label: 'Bookings' },
  { name: 'Staff', icon: Users, label: 'Staff' },
  { name: 'Blog', icon: NewspaperIcon, label: 'Blogs' },
  { name: 'AppInfo', icon: Info, label: 'App Info' },
];

function CustomDrawerContent(props: any) {
  const [user, setUser] = useState<any>(null);
  const { theme, toggleTheme, colors } = useTheme();
  const { showAppInfo, setShowAppInfo } = props;

  useEffect(() => {
    fetchUser();
  }, []);

  const isManager = user?.role?.toLowerCase() === 'manager' || user?.role?.toLowerCase() === 'owner';

  const filteredMenuItems = MENU_ITEMS.filter(item => {
    if (isManager) return true;
    // Hide these items for non-managers (Staff, Receptionist, Chef, etc.)
    return !['Hotel', 'Staff'].includes(item.name);
  });

  const fetchUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // First try to get staff details
        const { data: staffData, error } = await supabase
          .from('staff')
          .select('*')
          .eq('user_id', authUser.id)
          .maybeSingle();
        
        if (staffData) {
          setUser(staffData);
        } else {
          // Fallback to basic user info
          setUser({
            name: authUser.email?.split('@')[0] || 'Admin',
            role: 'Admin',
            image_url: null
          });
        }
      }
    } catch (error) {
      console.log('Error fetching user:', error);
      // Set a default user to prevent UI crashes
      setUser({
        name: 'Admin',
        role: 'Admin',
        image_url: null
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      props.navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to log out');
    }
  };

  const navigateToSettings = () => {
    props.navigation.navigate('AdminSettings');
  };

  return (
    <View style={{ flex: 1, flexDirection: 'column', backgroundColor: colors.background }}>
      <DrawerContentScrollView {...props} showsVerticalScrollIndicator={false}>
        <View style={[styles.drawerHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.logoContainer}>
            {/* <Text style={styles.logoText}>HotelSakura</Text> */}
            <Image 
              source={require('../../assets/2logo.png')} 
              style={styles.logo} 
              resizeMode="contain"
            />
            
            
          </View>
          <View style={styles.userInfo}>
            {user?.image_url ? (
              <Image source={{ uri: user.image_url }} style={styles.userImage} />
            ) : (
              <View style={[styles.userImage, styles.userImagePlaceholder, { backgroundColor: colors.border }]}>
                <UserIcon size={20} color={colors.textMuted} />
              </View>
            )}
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'Loading...'}</Text>
              <Text style={[styles.userRole, { color: colors.textSecondary }]}>{user?.role || '...'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.menuGrid}>
          {filteredMenuItems.map((item) => {
            const isFocused = props.state.routes[props.state.index].name === item.name;
            const Icon = item.icon;
            
            return (
              <Pressable
                key={item.name}
                style={({ pressed }) => [
                  styles.menuItem,
                  { 
                    backgroundColor: isFocused ? colors.card : 'transparent',
                    borderColor: isFocused ? colors.primary : colors.border
                  },
                  pressed && { backgroundColor: colors.background }
                ]}
                android_ripple={{ color: colors.primary + '10', borderless: true }}
                onPress={() => {
                  if (item.name === 'AppInfo') {
                    setShowAppInfo(true);
                  } else {
                    props.navigation.navigate(item.name);
                  }
                }}
              >
                <Icon 
                  size={20} 
                  color={isFocused ? colors.primary : colors.textMuted} 
                  strokeWidth={isFocused ? 1.5 : 1}
                />
                <Text style={[
                  styles.menuItemText,
                  { color: isFocused ? colors.primary : colors.textSecondary },
                  isFocused && styles.menuItemTextActive
                ]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </DrawerContentScrollView>
      
      <View style={[styles.drawerFooter, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
        <View style={styles.footerGrid}>
          {isManager && (
            <TouchableOpacity style={styles.gridButton} onPress={navigateToSettings}>
              <Settings size={20} color={colors.textSecondary} />
              <Text style={[styles.gridButtonText, { color: colors.textSecondary }]}>Settings</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.gridButton} onPress={toggleTheme}>
            {theme === 'dark' ? (
              <Sun size={24} color={colors.warning} />
            ) : (
              <Moon size={24} color={colors.textSecondary} />
            )}
            <Text style={[styles.gridButtonText, { color: colors.textSecondary }]}>
              {theme === 'dark' ? 'Light' : 'Dark'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridButton} onPress={handleLogout}>
            <LogOut size={20} color={colors.error} />
            <Text style={[styles.gridButtonText, { color: colors.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <AppInfoPopup visible={showAppInfo} onClose={() => setShowAppInfo(false)} />
    </View>
  );
}

function PlaceholderScreen({ route }: { route: any }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{route.name}</Text>
      <Text>Coming Soon</Text>
    </View>
  );
}

const WHATSAPP_NUMBER = "9135893002"; // Replace with actual number

export default function AdminNavigator() {
  const [showAppInfo, setShowAppInfo] = useState(false);

  const openWhatsApp = () => {
    Linking.openURL(`whatsapp://send?phone=${WHATSAPP_NUMBER}`);
  };

  return (
    <View style={{ flex: 1 }}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={showAppInfo}
        onRequestClose={() => setShowAppInfo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowAppInfo(false)}
            >
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
            
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.modalLogo} 
              resizeMode="contain"
            />
            
            <Text style={styles.modalTitle}>HotelSakura</Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.developedBy}>Developed by</Text>
            <Text style={styles.developerName}>Angel Mehul Singh</Text>
            
            <View style={styles.techLogoContainer}>
               <Image 
                source={require('../../assets/br31logo.png')} 
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

    <Drawer.Navigator 
      drawerContent={(props) => <CustomDrawerContent {...props} showAppInfo={showAppInfo} setShowAppInfo={setShowAppInfo} />}
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({ 
        headerShown: true,
        headerTintColor: '#111827',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        drawerActiveTintColor: '#db2777',
        drawerInactiveTintColor: '#374151',
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, gap: 12 }}>
            <TouchableOpacity 
              onPress={() => DeviceEventEmitter.emit('refresh', route.name)}
              style={styles.headerButton}
            >
              <RefreshCw
                size={20}
                color="#374151"
                onPress={() => DeviceEventEmitter.emit('refresh', route.name)}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={openWhatsApp}
              style={[styles.supportButton, { marginRight: 0 }]}
            >
              <MessageCircle size={20} color="#25D366" />
              <Text style={styles.supportText}>Support</Text>
            </TouchableOpacity>
          </View>
        ),
      })}
    >
      <Drawer.Screen 
        name="Dashboard" 
        component={AdminDashboardScreen} 
        options={{
          drawerIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />
        }}
      />
      <Drawer.Screen 
        name="Rooms" 
        component={AdminRoomsScreen} 
        options={{
          drawerIcon: ({ color, size }) => <Bed size={size} color={color} />
        }}
      />
      <Drawer.Screen 
        name="Packages" 
        component={AdminPackagesScreen} 
        options={{
          drawerIcon: ({ color, size }) => <Package size={size} color={color} />
        }}
      />
      <Drawer.Screen 
        name="Services" 
        component={AdminServicesScreen} 
        options={{
          drawerIcon: ({ color, size }) => <ConciergeBell size={size} color={color} />
        }}
      />
      <Drawer.Screen 
        name="Offers" 
        component={AdminOffersScreen} 
        options={{
          drawerIcon: ({ color, size }) => <Tag size={size} color={color} />
        }}
      />
      <Drawer.Screen 
        name="Testimonial" 
        component={AdminTestimonialsScreen} 
        options={{
          drawerIcon: ({ color, size }) => <MessageSquare size={size} color={color} />
        }}
      />
      <Drawer.Screen 
        name="Hotel" 
        component={AdminHotelsScreen} 
        options={{
          drawerIcon: ({ color, size }) => <Building size={size} color={color} />
        }}
      />
      <Drawer.Screen 
        name="Enquiries" 
        component={AdminReservationsScreen} 
        options={{
          drawerIcon: ({ color, size }) => <HelpCircle size={size} color={color} />
        }}
      />
      <Drawer.Screen 
        name="Staff" 
        component={AdminStaffScreen} 
        options={{
          drawerIcon: ({ color, size }) => <Users size={size} color={color} />
        }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={AdminSettingsScreen} 
        options={{
          drawerItemStyle: { display: 'none' }
        }}
      />
    </Drawer.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 256,
    height: 100,
    padding: 12,
    
 
  },
  // logoText: {
  //   fontSize: 20,
  //   fontWeight: '800',
  //   color: '#db2777',
  //   marginBottom: 8,
  //   flexDirection: 'row',
  //   flexWrap: 'wrap',
  //   padding: 12,
  //   gap: 12,
  // },
  // flagContainer: {
  //   flexDirection: 'row',
  //   width: 30,
  //   height: 20,
  //   borderRadius: 2,
  //   overflow: 'hidden',
  //   borderWidth: 1,
  //   borderColor: '#e5e7eb',
  // },
  // flagBand: {
  //   flex: 1,
  //   height: '100%',
  // },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userImagePlaceholder: {
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  userRole: {
    fontSize: 14,
    color: '#6b7280',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  menuItem: {
    width: '46%', // Approx 2 columns
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: '#f3f4f6',
    // shadowColor: '#000',
    // shadowOffset: { width: 5, height: 2 },
    // shadowOpacity: 0.05,
    // shadowRadius: 4,
    // elevation: 2,
  },
  menuItemPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  menuItemActive: {
    borderColor: '#db2727ff',
    backgroundColor: '#fdf2f8',
    elevation: 4,
    shadowColor: '#db3327ff',
    shadowOpacity: 0.1,
  },
  menuItemText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
    textAlign: 'center',
  },
  menuItemTextActive: {
    color: '#bd105eff',
    fontWeight: '700',
  },
  headerButton: {
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  supportText: {
    marginLeft: 6,
    color: '#166534',
    fontWeight: '600',
    fontSize: 14,
  },
  drawerFooter: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#fff',
  },
  footerGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 5,
  },
  gridButton: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  // gridButtonActive: {
  //   backgroundColor: '#db2777',
  //   borderColor: '#db2777',
  // },
  gridButtonText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#374151',
    marginTop: 5,
  },
  gridButtonTextActive: {
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 10,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },
  appInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginBottom: 8,
    justifyContent: 'center',
  },
  appInfoText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.01)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  modalLogo: {
    width: 80,
    height: 80,
    marginBottom: 16,
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
    backgroundColor: '#fdf2f8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 24,
  },
  techLogo: {
    width: 24,
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
function setIsDarkMode(arg0: boolean) {
  throw new Error('Function not implemented.');
}

