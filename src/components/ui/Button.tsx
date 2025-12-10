
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../constants/theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };


    const sizeStyles = {
      small: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        minHeight: 36,
      },
      medium: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        minHeight: 44,
      },
      large: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.lg,
        minHeight: 52,
      },
    };


    const variantStyles = {
      primary: {
        backgroundColor: disabled ? Colors.textTertiary : Colors.primary,
      },
      secondary: {
        backgroundColor: disabled ? Colors.textTertiary : Colors.secondary,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: disabled ? Colors.textTertiary : Colors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      opacity: disabled ? 0.6 : 1,
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '600',
    };

    const sizeStyles = {
      small: {
        fontSize: FontSizes.sm,
      },
      medium: {
        fontSize: FontSizes.md,
      },
      large: {
        fontSize: FontSizes.lg,
      },
    };

    const variantStyles = {
      primary: {
        color: Colors.text,
      },
      secondary: {
        color: Colors.text,
      },
      outline: {
        color: disabled ? Colors.textTertiary : Colors.primary,
      },
      ghost: {
        color: disabled ? Colors.textTertiary : Colors.primary,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...textStyle,
    };
  };

  const renderIcon = () => {
    if (!icon && !loading) return null;

    if (loading) {
      return <ActivityIndicator size="small" color={getTextStyle().color} />;
    }

    return (
      <Ionicons
        name={icon as any}
        size={size === 'small' ? 16 : size === 'medium' ? 20 : 24}
        color={getTextStyle().color}
      />
    );
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {iconPosition === 'left' && renderIcon()}
      <Text style={getTextStyle()}>{title}</Text>
      {iconPosition === 'right' && renderIcon()}
    </TouchableOpacity>
  );
};