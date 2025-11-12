// Statistics Dashboard Screen
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHistory } from '../contexts/HistoryContext';
import { usePlaylist } from '../contexts/PlaylistContext';
import { useTranslation } from '../i18n/useTranslation';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const StatisticsScreen = () => {
  const { t } = useTranslation();
  const { history } = useHistory();
  const { playlists } = usePlaylist();

  // Calculate statistics
  const stats = useMemo(() => {
    const totalWatchTime = history.reduce((sum, h) => sum + h.watchDuration, 0);
    const videosWatched = history.length;
    const avgWatchTime = videosWatched > 0 ? totalWatchTime / videosWatched : 0;

    // Group by category
    const categoryStats = history.reduce((acc, h) => {
      const category = h.channel.group || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = { count: 0, duration: 0 };
      }
      acc[category].count++;
      acc[category].duration += h.watchDuration;
      return acc;
    }, {} as Record<string, { count: number; duration: number }>);

    const topCategories = Object.entries(categoryStats)
      .sort((a, b) => b[1].duration - a[1].duration)
      .slice(0, 5);

    // Watch time by day of week
    const dayStats = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    history.forEach(h => {
      const day = new Date(h.timestamp).getDay();
      dayStats[day] += h.watchDuration;
    });

    // Most watched channels
    const channelStats = history.reduce((acc, h) => {
      if (!acc[h.channel.id]) {
        acc[h.channel.id] = { channel: h.channel, count: 0, duration: 0 };
      }
      acc[h.channel.id].count++;
      acc[h.channel.id].duration += h.watchDuration;
      return acc;
    }, {} as Record<string, { channel: any; count: number; duration: number }>);

    const topChannels = Object.values(channelStats)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    return {
      totalWatchTime,
      videosWatched,
      avgWatchTime,
      topCategories,
      dayStats,
      topChannels,
    };
  }, [history]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const renderStatCard = (
    icon: string,
    label: string,
    value: string,
    color: string = Colors.primary
  ) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon as any} size={24} color={color} />
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  const renderBarChart = (data: number[], labels: string[]) => {
    const maxValue = Math.max(...data, 1);
    return (
      <View style={styles.barChart}>
        {data.map((value, index) => (
          <View key={index} style={styles.barContainer}>
            <View style={styles.bar}>
              <View
                style={[
                  styles.barFill,
                  { height: `${(value / maxValue) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.barLabel}>{labels[index]}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('statistics')}</Text>
          <Text style={styles.subtitle}>Your viewing analytics</Text>
        </View>

        {/* Overview Stats */}
        <View style={styles.section}>
          {renderStatCard(
            'time-outline',
            t('totalWatchTime'),
            formatDuration(stats.totalWatchTime),
            Colors.primary
          )}
          {renderStatCard(
            'videocam-outline',
            t('videosWatched'),
            stats.videosWatched.toString(),
            '#10B981'
          )}
          {renderStatCard(
            'trending-up-outline',
            t('avgWatchTime'),
            formatDuration(stats.avgWatchTime),
            '#F59E0B'
          )}
        </View>

        {/* Watch Time by Day */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Watch Time by Day</Text>
          {renderBarChart(
            stats.dayStats,
            ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          )}
        </View>

        {/* Top Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('favoriteCategories')}</Text>
          {stats.topCategories.map(([category, data], index) => (
            <View key={category} style={styles.listItem}>
              <View style={styles.listRank}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <View style={styles.listInfo}>
                <Text style={styles.listTitle}>{category}</Text>
                <Text style={styles.listSubtitle}>
                  {data.count} videos · {formatDuration(data.duration)}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(data.duration / stats.totalWatchTime) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Top Channels */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Most Watched Channels</Text>
          {stats.topChannels.map((data, index) => (
            <View key={data.channel.id} style={styles.listItem}>
              <View style={styles.listRank}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <View style={styles.listInfo}>
                <Text style={styles.listTitle}>{data.channel.name}</Text>
                <Text style={styles.listSubtitle}>
                  {data.count} times · {formatDuration(data.duration)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxxl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  section: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderLeftWidth: 4,
    ...Shadows.sm,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    gap: Spacing.sm,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  bar: {
    flex: 1,
    width: '100%',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  barLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  listRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.text,
  },
  listInfo: {
    flex: 1,
  },
  listTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  listSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: Colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
});
