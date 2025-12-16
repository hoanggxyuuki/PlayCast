
import React from 'react';
import {
    ActivityIndicator,
    Text,
    TextStyle,
    View,
    ViewStyle
} from 'react-native';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  overlay?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = Colors.primary,
  text,
  overlay = false,
  style,
  textStyle,
}) => {
  const getIndicatorSize = () => {
    switch (size) {
      case 'small':
        return 'small';
      case 'large':
        return 'large';
      default:
        return undefined;
    }
  };

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
    };

    if (overlay) {
      return {
        ...baseStyle,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(10, 10, 15, 0.8)',
        zIndex: 9999,
      };
    }

    const sizeStyles = {
      small: {
        padding: Spacing.sm,
      },
      medium: {
        padding: Spacing.md,
      },
      large: {
        padding: Spacing.lg,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    return {
      marginTop: Spacing.md,
      fontSize: FontSizes.md,
      color: Colors.text,
      fontWeight: '600',
      ...textStyle,
    };
  };

  return (
    <View style={getContainerStyle()}>
      <ActivityIndicator size={getIndicatorSize()} color={color} />
      {text && <Text style={getTextStyle()}>{text}</Text>}
    </View>
  );
};