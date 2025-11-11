// Advanced Video Player with Premium Controls
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Colors, Spacing, FontSizes } from '../../constants/theme';
import { VideoPlayerProps } from '../../types';
import { useHistory } from '../../contexts/HistoryContext';
import { useQueue } from '../../contexts/QueueContext';
import { useSettings } from '../../contexts/SettingsContext';
import { SleepTimerService } from '../../services/sleepTimerService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const AdvancedVideoPlayer: React.FC<VideoPlayerProps> = ({
  channel,
  onClose,
  onError,
  onNext,
  onPrevious,
  startPosition = 0,
}) => {
  // State
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState('');

  // Contexts
  const { addToHistory, updateProgress, getHistoryForChannel } = useHistory();
  const { playNext: queueNext, playPrevious: queuePrev, hasNext, hasPrevious } = useQueue();
  const { settings } = useSettings();

  // Refs
  const controlsTimeout = useRef<NodeJS.Timeout>();
  const progressInterval = useRef<NodeJS.Timeout>();
  const controlsOpacity = useRef(new Animated.Value(1)).current;

  // Player initialization with resume support
  let player;
  try {
    player = useVideoPlayer(channel.url, (p) => {
      console.log('Player initialized');

      // Resume from last position if enabled
      if (settings.continueWatching && startPosition > 0) {
        p.currentTime = startPosition;
        console.log('Resuming from:', startPosition);
      }

      p.play();
    });
  } catch (err) {
    console.error('Failed to create player:', err);
    setHasError(true);
  }

  // Monitor player status
  useEffect(() => {
    if (!player) return;

    const interval = setInterval(() => {
      try {
        if (player.status === 'readyToPlay' || player.status === 'idle') {
          setIsLoading(false);
        }

        if (player.status === 'error') {
          setIsLoading(false);
          setHasError(true);
          onError?.('Failed to load video');
        }

        setIsPlaying(player.playing);
        setCurrentTime(player.currentTime);
        setDuration(player.duration);
      } catch (err) {
        console.error('Error checking player status:', err);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [player]);

  // Track progress for history
  useEffect(() => {
    if (!player || !channel) return;

    progressInterval.current = setInterval(() => {
      if (player.playing && player.duration > 0) {
        updateProgress(channel.id, player.currentTime, player.duration);
      }
    }, 5000); // Update every 5 seconds

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [player, channel]);

  // Add to history on mount
  useEffect(() => {
    if (channel) {
      addToHistory({
        channelId: channel.id,
        channelName: channel.name,
        channelUrl: channel.url,
        logo: channel.logo,
        lastWatchedAt: new Date(),
        progress: 0,
        duration: 0,
        currentTime: 0,
      });
    }
  }, [channel]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      resetControlsTimeout();
    }
  }, [showControls, isPlaying]);

  // Sleep timer check
  useEffect(() => {
    const interval = setInterval(() => {
      if (SleepTimerService.isActive()) {
        setSleepTimerRemaining(SleepTimerService.getRemainingFormatted());
      } else {
        setSleepTimerRemaining('');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const resetControlsTimeout = () => {
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }

    controlsTimeout.current = setTimeout(() => {
      hideControls();
    }, 3000);
  };

  const hideControls = () => {
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowControls(false));
  };

  const showControlsAnimated = () => {
    setShowControls(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    resetControlsTimeout();
  };

  const togglePlayPause = () => {
    if (!player) return;

    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
    showControlsAnimated();
  };

  const handleSeek = (value: number) => {
    if (!player) return;
    player.currentTime = value;
    setCurrentTime(value);
    showControlsAnimated();
  };

  const handleSpeedChange = (speed: number) => {
    if (!player) return;
    player.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    showControlsAnimated();
  };

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
    } else if (hasPrevious()) {
      const prev = queuePrev();
      if (prev) {
        // Would need to reload player with new channel
        console.log('Playing previous:', prev.name);
      }
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else if (hasNext()) {
      const next = queueNext();
      if (next) {
        // Would need to reload player with new channel
        console.log('Playing next:', next.name);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '0:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  if (hasError || !player) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>Failed to load video</Text>
          <Text style={styles.errorSubtext}>
            Please check if the URL is valid and try again
          </Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Video view */}
      <TouchableOpacity
        style={styles.videoContainer}
        activeOpacity={1}
        onPress={() => showControlsAnimated()}
      >
        <VideoView
          player={player}
          style={styles.video}
          nativeControls={false}
          contentFit="contain"
          allowsPictureInPicture={settings.pictureInPicture}
        />
      </TouchableOpacity>

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      )}

      {/* Controls overlay */}
      {showControls && (
        <Animated.View style={[styles.controlsContainer, { opacity: controlsOpacity }]}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color={Colors.text} />
            </TouchableOpacity>

            <View style={styles.topInfo}>
              <Text style={styles.channelName} numberOfLines={1}>
                {channel.name}
              </Text>
              {channel.group && (
                <Text style={styles.channelGroup}>{channel.group}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => setShowMoreMenu(true)}
            >
              <Ionicons name="ellipsis-vertical" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Center controls */}
          <View style={styles.centerControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handlePrevious}
              disabled={!onPrevious && !hasPrevious()}
            >
              <Ionicons
                name="play-skip-back"
                size={40}
                color={!onPrevious && !hasPrevious() ? Colors.textSecondary : Colors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.playButton]}
              onPress={togglePlayPause}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={50}
                color={Colors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleNext}
              disabled={!onNext && !hasNext()}
            >
              <Ionicons
                name="play-skip-forward"
                size={40}
                color={!onNext && !hasNext() ? Colors.textSecondary : Colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Bottom bar */}
          <View style={styles.bottomBar}>
            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <Slider
                style={styles.progressBar}
                minimumValue={0}
                maximumValue={duration || 100}
                value={currentTime}
                onValueChange={handleSeek}
                minimumTrackTintColor={Colors.primary}
                maximumTrackTintColor={Colors.textSecondary}
                thumbTintColor={Colors.primary}
              />
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>

            {/* Bottom controls */}
            <View style={styles.bottomControls}>
              <TouchableOpacity
                style={styles.bottomButton}
                onPress={() => setShowSpeedMenu(true)}
              >
                <Text style={styles.speedText}>{playbackSpeed}x</Text>
              </TouchableOpacity>

              {sleepTimerRemaining && (
                <View style={styles.sleepTimerIndicator}>
                  <Ionicons name="moon" size={16} color={Colors.primary} />
                  <Text style={styles.sleepTimerText}>{sleepTimerRemaining}</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      )}

      {/* Speed selection menu */}
      <Modal
        visible={showSpeedMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSpeedMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSpeedMenu(false)}
        >
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Playback Speed</Text>
            {speedOptions.map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[
                  styles.menuItem,
                  playbackSpeed === speed && styles.menuItemActive,
                ]}
                onPress={() => handleSpeedChange(speed)}
              >
                <Text
                  style={[
                    styles.menuItemText,
                    playbackSpeed === speed && styles.menuItemTextActive,
                  ]}
                >
                  {speed}x
                </Text>
                {playbackSpeed === speed && (
                  <Ionicons name="checkmark" size={24} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* More options menu */}
      <Modal
        visible={showMoreMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMoreMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMoreMenu(false)}
        >
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Options</Text>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="settings-outline" size={24} color={Colors.text} />
              <Text style={styles.menuItemText}>Quality</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="text-outline" size={24} color={Colors.text} />
              <Text style={styles.menuItemText}>Subtitles</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="timer-outline" size={24} color={Colors.text} />
              <Text style={styles.menuItemText}>Sleep Timer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="share-outline" size={24} color={Colors.text} />
              <Text style={styles.menuItemText}>Share</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  videoContainer: {
    flex: 1,
  },
  video: {
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    zIndex: 50,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.lg,
    color: Colors.text,
    fontWeight: '600',
  },
  controlsContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingTop: 50,
  },
  closeButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.overlay,
    borderRadius: 20,
  },
  topInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  channelName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  channelGroup: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  moreButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.overlay,
    borderRadius: 20,
  },
  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  controlButton: {
    padding: Spacing.md,
    backgroundColor: Colors.overlay,
    borderRadius: 40,
  },
  playButton: {
    padding: Spacing.lg,
    backgroundColor: Colors.primary,
  },
  bottomBar: {
    padding: Spacing.md,
    paddingBottom: 30,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  timeText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    minWidth: 50,
    textAlign: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.overlay,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  speedText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: '600',
  },
  sleepTimerIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.overlay,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    gap: Spacing.xs,
  },
  sleepTimerText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    minWidth: SCREEN_WIDTH * 0.7,
    maxHeight: '80%',
  },
  menuTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.xs,
    gap: Spacing.md,
  },
  menuItemActive: {
    backgroundColor: Colors.overlay,
  },
  menuItemText: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  menuItemTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  errorSubtext: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '600',
  },
});
