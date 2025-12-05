// Channel List Item Component
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Channel } from '../../types';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../constants/theme';
import { Card, Button } from '../ui';

interface ChannelItemProps {
  channel: Channel;
  onPress: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const ChannelItem: React.FC<ChannelItemProps> = ({
  channel,
  onPress,
  isFavorite = false,
  onToggleFavorite,
}) => {
  return (
    <Card
      variant="default"
      padding="medium"
      margin="small"
      onPress={onPress}
    >
      <View style={styles.content}>
        {/* Channel Logo */}
        {channel.logo ? (
          <Image
            source={{ uri: channel.logo }}
            style={styles.logo}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.logo, styles.logoPlaceholder]}>
            <Ionicons name="tv" size={24} color={Colors.textTertiary} />
          </View>
        )}

        {/* Channel Info */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {channel.name}
          </Text>
          {channel.group && (
            <Text style={styles.group} numberOfLines={1}>
              {channel.group}
            </Text>
          )}
        </View>

        {/* Favorite Button */}
        {onToggleFavorite && (
          <Button
            title=""
            variant="ghost"
            size="small"
            icon={isFavorite ? 'heart' : 'heart-outline'}
            onPress={(e) => {
              e?.stopPropagation();
              onToggleFavorite();
            }}
            style={styles.favoriteButton}
          />
        )}

        {/* Play Icon */}
        <View style={styles.playIcon}>
          <Ionicons name="play-circle" size={28} color={Colors.primary} />
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    // Removed as handled by Card component
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
  },
  logoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  group: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  favoriteButton: {
    padding: Spacing.xs,
  },
  playIcon: {
    padding: Spacing.xs,
  },
});
