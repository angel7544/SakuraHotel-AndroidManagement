import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { supabase } from '../lib/supabase';
import { Star, ChevronDown, ChevronUp, Sparkles, Footprints, Coffee } from 'lucide-react-native';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  message: string;
  rating: number;
  image_url: string | null;
}

const TestimonialCard = ({ item }: { item: Testimonial }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={toggleExpand}
      activeOpacity={0.9}
    >
      <View style={styles.header}>
        <View style={styles.userInfo}>
           <View style={styles.avatar}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{item.name ? item.name.charAt(0).toUpperCase() : '?'}</Text>
            )}
           </View>
           <View>
             <Text style={styles.name}>{item.name}</Text>
             {item.role && <Text style={styles.role}>{item.role}</Text>}
           </View>
        </View>
        
        <View style={styles.ratingWrapper}>
          <View style={styles.rating}>
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            <Star size={14} color="#fbbf24" fill="#fbbf24" />
          </View>
          {expanded ? <ChevronUp size={20} color="#9ca3af" /> : <ChevronDown size={20} color="#9ca3af" />}
        </View>
      </View>

      {/* Summary View */}
      {!expanded && (
        <View style={styles.collapsedPreview}>
           <Text style={styles.previewText} numberOfLines={2}>"{item.message}"</Text>
        </View>
      )}

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Detailed Ratings */}
          <View style={styles.ratingGrid}>
             <View style={styles.ratingItem}>
                <Text style={styles.ratingLabel}>Rooms</Text>
                <Text style={styles.ratingValue}>{item.rating}</Text>
             </View>
             <View style={styles.ratingItem}>
                <Text style={styles.ratingLabel}>Service</Text>
                <Text style={styles.ratingValue}>{(item.rating * 0.9).toFixed(1)}</Text>
             </View>
             <View style={styles.ratingItem}>
                <Text style={styles.ratingLabel}>Location</Text>
                <Text style={styles.ratingValue}>{(item.rating * 0.95).toFixed(1)}</Text>
             </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailSection}>
            <View style={styles.detailHeaderRow}>
               <Sparkles size={16} color="#db2777" />
               <Text style={styles.sectionHeader}>Hotel Highlights</Text>
            </View>
            <Text style={styles.detailText}>Quiet • Clean • Friendly Staff</Text>
          </View>

          <View style={styles.detailSection}>
            <View style={styles.detailHeaderRow}>
               <Footprints size={16} color="#3b82f6" />
               <Text style={styles.sectionHeader}>Walkability</Text>
            </View>
            <Text style={styles.detailText}>Near Gandhi Marg (5 min walk)</Text>
          </View>

          <View style={styles.detailSection}>
            <View style={styles.detailHeaderRow}>
               <Coffee size={16} color="#d97706" />
               <Text style={styles.sectionHeader}>Food & Drinks</Text>
            </View>
            <Text style={styles.detailText}>Fresh milk tea available. Veg & Non-veg options.</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionHeader}>Review</Text>
          <Text style={styles.fullMessage}>"{item.message}"</Text>

        </View>
      )}
    </TouchableOpacity>
  );
};

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

    const channel = supabase.channel('testimonials-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'testimonials' }, () => {
        fetchTestimonials();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (testimonials.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Loved by Guests</Text>
      <Text style={styles.subtitle}>See what our customers have to say.</Text>
      
      <View style={styles.list}>
        {testimonials.map((t) => (
          <TestimonialCard key={t.id} item={t} />
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
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  role: {
    fontSize: 12,
    color: '#6b7280',
  },
  ratingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#b45309',
  },
  collapsedPreview: {
    marginTop: 12,
  },
  previewText: {
    fontSize: 14,
    color: '#4b5563',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  expandedContent: {
    marginTop: 16,
  },
  ratingGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
  },
  ratingItem: {
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  detailSection: {
    marginBottom: 12,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  detailText: {
    fontSize: 14,
    color: '#4b5563',
    paddingLeft: 22, // Align with text start (icon width + gap)
  },
  fullMessage: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    fontStyle: 'italic',
  },
});
