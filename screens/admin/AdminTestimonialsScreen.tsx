import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Image
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, MessageSquare, Star, User } from 'lucide-react-native';

import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

export default function AdminTestimonialsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setTestimonials(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTestimonials();
    }, [fetchTestimonials])
  );

  useEffect(() => {
    const channel = supabase.channel('admin-testimonials')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'testimonials' }, fetchTestimonials)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTestimonials]);

  const toggleStatus = async (item: any) => {
    const newStatus = item.status === 'Active' ? 'Inactive' : 'Active';
    const { error } = await supabase.from('testimonials').update({ status: newStatus }).eq('id', item.id);
    if (error) Alert.alert('Error', error.message);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Testimonial',
      'Are you sure you want to delete this testimonial?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            const { error } = await supabase.from('testimonials').delete().eq('id', id);
            if (error) Alert.alert('Error', error.message);
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
            {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.avatar} />
            ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
                    <User size={20} color={colors.textMuted} />
                </View>
            )}
            <View style={{flex: 1}}>
                <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                {item.role ? <Text style={[styles.role, { color: colors.textSecondary }]}>{item.role}</Text> : null}
            </View>
        </View>
        <TouchableOpacity 
          style={[
            styles.statusBadge, 
            { backgroundColor: item.status === 'Active' ? '#dcfce7' : '#fee2e2' }
          ]}
          onPress={() => toggleStatus(item)}
        >
          <Text style={[
            styles.statusText,
            { color: item.status === 'Active' ? '#166534' : '#991b1b' }
          ]}>
            {item.status}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.ratingRow}>
            {[...Array(5)].map((_, i) => (
                <Star 
                    key={i} 
                    size={16} 
                    color={i < item.rating ? "#eab308" : colors.border} 
                    fill={i < item.rating ? "#eab308" : "transparent"} 
                />
            ))}
            <Text style={[styles.ratingText, { color: colors.textSecondary }]}>({item.rating})</Text>
        </View>

        <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={3}>"{item.message}"</Text>
        
        <View style={styles.actions}>
            <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('AdminTestimonialForm', { id: item.id })}>
                <Edit2 size={16} color={colors.textSecondary} />
                <Text style={[styles.actionText, { color: colors.textSecondary }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                <Trash2 size={16} color={colors.error} />
                <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
            </TouchableOpacity>
        </View>
      </View>
    </View>
    );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topActions, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Testimonials</Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AdminTestimonialForm')}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={testimonials}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No testimonials found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: { fontSize: 24, fontWeight: 'bold' },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16 },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  name: {
    fontWeight: '700',
    fontSize: 16,
  },
  role: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    gap: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
  },
  message: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
  },
});
