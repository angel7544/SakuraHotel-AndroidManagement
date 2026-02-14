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
const GRID_COLUMNS = 3;
const GRID_H_PADDING = 16;
const GRID_GAP = 10;
const gridItemWidth = Math.floor((width - GRID_H_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS);

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
    { name: "Home", screen: "Main", icon: LayoutDashboard, color: "#111827" },
    { name: "Bookings", screen: "Enquiries", icon: CalendarCheck, color: "#3b82f6" },
    { name: "Rooms", screen: "Rooms", icon: BedDouble, color: "#8b5cf6" },
    { name: "Packages", screen: "Packages", icon: Package, color: "#ec4899" },
    { name: "Services", screen: "Services", icon: ConciergeBell, color: "#f59e0b" },
    { name: "Blogs", screen: "Blog", icon: NewspaperIcon, color: "#007bff" },
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
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Welcome back, Admin</Text>
        <Text style={styles.welcomeSubtitle}>Here's what's happening today</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.statCardBlue]}>
          <View style={styles.statIconContainer}>
            <Calendar size={20} color="#3b82f6" />
          </View>
          <View>
            <Text style={styles.statValue}>{stats.activeBookings}</Text>
            <Text style={styles.statLabel}>Active Bookings</Text>
          </View>
        </View>
        <View style={[styles.statCard, styles.statCardPurple]}>
          <View style={styles.statIconContainer}>
            <Bed size={20} color="#8b5cf6" />
          </View>
          <View>
            <Text style={styles.statValue}>{stats.occupancy}%</Text>
            <Text style={styles.statLabel}>Occupancy</Text>
          </View>
        </View>
        <View style={[styles.statCard, styles.statCardPink]}>
          <View style={styles.statIconContainer}>
            <Users size={20} color="#ec4899" />
          </View>
          <View>
            <Text style={styles.statValue}>{stats.newCustomers}</Text>
            <Text style={styles.statLabel}>New Customers</Text>
          </View>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.menuGrid}>
          {filteredMenu.map((item, index) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, { width: gridItemWidth }]}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                  <Icon size={24} color={item.color} />
                </View>
                <Text style={styles.menuText} numberOfLines={1}>{item.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Recent Bookings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Enquiries')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bookingsList}>
          {recentBookings.map((booking, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.bookingItem, index === recentBookings.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => navigation.navigate('Enquiries')} // Or specific detail screen
            >
              <View style={styles.bookingLeft}>
                <View style={styles.bookingAvatar}>
                  <Text style={styles.bookingAvatarText}>
                    {booking.customer_name?.charAt(0).toUpperCase() || 'G'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.bookingName}>{booking.customer_name}</Text>
                  <Text style={styles.bookingDate}>{new Date(booking.check_in).toLocaleDateString()}</Text>
                </View>
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
            </TouchableOpacity>
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
  welcomeSection: {
    padding: 24,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'space-between',
    minHeight: 100,
  },
  statCardBlue: { borderTopWidth: 4, borderTopColor: '#3b82f6' },
  statCardPurple: { borderTopWidth: 4, borderTopColor: '#8b5cf6' },
  statCardPink: { borderTopWidth: 4, borderTopColor: '#ec4899' },
  statIconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  menuContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    height: 100,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  menuText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  section: {
    padding: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#db2777',
  },
  bookingsList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  bookingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bookingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
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
