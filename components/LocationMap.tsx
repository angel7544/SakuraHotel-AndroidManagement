import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, Animated, Easing } from 'react-native';
import { MapPin, ZoomIn } from 'lucide-react-native';

export default function LocationMap() {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const zoomAnim = useRef(new Animated.Value(1)).current;
  const hasAutoZoomed = useRef(false);

  // Auto-zoom effect when component scrolls into view
  const handleAutoZoom = useCallback(() => {
    if (hasAutoZoomed.current) return;
    hasAutoZoomed.current = true;

    // Simulate world map to hotel zoom: start wide, end tight
    Animated.sequence([
      // Start zoomed out (world view)
      Animated.timing(zoomAnim, {
        toValue: 0.7,
        duration: 0,
        useNativeDriver: true,
      }),
      // Animate zoom into hotel location
      Animated.timing(zoomAnim, {
        toValue: 1.4,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Settle to normal
      Animated.timing(zoomAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [zoomAnim]);

  useEffect(() => {
    // Gentle pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  // Trigger auto-zoom on mount (assumes user scrolled to this section)
  useEffect(() => {
    const timer = setTimeout(handleAutoZoom, 300); // small delay for visual entry
    return () => clearTimeout(timer);
  }, [handleAutoZoom]);

  const openMap = () => {
    // Opens Google Maps centered on the exact hotel location with higher zoom
    Linking.openURL('https://www.google.com/maps?q=Sakura+Hotel,+Gangtok,+Sikkim&z=20');
  };

  const zoomIntoLocation = () => {
    // Animate a quick zoom-in effect on the map image
    Animated.sequence([
      Animated.timing(zoomAnim, {
        toValue: 1.4,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(zoomAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Us on the Map</Text>
        <Text style={styles.subtitle}>Located in the heart of Gangtok, Sikkim</Text>
      </View>

      <TouchableOpacity style={styles.mapContainer} onPress={openMap} activeOpacity={0.9}>
        <Animated.View style={[styles.mapWrapper, { transform: [{ scale: zoomAnim }] }]}>
          {/* Static Map Image Placeholder - In a real app, use a static map API or a screenshot asset */}
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop' }} 
            style={styles.mapImage} 
          />
        </Animated.View>
        <View style={styles.overlay}>
           <Animated.View style={[styles.pinContainer, { transform: [{ scale: scaleAnim }] }]}>
             <View style={styles.pinPulse} />
             <MapPin size={40} color="#db2777" fill="#db2777" />
           </Animated.View>

           <View style={styles.ctaContainer}>
             <Text style={styles.hotelName}>Sakura Hotel</Text>
             <Text style={styles.tapText}>Tap to Open Maps</Text>
           </View>
        </View>
      </TouchableOpacity>

      {/* Zoom button to trigger zoom-in animation */}
      <TouchableOpacity style={styles.zoomButton} onPress={zoomIntoLocation} activeOpacity={0.8}>
        <ZoomIn size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 24,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  mapContainer: {
    height: 250,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f3f4f6',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  mapWrapper: {
    width: '100%',
    height: '100%',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  pinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pinPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(219, 39, 119, 0.3)',
    zIndex: -1,
  },
  ctaContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  hotelName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  tapText: {
    fontSize: 12,
    color: '#db2777',
    fontWeight: '600',
  },
  zoomButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#db2777',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
