// Advanced Video Player with react-native-video for better PiP support
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Video, { OnBufferData, OnLoadData, OnProgressData, VideoRef } from 'react-native-video';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import { useHistory } from '../../contexts/HistoryContext';
import { useQueue } from '../../contexts/QueueContext';
import { useSettings } from '../../contexts/SettingsContext';
import { SleepTimerService } from '../../services/sleepTimerService';
import { VideoPlayerProps } from '../../types';
import { SleepTimerModal } from './SleepTimerModal';

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
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState('');
  const [isLandscape, setIsLandscape] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  // Contexts
  const { addToHistory, updateProgress } = useHistory();
  const { playNext: queueNext, playPrevious: queuePrev, hasNext, hasPrevious } = useQueue();
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();

  // Refs
  const videoRef = useRef<VideoRef>(null);
  const controlsTimeout = useRef<NodeJS.Timeout>();
  const progressInterval = useRef<NodeJS.Timeout>();
  const controlsOpacity = useRef(new Animated.Value(1)).current;

  // Handle orientation changes
  useEffect(() => {
    ScreenOrientation.unlockAsync();

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const isLandscapeMode = window.width > window.height;
      setIsLandscape(isLandscapeMode);
    });

    const { width, height } = Dimensions.get('window');
    setIsLandscape(width > height);

    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      subscription?.remove();
    };
  }, []);

  // Track progress for history
  useEffect(() => {
    if (!channel) return;

    progressInterval.current = setInterval(() => {
      if (isPlaying && duration > 0) {
        updateProgress(channel.id, currentTime, duration);
      }
    }, 5000);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [channel, isPlaying, currentTime, duration]);

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

  // Video callbacks
  const onVideoLoad = (data: OnLoadData) => {
    console.log('Video loaded:', data.duration);
    setIsLoading(false);
    setDuration(data.duration);

    // Resume from last position
    if (settings.continueWatching && startPosition > 0) {
      videoRef.current?.seek(startPosition);
    }
  };

  const onVideoProgress = (data: OnProgressData) => {
    setCurrentTime(data.currentTime);
  };

  const onVideoBuffer = (data: OnBufferData) => {
    setIsBuffering(data.isBuffering);
  };

  const onVideoError = (error: any) => {
    console.error('Video error:', error);
    setIsLoading(false);
    setHasError(true);
    onError?.('Failed to load video');
  };

  const onVideoEnd = () => {
    // Auto play next if available
    if (hasNext()) {
      const next = queueNext();
      if (next) {
        console.log('Auto-playing next:', next.name);
      }
    }
  };

  const resetControlsTimeout = () => {
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }

    controlsTimeout.current = setTimeout(() => {
      hideControls();
    }, 4000);
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
    setIsPlaying(!isPlaying);
    showControlsAnimated();
  };

  const handleSeek = (value: number) => {
    videoRef.current?.seek(value);
    setCurrentTime(value);
    showControlsAnimated();
  };

  const handleSpeedChange = (speed: number) => {
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

  if (hasError) {
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

      {/* Video view with react-native-video */}
      <TouchableOpacity
        style={styles.videoContainer}
        activeOpacity={1}
        onPress={() => showControlsAnimated()}
      >
        <Video
          ref={videoRef}
          source={{ uri: channel.url }}
          style={styles.video}
          resizeMode="contain"
          paused={!isPlaying}
          rate={playbackSpeed}
          volume={1.0}
          muted={false}
          repeat={false}
          // PiP and background playback
          pictureInPicture={true}
          playInBackground={true}
          playWhenInactive={true}
          // Lock screen / notification controls
          controls={false}
          showNotificationControls={true}
          metadata={{
            title: channel.name,
            artist: channel.group || 'PlayCast',
            imageUri: channel.logo,
          }}
          // Callbacks
          onLoad={onVideoLoad}
          onProgress={onVideoProgress}
          onBuffer={onVideoBuffer}
          onError={onVideoError}
          onEnd={onVideoEnd}
        />
      </TouchableOpacity>

      {/* Loading overlay */}
      {(isLoading || isBuffering) && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            {isBuffering ? 'Buffering...' : 'Loading video...'}
          </Text>
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
              }}
            >
              <Ionicons name="settings-outline" size={24} color={Colors.text} />
              <Text style={styles.menuItemText}>Quality</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMoreMenu(false);
              }}
            >
              <Ionicons name="text-outline" size={24} color={Colors.text} />
              <Text style={styles.menuItemText}>Subtitles</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMoreMenu(false);
                setShowSleepTimer(true);
              }}
            >
              <Ionicons name="timer-outline" size={24} color={Colors.text} />
              <Text style={styles.menuItemText}>Sleep Timer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMoreMenu(false);
              }}
            >
              <Ionicons name="share-outline" size={24} color={Colors.text} />
              <Text style={styles.menuItemText}>Share</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Sleep Timer Modal */}
      <SleepTimerModal
        visible={showSleepTimer}
        onClose={() => setShowSleepTimer(false)}
        onTimerSet={(minutes) => console.log(`Sleep timer set for ${minutes} minutes`)}
      />
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(36, 36, 36, 0.8)',
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
    backgroundColor: 'rgba(36, 36, 36, 0.8)',
    borderRadius: 28,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
  },
  bottomBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
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
    backgroundColor: 'rgba(36, 36, 36, 0.8)',
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
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 6,
  },
  sleepTimerText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 15, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedMenu: {
    width: '80%',
    maxWidth: 320,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  menuTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  speedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  speedOptionActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: Colors.primary,
  },
  speedOptionText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  speedOptionTextActive: {
    fontWeight: '700',
    color: Colors.primary,
  },
  moreMenu: {
    width: '85%',
    maxWidth: 380,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.primary,
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
    fontWeight: '500',
  },
});
