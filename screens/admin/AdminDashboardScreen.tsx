import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, DeviceEventEmitter, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { getUserRoles } from '../../lib/auth';
import { 
  LayoutDashboard, 
  Building2, 
  BedDouble, 
  CalendarCheck, 
  Users2, 
  Receipt, 
  Settings, 
  Package,
  ConciergeBell,
  MessageSquareQuote,
  Calendar,
  Bed,
  Users,
  Menu,
  Smartphone,
  NewspaperIcon
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState({
    activeBookings: 0,
    occupancy: 0,
    newCustomers: 0
  });
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);

  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      // Active Bookings
      const { count: activeBookings } = await supabase
        .from('reservations')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'Confirmed');

      // Occupancy
      const { count: totalRooms } = await supabase
        .from('rooms')
        .select('id', { count: 'exact', head: true });
      const { count: occupiedRooms } = await supabase
        .from('rooms')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'Occupied');
      
      const occupancy = totalRooms && totalRooms > 0 ? Math.round(((occupiedRooms || 0) / totalRooms) * 100) : 0;

      // New Customers (Last 30 days)
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data: recentRes } = await supabase
        .from('reservations')
        .select('customer_email, customer_name')
        .gte('created_at', since.toISOString());
      
      const distinctEmails = new Set((recentRes || []).map((r: any) => r.customer_email || r.customer_name));

      // Recent Bookings List
      const { data: bookings } = await supabase
        .from('reservations')
        .select('id, customer_name, status, check_in, total_amount')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (bookings) setRecentBookings(bookings);

      setStats({
        activeBookings: activeBookings || 0,
        occupancy,
        newCustomers: distinctEmails.size
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
    getUserRoles().then(setRoles);
    
    const channel = supabase.channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetchStats)
      .subscribe();

    const refreshSub = DeviceEventEmitter.addListener('refresh', (screenName) => {
      if (screenName === 'Dashboard') {
        fetchStats();
      }
    });

    return () => {
      supabase.removeChannel(channel);
      refreshSub.remove();
    };
  }, [fetchStats]);

  const menuItems = [
    { name: "Bookings", screen: "Enquiries", icon: CalendarCheck, color: "#3b82f6" },
    { name: "Rooms", screen: "Rooms", icon: BedDouble, color: "#8b5cf6" },
    { name: "Packages", screen: "Packages", icon: Package, color: "#ec4899" },
    { name: "Services", screen: "Services", icon: ConciergeBell, color: "#f59e0b" },
    { name: "Blogs", screen: "Blogs", icon: NewspaperIcon, color: "#007bff" },
    // Restricted Items
    { name: "Hotels", screen: "Hotel", icon: Building2, color: "#fac60cff", restricted: true },
    { name: "Staff", screen: "Staff", icon: Users2, color: "#07dc52ff", restricted: true },
    { name: "Settings", screen: "Settings", icon: Settings, color: "#ff0000ff", restricted: true },
  ];

  const filteredMenu = menuItems.filter(item => {
    if (roles.includes('owner')) return true;
    if (item.restricted) return false;
    return true;
  });

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#db2777']} />
      }
    >
      <View style={styles.header}>
        <View>
            {/* <Text style={styles.headerTitle}>Admin Dashboard</Text> */}
            <Text style={styles.headerTitle}>Overview & Quick Actions</Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#eff6ff' }]}>
          <Calendar size={24} color="#3b82f6" style={styles.statIcon} />
          <Text style={styles.statValue}>{stats.activeBookings}</Text>
          <Text style={styles.statLabel}>Active Bookings</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#f5f3ff' }]}>
          <Bed size={24} color="#8b5cf6" style={styles.statIcon} />
          <Text style={styles.statValue}>{stats.occupancy}%</Text>
          <Text style={styles.statLabel}>Occupancy</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fdf2f8' }]}>
          <Users size={24} color="#ec4899" style={styles.statIcon} />
          <Text style={styles.statValue}>{stats.newCustomers}</Text>
          <Text style={styles.statLabel}>New Customers</Text>
        </View>
      </View>

      {/* Menu Scroll */}
      <View style={styles.menuContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          persistentScrollbar={false}
          contentContainerStyle={styles.menuScrollContent}
        >
          {filteredMenu.map((item, index) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity 
                key={index} 
                style={styles.menuItem}
                onPress={() => navigation.navigate(item.screen)}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                  <Icon size={28} color={item.color} />
                </View>
                <Text style={styles.menuText}>{item.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Recent Bookings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Bookings</Text>
        <View style={styles.bookingsList}>
          {recentBookings.map((booking, index) => (
            <View key={index} style={styles.bookingItem}>
              <View>
                <Text style={styles.bookingName}>{booking.customer_name}</Text>
                <Text style={styles.bookingDate}>{new Date(booking.check_in).toLocaleDateString()}</Text>
              </View>
              <View style={styles.bookingRight}>
                <Text style={styles.bookingAmount}>₹{booking.total_amount}</Text>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: booking.status === 'Confirmed' ? '#dcfce7' : '#f3f4f6' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: booking.status === 'Confirmed' ? '#166534' : '#4b5563' }
                  ]}>{booking.status}</Text>
                </View>
              </View>
            </View>
          ))}
          {recentBookings.length === 0 && (
             <Text style={styles.emptyText}>No recent bookings</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    justifyContent: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  menuContainer: {
    paddingVertical: 12,
  },
  menuScrollContent: {
    paddingHorizontal: 12,
    gap: 10,
  },
  menuItem: {
    width: 96,
    height: 96,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    columnGap: 50,
    width: 48,
    height: 48,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  bookingsList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  bookingName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  bookingDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  bookingRight: {
    alignItems: 'flex-end',
  },
  bookingAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    padding: 16,
  },
});
