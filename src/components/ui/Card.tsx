
import React from 'react';
import {
    TouchableOpacity,
    TouchableOpacityProps,
    View,
    ViewStyle
} from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing } from '../../constants/theme';

export interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
  margin?: 'none' | 'small' | 'medium' | 'large';
  borderRadius?: 'small' | 'medium' | 'large' | 'full';
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'medium',
  margin = 'none',
  borderRadius = 'medium',
  onPress,
  style,
  disabled = false,
  ...touchableProps
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: Colors.backgroundCard,
      overflow: 'hidden',
    };


    const paddingStyles = {
      none: {},
      small: { padding: Spacing.sm },
      medium: { padding: Spacing.md },
      large: { padding: Spacing.lg },
    };


    const marginStyles = {
      none: {},
      small: { margin: Spacing.sm },
      medium: { margin: Spacing.md },
      large: { margin: Spacing.lg },
    };


    const radiusStyles = {
      small: { borderRadius: BorderRadius.sm },
      medium: { borderRadius: BorderRadius.md },
      large: { borderRadius: BorderRadius.lg },
      full: { borderRadius: BorderRadius.full },
    };


    const variantStyles = {
      default: {
        borderWidth: 1,
        borderColor: Colors.border,
      },
      elevated: {
        ...Shadows.md,
      },
      outlined: {
        borderWidth: 1,
        borderColor: Colors.border,
      },
    };

    return {
      ...baseStyle,
      ...paddingStyles[padding],
      ...marginStyles[margin],
      ...radiusStyles[borderRadius],
      ...variantStyles[variant],
      opacity: disabled ? 0.6 : 1,
      ...style,
    };
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={getCardStyle()}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        {...touchableProps}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={getCardStyle()}>{children}</View>;
};