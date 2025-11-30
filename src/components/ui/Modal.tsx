// Reusable Modal Component
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal as RNModal,
    ModalProps as RNModalProps,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../constants/theme';

export interface ModalProps extends Omit<RNModalProps, 'visible'> {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'full';
  showCloseButton?: boolean;
  contentStyle?: ViewStyle;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  contentStyle,
  ...modalProps
}) => {
  const insets = useSafeAreaInsets();

  const getModalContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
    };

    return baseStyle;
  };

  const getModalContentStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: Colors.backgroundCard,
      borderRadius: BorderRadius.lg,
      width: '90%',
      maxHeight: '80%',
      overflow: 'hidden',
    };

    // Size styles
    const sizeStyles = {
      small: {
        width: '80%',
        maxHeight: '60%',
      },
      medium: {
        width: '90%',
        maxHeight: '80%',
      },
      large: {
        width: '95%',
        maxHeight: '90%',
      },
      full: {
        width: '100%',
        height: '100%',
        maxHeight: '100%',
        borderRadius: 0,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...contentStyle,
    };
  };

  const getHeaderStyle = (): ViewStyle => {
    return {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      paddingTop: size === 'full' ? insets.top + Spacing.md : Spacing.md,
    };
  };

  const getContentStyle = (): ViewStyle => {
    return {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      paddingBottom: size === 'full' ? insets.bottom + Spacing.md : Spacing.md,
    };
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      {...modalProps}
    >
      <View style={getModalContainerStyle()}>
        <View style={getModalContentStyle()}>
          {(title || showCloseButton) && (
            <View style={getHeaderStyle()}>
              {title && (
                <Text style={styles.title}>{title}</Text>
              )}
              {showCloseButton && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
          
          <View style={getContentStyle()}>
            {children}
          </View>
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  closeButton: {
    padding: Spacing.xs,
  },
});