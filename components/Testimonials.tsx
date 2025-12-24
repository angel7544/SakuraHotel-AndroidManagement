import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { supabase } from '../lib/supabase';
import { Star } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  message: string;
  rating: number;
  image_url: string | null;
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      const { data } = await supabase
        .from('testimonials')
        .select('*')
        .eq('status', 'Active')
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (data) setTestimonials(data);
    };
    fetchTestimonials();
  }, []);

  if (testimonials.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Loved by Guests</Text>
      <Text style={styles.subtitle}>See what our customers have to say.</Text>
      
      <View style={styles.list}>
        {testimonials.map((t) => (
          <View key={t.id} style={styles.card}>
            <View style={styles.rating}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  color={i < t.rating ? '#3b82f6' : '#e5e7eb'}
                  fill={i < t.rating ? '#3b82f6' : 'transparent'}
                />
              ))}
            </View>
            <Text style={styles.message}>"{t.message}"</Text>
            <View style={styles.footer}>
              <View style={styles.avatar}>
                {t.image_url ? (
                  <Image source={{ uri: t.image_url }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{t.name.charAt(0)}</Text>
                )}
              </View>
              <View>
                <Text style={styles.name}>{t.name}</Text>
                {t.role && <Text style={styles.role}>{t.role}</Text>}
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f9fafb',
    marginTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  list: {
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rating: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 2,
  },
  message: {
    fontSize: 14,
    color: '#4b5563',
    fontStyle: 'italic',
    marginBottom: 16,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 16,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  role: {
    fontSize: 12,
    color: '#6b7280',
  },
});
