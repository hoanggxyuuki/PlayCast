
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes } from '../../constants/theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'tv-outline',
  title,
  description,
}) => {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={Colors.textTertiary} />
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  title: {
    marginTop: Spacing.lg,
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  description: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
