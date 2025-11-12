// EPG Viewer Component
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { epgService, EPGProgram } from '../../services/EPGService';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';

interface EPGViewerProps {
  channelId: string;
  channelName: string;
  onClose: () => void;
}

export const EPGViewer: React.FC<EPGViewerProps> = ({
  channelId,
  channelName,
  onClose,
}) => {
  const [currentProgram, setCurrentProgram] = useState<EPGProgram | null>(null);
  const [nextPrograms, setNextPrograms] = useState<EPGProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEPGData();
  }, [channelId]);

  const loadEPGData = async () => {
    setIsLoading(true);
    try {
      const current = epgService.getCurrentProgram(channelId);
      const next = epgService.getNextPrograms(channelId, 10);

      setCurrentProgram(current);
      setNextPrograms(next);
    } catch (error) {
      console.error('EPG load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (start: Date, end: Date): string => {
    const minutes = Math.floor((end.getTime() - start.getTime()) / 60000);
    return `${minutes} min`;
  };

  const getProgress = (program: EPGProgram): number => {
    const now = Date.now();
    const start = program.startTime.getTime();
    const end = program.endTime.getTime();

    if (now < start) return 0;
    if (now > end) return 100;

    return ((now - start) / (end - start)) * 100;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.channelName}>{channelName}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading program guide...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Ionicons name="tv-outline" size={24} color={Colors.primary} />
          <Text style={styles.channelName}>{channelName}</Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Current Program */}
        {currentProgram ? (
          <View style={styles.currentSection}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>NOW PLAYING</Text>
            </View>

            <View style={styles.currentProgram}>
              <Text style={styles.currentTitle}>{currentProgram.title}</Text>
              <Text style={styles.currentTime}>
                {formatTime(currentProgram.startTime)} -{' '}
                {formatTime(currentProgram.endTime)} •{' '}
                {formatDuration(currentProgram.startTime, currentProgram.endTime)}
              </Text>
              {currentProgram.description && (
                <Text style={styles.currentDescription}>
                  {currentProgram.description}
                </Text>
              )}

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${getProgress(currentProgram)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(getProgress(currentProgram))}%
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noData}>
            <Ionicons name="calendar-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.noDataText}>No program information available</Text>
          </View>
        )}

        {/* Upcoming Programs */}
        {nextPrograms.length > 0 && (
          <View style={styles.upcomingSection}>
            <Text style={styles.sectionTitle}>UP NEXT</Text>

            {nextPrograms.map((program, index) => (
              <View key={program.id} style={styles.programItem}>
                <View style={styles.programTime}>
                  <Text style={styles.timeText}>
                    {formatTime(program.startTime)}
                  </Text>
                  <Text style={styles.durationText}>
                    {formatDuration(program.startTime, program.endTime)}
                  </Text>
                </View>

                <View style={styles.programInfo}>
                  <Text style={styles.programTitle} numberOfLines={1}>
                    {program.title}
                  </Text>
                  {program.description && (
                    <Text style={styles.programDescription} numberOfLines={2}>
                      {program.description}
                    </Text>
                  )}
                  {program.category && (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{program.category}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  channelName: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  currentSection: {
    padding: Spacing.lg,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  liveText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.error,
    letterSpacing: 1,
  },
  currentProgram: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  currentTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  currentTime: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  currentDescription: {
    fontSize: FontSizes.md,
    color: Colors.text,
    lineHeight: 22,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    minWidth: 40,
  },
  upcomingSection: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  programItem: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  programTime: {
    width: 80,
  },
  timeText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  durationText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  programInfo: {
    flex: 1,
  },
  programTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  programDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  categoryText: {
    fontSize: FontSizes.xs,
    color: Colors.text,
    fontWeight: '600',
  },
  noData: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  noDataText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
});
