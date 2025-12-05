// Reusable Chip Component
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../constants/theme';

export interface ChipProps {
  title: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: 'default' | 'filter' | 'category';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Chip: React.FC<ChipProps> = ({
  title,
  selected = false,
  onPress,
  variant = 'default',
  size = 'medium',
  icon,
  disabled = false,
  style,
  textStyle,
}) => {
  const getChipStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BorderRadius.full,
    };

    // Size styles
    const sizeStyles = {
      small: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        minHeight: 28,
      },
      medium: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        minHeight: 36,
      },
      large: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        minHeight: 44,
      },
    };

    // Variant styles
    const variantStyles = {
      default: {
        backgroundColor: selected ? Colors.primary : Colors.surface,
        borderWidth: 1,
        borderColor: selected ? Colors.primary : Colors.border,
      },
      filter: {
        backgroundColor: selected ? Colors.primary : Colors.backgroundCard,
        borderWidth: 1,
        borderColor: selected ? Colors.primary : Colors.border,
      },
      category: {
        backgroundColor: selected ? Colors.secondary : Colors.surface,
        borderWidth: 1,
        borderColor: selected ? Colors.secondary : Colors.border,
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

    // Size styles
    const sizeStyles = {
      small: {
        fontSize: FontSizes.xs,
      },
      medium: {
        fontSize: FontSizes.sm,
      },
      large: {
        fontSize: FontSizes.md,
      },
    };

    // Variant styles
    const variantStyles = {
      default: {
        color: selected ? Colors.text : Colors.textSecondary,
      },
      filter: {
        color: selected ? Colors.text : Colors.textSecondary,
      },
      category: {
        color: selected ? Colors.text : Colors.textSecondary,
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
    if (!icon) return null;

    return (
      <Ionicons
        name={icon as any}
        size={size === 'small' ? 12 : size === 'medium' ? 16 : 20}
        color={getTextStyle().color}
        style={styles.icon}
      />
    );
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={getChipStyle()}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {renderIcon()}
        <Text style={getTextStyle()}>{title}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={getChipStyle()}>
      {renderIcon()}
      <Text style={getTextStyle()}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  icon: {
    marginRight: Spacing.xs,
  },
});