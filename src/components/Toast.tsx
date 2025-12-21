import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  type?: ToastType;
}

export default function Toast({ message, visible, onHide, type = 'success' }: ToastProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();

      // Auto hide after 2 seconds (3 seconds for success messages)
      const hideDelay = type === 'success' ? 3000 : 2000;
      const timer = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onHide();
        });
      }, hideDelay);

      return () => clearTimeout(timer);
    } else {
      slideAnim.setValue(-100);
    }
  }, [visible, slideAnim, onHide, type]);

  if (!visible) return null;

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return styles.successToast;
      case 'error':
        return styles.errorToast;
      case 'info':
        return styles.infoToast;
      default:
        return styles.successToast;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'info':
        return 'ℹ';
      default:
        return '✓';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.toast, getToastStyle()]}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{getIcon()}</Text>
        </View>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80, // Above the bottom navigation (adjust based on your nav height)
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: '90%',
    minWidth: 200,
  },
  successToast: {
    backgroundColor: '#10b981',
  },
  errorToast: {
    backgroundColor: '#ef4444',
  },
  infoToast: {
    backgroundColor: '#3b82f6',
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  message: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
});

