import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, DeviceEventEmitter, Platform, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react-native';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastData {
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
  image?: string;
}

const TOAST_EVENT = 'SHOW_TOAST';

export const showToast = (data: ToastData) => {
  DeviceEventEmitter.emit(TOAST_EVENT, data);
};

export default function ToastNotification() {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<ToastData>({ title: '', type: 'info' });
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(TOAST_EVENT, (toastData: ToastData) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      setData(toastData);
      setVisible(true);

      // Animate In
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide
      const duration = toastData.duration || 4000;
      timerRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    });

    return () => {
      subscription.remove();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  };

  if (!visible) return null;

  const getBackgroundColor = () => {
    switch (data.type) {
      case 'success': return '#10B981'; // Emerald 500
      case 'error': return '#EF4444'; // Red 500
      case 'warning': return '#F59E0B'; // Amber 500
      case 'info': default: return '#3B82F6'; // Blue 500
    }
  };

  const getIcon = (color: string) => {
    switch (data.type) {
      case 'success': return <CheckCircle color={color} size={24} />;
      case 'error': return <AlertCircle color={color} size={24} />;
      case 'warning': return <AlertTriangle color={color} size={24} />;
      case 'info': default: return <Info color={color} size={24} />;
    }
  };

  const accentColor = getBackgroundColor();

  return (
    <View style={styles.container} pointerEvents="box-none">
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Animated.View 
          style={[
            styles.toast, 
            { 
              transform: [{ translateY }],
              opacity
            }
          ]}
        >
          <View style={[styles.accentBorder, { backgroundColor: accentColor }]} />
          
          <View style={styles.contentWrapper}>
            <View style={styles.headerRow}>
              <View style={styles.iconContainer}>
                 {getIcon(accentColor)}
              </View>
              
              <View style={styles.textContainer}>
                <Text style={styles.title}>{data.title}</Text>
                {data.message ? <Text style={styles.message}>{data.message}</Text> : null}
              </View>

               <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
                <X color="#9CA3AF" size={18} />
              </TouchableOpacity>
            </View>

            {data.image && (
              <View style={styles.imageContainer}>
                <Image source={{ uri: data.image }} style={styles.toastImage} resizeMode="cover" />
              </View>
            )}
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
  },
  safeArea: {
    width: '100%',
    alignItems: 'center',
  },
  toast: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    marginTop: Platform.OS === 'android' ? 10 : 0,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accentBorder: {
    width: 6,
    height: '100%',
  },
  contentWrapper: {
    flex: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 2,
  },
  message: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
    marginTop: -4,
    marginRight: -4,
  },
  imageContainer: {
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    width: '100%',
    height: 150,
  },
  toastImage: {
    width: '100%',
    height: '100%',
  },
});
