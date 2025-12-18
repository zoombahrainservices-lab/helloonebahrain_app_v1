import { Platform, ViewStyle } from 'react-native';

/**
 * Creates shadow styles that work on both native and web
 * On web, uses boxShadow; on native, uses shadow properties
 */
export const createShadowStyle = (
  shadowColor: string = '#000',
  shadowOffset: { width: number; height: number } = { width: 0, height: 2 },
  shadowOpacity: number = 0.1,
  shadowRadius: number = 4,
  elevation: number = 3
): ViewStyle => {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px rgba(0, 0, 0, ${shadowOpacity})`,
    } as any;
  }
  
  return {
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
    elevation,
  };
};
