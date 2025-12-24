import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Image, TouchableOpacity, Animated, Dimensions, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { X, Copy, Phone, Check } from 'lucide-react-native';
import { navigationRef } from '../App';
import * as Clipboard from 'expo-clipboard';

const { width } = Dimensions.get('window');

type Offer = {
  id: string;
  title: string;
  description: string;
  discount_code: string;
  discount_value: string;
  image_url?: string;
  is_active: boolean;
  expires_at?: string;
};

export default function OffersPopup() {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15); // Fake countdown like web
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchActiveOffer();

    const channel = supabase
      .channel('offers-popup')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, fetchActiveOffer)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 15,
      }).start();

      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      return () => clearInterval(timer);
    } else {
      scaleAnim.setValue(0);
    }
  }, [isVisible]);

  const fetchActiveOffer = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setOffer(data);
        // Logic to show popup (could add frequency capping here)
        // For now, show if we found an offer
        // Add a small delay so it doesn't pop immediately on app load every time
        setTimeout(() => setIsVisible(true), 2000);
      } else {
        setIsVisible(false);
      }
    } catch (err) {
      console.log('No active offers');
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleCopyCode = async () => {
    if (offer?.discount_code) {
      await Clipboard.setStringAsync(offer.discount_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBook = () => {
    setIsVisible(false);
    if (navigationRef.isReady()) {
      (navigationRef as any).navigate('Contact', {
        interest: offer?.title ?? 'Special Offer', 
        type: 'Offer',
        details: `I want to claim offer: ${offer?.title}\nCode: ${offer?.discount_code ?? ''}`
      } as never);
    }
  };

  if (!offer || !isVisible) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.backdrop} />
      <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <X size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.imageContainer}>
          {offer.image_url ? (
            <Image source={{ uri: offer.image_url }} style={styles.image} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderTitle}>{offer.title}</Text>
            </View>
          )}
          <View style={styles.imageOverlay}>
            <View style={styles.badgeContainer}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Limited Time</Text>
              </View>
              <View style={[styles.badge, styles.timerBadge]}>
                <Text style={styles.badgeText}>Expires in {timeLeft}s</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{offer.title}</Text>
          <Text style={styles.description}>{offer.description}</Text>

          <View style={styles.dealContainer}>
            <Text style={styles.dealLabel}>Your Exclusive Deal</Text>
            <Text style={styles.dealValue}>{offer.discount_value}</Text>
          </View>

          {offer.discount_code && (
            <TouchableOpacity style={styles.codeButton} onPress={handleCopyCode}>
              <Text style={styles.codeLabel}>Code: </Text>
              <Text style={styles.codeText}>{offer.discount_code}</Text>
              {copied ? <Check size={16} color="#059669" /> : <Copy size={16} color="#4b5563" />}
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.ctaButton} onPress={handleBook}>
            <Phone size={18} color="#fff" />
            <Text style={styles.ctaText}>Claim Offer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleClose} style={styles.dismissButton}>
            <Text style={styles.dismissText}>No thanks, I'll pay full price</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.51,
    shadowRadius: 13.16,
    elevation: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },
  imageContainer: {
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#db2777',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: '#db2777',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timerBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  dealContainer: {
    backgroundColor: '#fdf2f8',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fce7f3',
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  dealLabel: {
    fontSize: 12,
    color: '#db2777',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dealValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  codeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  codeLabel: {
    color: '#6b7280',
    fontSize: 14,
  },
  codeText: {
    color: '#111827',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  ctaButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    gap: 8,
    marginBottom: 12,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  dismissButton: {
    padding: 4,
  },
  dismissText: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'underline',
  },
});
