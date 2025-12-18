import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { Banner } from '../lib/types';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../navigation/AppNavigator';

interface BannerCarouselProps {
  banners: Banner[];
}

const { width } = Dimensions.get('window');
const BANNER_HEIGHT = 300;

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function BannerCarousel({ banners }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigation = useNavigation<NavigationProp>();
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  // Auto-scroll the ScrollView when currentIndex changes
  useEffect(() => {
    if (banners.length <= 1 || !scrollViewRef.current) return;
    
    scrollViewRef.current.scrollTo({
      x: currentIndex * width,
      animated: true,
    });
  }, [currentIndex, banners.length, width]);

  if (!banners || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  const getTextAlign = () => {
    const align = currentBanner.textAlign || 'center';
    switch (align) {
      case 'left':
        return 'flex-start';
      case 'right':
        return 'flex-end';
      default:
        return 'center';
    }
  };

  const getVerticalAlign = () => {
    const v = currentBanner.textVertical || 'middle';
    switch (v) {
      case 'top':
        return 'flex-start';
      case 'bottom':
        return 'flex-end';
      default:
        return 'center';
    }
  };

  const getTitleSize = () => {
    const size = currentBanner.titleSize || 'lg';
    switch (size) {
      case 'sm':
        return 24;
      case 'md':
        return 28;
      default:
        return 32;
    }
  };

  const getSubtitleSize = () => {
    const size = currentBanner.subtitleSize || 'md';
    switch (size) {
      case 'sm':
        return 14;
      case 'lg':
        return 18;
      default:
        return 16;
    }
  };

  const handleCTAPress = async () => {
    if (!currentBanner.ctaLink) return;

    const link = currentBanner.ctaLink.trim();
    
    // Handle external URLs (http:// or https://)
    if (link.startsWith('http://') || link.startsWith('https://')) {
      try {
        const canOpen = await Linking.canOpenURL(link);
        if (canOpen) {
          await Linking.openURL(link);
        } else {
          Alert.alert('Error', 'Cannot open this URL');
        }
      } catch (error) {
        console.error('Error opening URL:', error);
        Alert.alert('Error', 'Failed to open link');
      }
      return;
    }

    // Handle internal navigation
    try {
      // Parse category from query string (e.g., /?category=Electronics)
      if (link.startsWith('/?category=')) {
        const categoryMatch = link.match(/category=([^&]+)/);
        const category = categoryMatch ? decodeURIComponent(categoryMatch[1]) : 'All';
        // Navigate to Home tab with category param
        navigation.navigate('Home', { category });
        return;
      }

      // Handle product links (e.g., /product/slug)
      if (link.startsWith('/product/')) {
        const slug = link.replace('/product/', '').split('?')[0]; // Remove query params if any
        // Navigate to ProductDetail screen (in stack navigator)
        // Try direct navigation first, fallback to getParent if needed
        try {
          const parent = navigation.getParent();
          if (parent) {
            (parent as any).navigate('ProductDetail', { slug });
          } else {
            // Fallback: try direct navigation (might work in some cases)
            (navigation as any).navigate('ProductDetail', { slug });
          }
        } catch (error) {
          console.error('Navigation error:', error);
          Alert.alert('Error', 'Failed to navigate to product');
        }
        return;
      }

      // Handle cart page
      if (link === '/cart' || link.startsWith('/cart')) {
        navigation.navigate('Cart');
        return;
      }

      // Handle home page
      if (link === '/' || link === '') {
        navigation.navigate('Home');
        return;
      }

      // Handle other internal routes - try to navigate
      if (link.startsWith('/')) {
        // For unknown routes, try to open as URL or show alert
        console.warn('Unknown internal route:', link);
        Alert.alert('Navigation', `Route "${link}" is not yet implemented`);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Failed to navigate');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEnabled={banners.length > 1}
        decelerationRate="fast"
        snapToInterval={width}
        snapToAlignment="start"
      >
        {banners.map((banner, index) => (
          <View key={banner._id || banner.id || index} style={styles.bannerContainer}>
            <Image source={{ uri: banner.image }} style={styles.image} resizeMode="cover" />
            <View style={styles.overlay} />
            <View
              style={[
                styles.content,
                {
                  alignItems: getTextAlign(),
                  justifyContent: getVerticalAlign(),
                },
              ]}
            >
              <View style={styles.textContainer}>
                <Text
                  style={[
                    styles.title,
                    {
                      fontSize: getTitleSize(),
                      color: banner.titleColor || '#ffffff',
                      fontWeight: banner.titleBold === false ? 'normal' : '700',
                      fontStyle: banner.titleItalic ? 'italic' : 'normal',
                    },
                  ]}
                >
                  {banner.title}
                </Text>
                {banner.subtitle && (
                  <Text
                    style={[
                      styles.subtitle,
                      {
                        fontSize: getSubtitleSize(),
                        color: banner.subtitleColor || '#e5e7eb',
                        fontWeight: banner.subtitleBold ? '600' : '400',
                        fontStyle: banner.subtitleItalic ? 'italic' : 'normal',
                      },
                    ]}
                  >
                    {banner.subtitle}
                  </Text>
                )}
                {banner.ctaLabel && (
                  <TouchableOpacity
                    style={[
                      styles.ctaButton,
                      {
                        backgroundColor: banner.buttonBgColor || '#dc2626',
                        alignSelf: getTextAlign() === 'center' ? 'center' : getTextAlign() === 'right' ? 'flex-end' : 'flex-start',
                      },
                    ]}
                    onPress={handleCTAPress}
                  >
                    <Text
                      style={[
                        styles.ctaText,
                        { color: banner.buttonTextColor || '#ffffff' },
                      ]}
                    >
                      {banner.ctaLabel}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {banners.length > 1 && (
        <View style={styles.indicators}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentIndex && styles.indicatorActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: BANNER_HEIGHT,
    position: 'relative',
  },
  bannerContainer: {
    width,
    height: BANNER_HEIGHT,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    position: 'absolute',
    inset: 0,
    padding: 16,
  },
  textContainer: {
    maxWidth: '90%',
  },
  title: {
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  subtitle: {
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  ctaButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
  },
  indicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    backgroundColor: '#ffffff',
  },
});
