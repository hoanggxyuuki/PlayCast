
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    title: string;
    onPress: () => void;
  };
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  style,
  textStyle,
}) => {
  return (
    <View style={[styles.container, style]}>
      {icon && (
        <Ionicons
          name={icon as any}
          size={64}
          color={Colors.textTertiary}
          style={styles.icon}
        />
      )}

      <Text style={[styles.title, textStyle]}>{title}</Text>

      {description && (
        <Text style={styles.description}>{description}</Text>
      )}

      {action && (
        <View style={styles.actionContainer}>
          <Text style={styles.actionText} onPress={action.onPress}>
            {action.title}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    minHeight: 300,
  },
  icon: {
    marginBottom: Spacing.lg,
    opacity: 0.6,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  actionContainer: {
    marginTop: Spacing.lg,
  },
  actionText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});