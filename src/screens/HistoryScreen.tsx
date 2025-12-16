
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes } from '../constants/theme';
import { useHistory, useWatchStats, useContinueWatching } from '../contexts/HistoryContext';
import { WatchHistory } from '../types';
import { useTranslation } from '../i18n/useTranslation';

export const HistoryScreen = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const {
    history,
    clearHistory,
    removeFromHistory,
    refreshHistory,
    isLoading,
  } = useHistory();

  const {
    totalWatchTime,
    videosWatched,
    favoriteCategories,
    averageWatchTime,
  } = useWatchStats();

  const { continueWatching } = useContinueWatching();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'continue'>('all');

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshHistory();
    setRefreshing(false);
  };

  const handleClearHistory = () => {
    Alert.alert(
      t('clearHistory'),
      t('confirmClearHistory'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('clear'),
          style: 'destructive',
          onPress: () => clearHistory(),
        },
      ]
    );
  };

  const handleRemoveItem = (channelId: string, channelName: string) => {
    Alert.alert(
      t('removeFromHistory'),
      `${t('remove')} "${channelName}" ${t('removeFromHistory').toLowerCase()}?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('remove'),
          style: 'destructive',
          onPress: () => removeFromHistory(channelId),
        },
      ]
    );
  };

  const formatWatchTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Ionicons name="time-outline" size={32} color={Colors.primary} />
        <Text style={styles.statValue}>{formatWatchTime(totalWatchTime)}</Text>
        <Text style={styles.statLabel}>{t('totalWatchTime')}</Text>
      </View>

      <View style={styles.statCard}>
        <Ionicons name="play-circle-outline" size={32} color={Colors.primary} />
        <Text style={styles.statValue}>{videosWatched}</Text>
        <Text style={styles.statLabel}>{t('videosWatched')}</Text>
      </View>

      <View style={styles.statCard}>
        <Ionicons name="trending-up-outline" size={32} color={Colors.primary} />
        <Text style={styles.statValue}>{formatWatchTime(averageWatchTime)}</Text>
        <Text style={styles.statLabel}>{t('avgWatchTime')}</Text>
      </View>
    </View>
  );

  const renderFavoriteCategories = () => {
    if (favoriteCategories.length === 0) return null;

    return (
      <View style={styles.categoriesContainer}>
        <Text style={styles.sectionTitle}>{t('favoriteCategories')}</Text>
        <View style={styles.categoryTags}>
          {favoriteCategories.map((category, index) => (
            <View key={index} style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{category}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderHistoryItem = ({ item }: { item: WatchHistory }) => (
    <TouchableOpacity style={styles.historyItem}>
      {item.logo ? (
        <Image source={{ uri: item.logo }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
          <Ionicons name="film-outline" size={32} color={Colors.textSecondary} />
        </View>
      )}

      <View style={styles.historyInfo}>
        <Text style={styles.historyTitle} numberOfLines={2}>
          {item.channelName}
        </Text>

        <View style={styles.historyMeta}>
          <Text style={styles.historyMetaText}>
            {formatDate(item.lastWatchedAt)}
          </Text>
          {item.duration > 0 && (
            <Text style={styles.historyMetaText}>
              {Math.round(item.progress * 100)}% {t('watched')}
            </Text>
          )}
        </View>

        {}
        {item.duration > 0 && (
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${item.progress * 100}%` },
              ]}
            />
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveItem(item.channelId, item.channelName)}
      >
        <Ionicons name="close-circle-outline" size={24} color={Colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="time-outline" size={64} color={Colors.textSecondary} />
      <Text style={styles.emptyText}>{t('noHistory')}</Text>
      <Text style={styles.emptySubtext}>
        {t('videosWillAppearHere')}
      </Text>
    </View>
  );

  const displayHistory = selectedTab === 'continue' ? continueWatching : history;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {}
      <View style={[styles.header, { paddingTop: Spacing.md }]}>
        <Text style={styles.headerTitle}>{t('watchHistory')}</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClearHistory}>
            <Text style={styles.clearButton}>{t('clearAllHistory')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {}
      {renderStatsCard()}

      {}
      {renderFavoriteCategories()}

      {}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
          onPress={() => setSelectedTab('all')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'all' && styles.tabTextActive,
            ]}
          >
            {t('allHistory')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'continue' && styles.tabActive]}
          onPress={() => setSelectedTab('continue')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'continue' && styles.tabTextActive,
            ]}
          >
            {t('continueWatching')}
          </Text>
        </TouchableOpacity>
      </View>

      {}
      <FlatList
        data={displayHistory}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.channelId}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  clearButton: {
    fontSize: FontSizes.md,
    color: Colors.error,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  categoriesContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  categoryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryTag: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  categoryTagText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  thumbnailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'space-between',
  },
  historyTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  historyMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  historyMetaText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: Colors.background,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  removeButton: {
    padding: Spacing.xs,
    justifyContent: 'center',
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
  },
});
