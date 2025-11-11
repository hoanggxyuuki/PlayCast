// Channel List Item Component
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Channel } from '../../types';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../constants/theme';

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
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
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
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? Colors.error : Colors.textSecondary}
            />
          </TouchableOpacity>
        )}

        {/* Play Icon */}
        <View style={styles.playIcon}>
          <Ionicons name="play-circle" size={28} color={Colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
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
  },
  group: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  favoriteButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  playIcon: {
    padding: Spacing.xs,
  },
});
