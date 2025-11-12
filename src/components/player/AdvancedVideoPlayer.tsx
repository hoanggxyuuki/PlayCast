// Advanced Video Player with Landscape Support and Fixed UI
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
  Platform,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes } from '../../constants/theme';
import { VideoPlayerProps } from '../../types';
import { useHistory } from '../../contexts/HistoryContext';
import { useQueue } from '../../contexts/QueueContext';
import { useSettings } from '../../contexts/SettingsContext';
import { SleepTimerService } from '../../services/sleepTimerService';

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
  const [isLandscape, setIsLandscape] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  // Contexts
  const { addToHistory, updateProgress } = useHistory();
  const { playNext: queueNext, playPrevious: queuePrev, hasNext, hasPrevious } = useQueue();
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();

  // Refs
  const controlsTimeout = useRef<NodeJS.Timeout>();
  const progressInterval = useRef<NodeJS.Timeout>();
  const controlsOpacity = useRef(new Animated.Value(1)).current;

  // Player initialization
  let player;
  try {
    player = useVideoPlayer(channel.url, (p) => {
      // Resume from last position if enabled
      if (settings.continueWatching && startPosition > 0) {
        p.currentTime = startPosition;
      }
      p.play();
    });
  } catch (err) {
    console.error('Failed to create player:', err);
    setHasError(true);
  }

  // Handle orientation changes
  useEffect(() => {
    // Allow all orientations
    ScreenOrientation.unlockAsync();

    // Listen for orientation changes
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
      const isLandscapeMode = window.width > window.height;
      setIsLandscape(isLandscapeMode);
    });

    // Check initial orientation
    const { width, height } = Dimensions.get('window');
    setIsLandscape(width > height);

    return () => {
      // Lock to portrait on unmount
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      subscription?.remove();
    };
  }, []);

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
    }, 5000);

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
    }, 4000); // Increased to 4 seconds
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
        console.log('Playing next:', next.name);
      }
    }
  };

  const handleClose = () => {
    // Lock back to portrait
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    onClose();
  };

  const toggleOrientation = async () => {
    if (isLandscape) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
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
        <StatusBar hidden={isLandscape} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>Failed to load video</Text>
          <Text style={styles.errorSubtext}>
            Please check if the URL is valid and try again
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden={isLandscape} />

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
          <View style={[styles.topBar, { paddingTop: isLandscape ? Spacing.md : insets.top + Spacing.md }]}>
            <TouchableOpacity style={styles.iconButton} onPress={handleClose}>
              <Ionicons name="close" size={28} color={Colors.text} />
            </TouchableOpacity>

            <View style={styles.topInfo}>
              <Text style={styles.channelName} numberOfLines={1}>
                {channel.name}
              </Text>
              {channel.group && !isLandscape && (
                <Text style={styles.channelGroup}>{channel.group}</Text>
              )}
            </View>

            <TouchableOpacity style={styles.iconButton} onPress={toggleOrientation}>
              <Ionicons
                name={isLandscape ? 'contract' : 'expand'}
                size={24}
                color={Colors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
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
                size={isLandscape ? 36 : 40}
                color={!onPrevious && !hasPrevious() ? Colors.textTertiary : Colors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.playButton]}
              onPress={togglePlayPause}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={isLandscape ? 44 : 50}
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
                size={isLandscape ? 36 : 40}
                color={!onNext && !hasNext() ? Colors.textTertiary : Colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Bottom bar */}
          <View style={[styles.bottomBar, { paddingBottom: isLandscape ? Spacing.md : insets.bottom + Spacing.md }]}>
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
                maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                thumbTintColor={Colors.primary}
              />
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>

            {/* Bottom controls */}
            <View style={styles.bottomControls}>
              <TouchableOpacity
                style={styles.speedButton}
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
          <View style={styles.speedMenu}>
            <Text style={styles.menuTitle}>Playback Speed</Text>
            {speedOptions.map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[
                  styles.speedOption,
                  playbackSpeed === speed && styles.speedOptionActive,
                ]}
                onPress={() => handleSpeedChange(speed)}
              >
                <Text
                  style={[
                    styles.speedOptionText,
                    playbackSpeed === speed && styles.speedOptionTextActive,
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
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.moreMenu}
          >
            <Text style={styles.menuTitle}>Options</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMoreMenu(false);
                // TODO: Implement quality selection
              }}
            >
              <Ionicons name="settings-outline" size={24} color={Colors.text} />
              <Text style={styles.menuItemText}>Quality</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMoreMenu(false);
                // TODO: Implement subtitles
              }}
            >
              <Ionicons name="text-outline" size={24} color={Colors.text} />
              <Text style={styles.menuItemText}>Subtitles</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMoreMenu(false);
                // TODO: Implement sleep timer
              }}
            >
              <Ionicons name="timer-outline" size={24} color={Colors.text} />
              <Text style={styles.menuItemText}>Sleep Timer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMoreMenu(false);
                // TODO: Implement share
              }}
            >
              <Ionicons name="share-outline" size={24} color={Colors.text} />
              <Text style={styles.menuItemText}>Share</Text>
            </TouchableOpacity>
          </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.lg,
  },
  errorSubtext: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  button: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
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
    paddingHorizontal: Spacing.md,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
  },
  topInfo: {
    flex: 1,
    marginHorizontal: Spacing.md,
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
  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
  },
  controlButton: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 28,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
  },
  bottomBar: {
    paddingHorizontal: Spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timeText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: '600',
    minWidth: 45,
    textAlign: 'center',
  },
  progressBar: {
    flex: 1,
    height: 40,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  speedButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 6,
  },
  speedText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  sleepTimerIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 6,
  },
  sleepTimerText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedMenu: {
    width: '70%',
    maxWidth: 300,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: Spacing.lg,
  },
  menuTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  speedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.xs,
  },
  speedOptionActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  speedOptionText: {
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  speedOptionTextActive: {
    fontWeight: '600',
    color: Colors.primary,
  },
  moreMenu: {
    width: '80%',
    maxWidth: 350,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: Spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  menuItemText: {
    fontSize: FontSizes.md,
    color: Colors.text,
  },
});
