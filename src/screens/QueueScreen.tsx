// Queue Management Screen
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes } from '../constants/theme';
import { useQueue, useCurrentPlayback } from '../contexts/QueueContext';
import { QueueItem } from '../types';
import { useTranslation } from '../i18n/useTranslation';

export const QueueScreen = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const {
    queue,
    currentIndex,
    removeFromQueue,
    clearQueue,
    moveToTop,
    moveToBottom,
    shuffleQueue,
    setCurrentIndex,
  } = useQueue();

  const { current, totalItems } = useCurrentPlayback();

  const handleClearQueue = () => {
    Alert.alert(
      t('clearQueue'),
      t('confirmClearQueue'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('clear'),
          style: 'destructive',
          onPress: () => clearQueue(),
        },
      ]
    );
  };

  const handleRemoveItem = (channelId: string, channelName: string) => {
    Alert.alert(
      t('removeFromQueue'),
      `${t('remove')} "${channelName}"?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('remove'),
          style: 'destructive',
          onPress: () => removeFromQueue(channelId),
        },
      ]
    );
  };

  const handlePlayItem = (index: number) => {
    setCurrentIndex(index);
    Alert.alert(t('nowPlaying'), queue[index].channel.name);
  };

  const renderQueueItem = ({ item, index }: { item: QueueItem; index: number }) => {
    const isPlaying = index === currentIndex;

    return (
      <View style={[styles.queueItem, isPlaying && styles.queueItemActive]}>
        {/* Position indicator */}
        <View style={styles.positionContainer}>
          {isPlaying ? (
            <Ionicons name="play-circle" size={24} color={Colors.primary} />
          ) : (
            <Text style={styles.positionText}>{index + 1}</Text>
          )}
        </View>

        {/* Thumbnail */}
        <TouchableOpacity
          style={styles.thumbnailContainer}
          onPress={() => handlePlayItem(index)}
        >
          {item.channel.logo ? (
            <Image source={{ uri: item.channel.logo }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
              <Ionicons name="film-outline" size={24} color={Colors.textSecondary} />
            </View>
          )}
          {isPlaying && (
            <View style={styles.playingOverlay}>
              <Ionicons name="play" size={32} color={Colors.text} />
            </View>
          )}
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.queueInfo}>
          <Text style={styles.queueTitle} numberOfLines={2}>
            {item.channel.name}
          </Text>
          {item.channel.group && (
            <Text style={styles.queueGroup} numberOfLines={1}>
              {item.channel.group}
            </Text>
          )}
          {isPlaying && (
            <Text style={styles.nowPlayingText}>{t('nowPlaying')}</Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => moveToTop(item.channel.id)}
            disabled={index === 0}
          >
            <Ionicons
              name="arrow-up"
              size={20}
              color={index === 0 ? Colors.textSecondary : Colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => moveToBottom(item.channel.id)}
            disabled={index === queue.length - 1}
          >
            <Ionicons
              name="arrow-down"
              size={20}
              color={index === queue.length - 1 ? Colors.textSecondary : Colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleRemoveItem(item.channel.id, item.channel.name)}
          >
            <Ionicons name="close-circle-outline" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="list-outline" size={64} color={Colors.textSecondary} />
      <Text style={styles.emptyText}>{t('queueEmpty')}</Text>
      <Text style={styles.emptySubtext}>
        {t('addChannelsToQueue')}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="musical-notes-outline" size={24} color={Colors.primary} />
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{totalItems}</Text>
            <Text style={styles.statLabel}>{t('itemsInQueue')}</Text>
          </View>
        </View>

        {current && (
          <View style={styles.statItem}>
            <Ionicons name="play-circle-outline" size={24} color={Colors.primary} />
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{currentIndex + 1}</Text>
              <Text style={styles.statLabel}>{t('currentlyPlaying')}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Actions */}
      {queue.length > 0 && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.headerButton} onPress={shuffleQueue}>
            <Ionicons name="shuffle-outline" size={20} color={Colors.text} />
            <Text style={styles.headerButtonText}>{t('shuffle')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerButton} onPress={handleClearQueue}>
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
            <Text style={[styles.headerButtonText, { color: Colors.error }]}>
              {t('clearQueue')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Currently Playing Card */}
      {current && (
        <View style={styles.nowPlayingCard}>
          <View style={styles.nowPlayingHeader}>
            <Ionicons name="disc-outline" size={20} color={Colors.primary} />
            <Text style={styles.nowPlayingLabel}>{t('nowPlaying')}</Text>
          </View>
          <Text style={styles.nowPlayingTitle} numberOfLines={1}>
            {current.name}
          </Text>
          {current.group && (
            <Text style={styles.nowPlayingGroup}>{current.group}</Text>
          )}
        </View>
      )}

      {queue.length > 0 && (
        <Text style={styles.sectionTitle}>{t('upNext')}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={queue}
        renderItem={renderQueueItem}
        keyExtractor={(item, index) => `${item.channel.id}-${index}`}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  headerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    gap: Spacing.xs,
  },
  headerButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  nowPlayingCard: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  nowPlayingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  nowPlayingLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
    opacity: 0.9,
  },
  nowPlayingTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  nowPlayingGroup: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    opacity: 0.8,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  queueItemActive: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  positionContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  positionText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  thumbnailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  queueInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  queueTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  queueGroup: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  nowPlayingText: {
    fontSize: FontSizes.xs,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionButton: {
    padding: Spacing.xs,
    borderRadius: 6,
    backgroundColor: Colors.background,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  emptySubtext: {
    marginTop: Spacing.xs,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
