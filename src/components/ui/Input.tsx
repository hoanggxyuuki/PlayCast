
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../constants/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  variant?: 'default' | 'outlined' | 'filled';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  variant = 'default',
  ...textInputProps
}) => {
  const getInputContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: BorderRadius.md,
    };

    const variantStyles = {
      default: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: error ? Colors.error : Colors.border,
      },
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: error ? Colors.error : Colors.primary,
      },
      filled: {
        backgroundColor: Colors.backgroundElevated,
        borderWidth: 0,
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
    };
  };

  const getInputStyle = (): TextStyle => {
    return {
      flex: 1,
      paddingVertical: Spacing.md,
      paddingHorizontal: leftIcon ? 0 : Spacing.md,
      fontSize: FontSizes.md,
      color: Colors.text,
      minHeight: 44,
    };
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={getInputContainerStyle()}>
        {leftIcon && (
          <Ionicons
            name={leftIcon as any}
            size={20}
            color={Colors.textTertiary}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={[getInputStyle(), inputStyle]}
          placeholderTextColor={Colors.textTertiary}
          {...textInputProps}
        />

        {rightIcon && (
          <Ionicons
            name={rightIcon as any}
            size={20}
            color={Colors.textTertiary}
            style={[styles.rightIcon, onRightIconPress && styles.rightIconPressable]}
            onPress={onRightIconPress}
          />
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  leftIcon: {
    paddingLeft: Spacing.md,
  },
  rightIcon: {
    paddingRight: Spacing.md,
  },
  rightIconPressable: {
    padding: Spacing.sm,
  },
  errorText: {
    fontSize: FontSizes.sm,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});