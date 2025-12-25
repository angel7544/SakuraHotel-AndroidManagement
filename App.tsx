import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DefaultTheme, NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Bed, Package, Grid, Phone, User, MoreHorizontal, NewspaperIcon, ChartCandlestickIcon, Bell, BellDot } from 'lucide-react-native';

import HomeScreen from './screens/HomeScreen';
import RoomsScreen from './screens/RoomsScreen';
import PackagesScreen from './screens/PackagesScreen';
import CatalogScreen from './screens/CatalogScreen';
import ContactScreen from './screens/ContactScreen';
import LoginScreen from './screens/LoginScreen';
import MoreScreen from './screens/MoreScreen';

import AdminNavigator from './screens/admin/AdminNavigator';
import AdminReservationsScreen from './screens/admin/AdminReservationsScreen';
import AdminRoomsScreen from './screens/admin/AdminRoomsScreen';
import AdminPackagesScreen from './screens/admin/AdminPackagesScreen';
import AdminServicesScreen from './screens/admin/AdminServicesScreen';
import AdminHotelsScreen from './screens/admin/AdminHotelsScreen';
import AdminStaffScreen from './screens/admin/AdminStaffScreen';
import AdminSettingsScreen from './screens/admin/AdminSettingsScreen';
import AdminHotelFormScreen from './screens/admin/AdminHotelFormScreen';
import AdminRoomFormScreen from './screens/admin/AdminRoomFormScreen';
import AdminPackageFormScreen from './screens/admin/AdminPackageFormScreen';
import AdminServiceFormScreen from './screens/admin/AdminServiceFormScreen';
import AdminReservationFormScreen from './screens/admin/AdminReservationFormScreen';
import AdminStaffFormScreen from './screens/admin/AdminStaffFormScreen';

import OffersPopup from './components/OffersPopup';
import AdminOffersScreen from './screens/admin/AdminOffersScreen';
import AdminTestimonialsScreen from './screens/admin/AdminTestimonialsScreen';
import AdminOfferFormScreen from './screens/admin/AdminOfferFormScreen';
import AdminTestimonialFormScreen from './screens/admin/AdminTestimonialFormScreen';
import { ImageBackground } from 'react-native';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import AdminBlogPostScreen from './screens/admin/AdminBlogPostScreen';
import AdminBlogPostFormScreen from './screens/admin/AdminBlogPostFormScreen';
import BlogScreen from './screens/BlogScreen';
import BlogArticleScreen from './screens/BlogArticleScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export const navigationRef = createNavigationContainerRef();

function MainTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          paddingBottom: 5,
        }
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Rooms" 
        component={RoomsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Bed color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Packages" 
        component={PackagesScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Catalog" 
        component={CatalogScreen} 
        options={{
          title: 'Services',
          tabBarIcon: ({ color, size }) => <BellDot color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Blogs" 
        component={BlogScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <NewspaperIcon color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="More" 
        component={MoreScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <MoreHorizontal color={color} size={size} />
        }}
      />
    </Tab.Navigator>
    
  );
}

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
  },
};

function AppContent() {
  return (
    <ImageBackground 
      source={require('./assets/backgroundlg.jpg')} 
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef} theme={MyTheme}>
        <Stack.Navigator 
          initialRouteName="Main" 
          screenOptions={{ 
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' }
          }}
        >
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="AdminDashboard" component={AdminNavigator} />
          <Stack.Screen name="AdminReservations" component={AdminReservationsScreen} />
          <Stack.Screen name="AdminRooms" component={AdminRoomsScreen} />
          <Stack.Screen name="AdminPackages" component={AdminPackagesScreen} />
          <Stack.Screen name="AdminServices" component={AdminServicesScreen} />
          <Stack.Screen name="AdminHotels" component={AdminHotelsScreen} />
          <Stack.Screen name="AdminStaff" component={AdminStaffScreen} />
          <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
          <Stack.Screen name="AdminOffers" component={AdminOffersScreen} />
          <Stack.Screen name="AdminTestimonials" component={AdminTestimonialsScreen} />
          <Stack.Screen name="AdminBlogPost" component={AdminBlogPostScreen} />
          
          <Stack.Screen name="AdminHotelForm" component={AdminHotelFormScreen} />
          <Stack.Screen name="AdminRoomForm" component={AdminRoomFormScreen} />
          <Stack.Screen name="AdminPackageForm" component={AdminPackageFormScreen} />
          <Stack.Screen name="AdminServiceForm" component={AdminServiceFormScreen} />
          <Stack.Screen name="AdminReservationForm" component={AdminReservationFormScreen} />
          <Stack.Screen name="AdminStaffForm" component={AdminStaffFormScreen} />
          <Stack.Screen name="AdminOfferForm" component={AdminOfferFormScreen} />
          <Stack.Screen name="AdminTestimonialForm" component={AdminTestimonialFormScreen} />
          <Stack.Screen name="AdminBlogPostForm" component={AdminBlogPostFormScreen} />

          <Stack.Screen name="Contact" component={ContactScreen} />
          {/* Add other detail screens here if needed, e.g. RoomDetails */}
          <Stack.Screen name="BlogArticle" component={BlogArticleScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <OffersPopup />
      <StatusBar style="auto" />
      </SafeAreaProvider>
    </ImageBackground>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

import { StyleSheet } from 'react-native';
const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
