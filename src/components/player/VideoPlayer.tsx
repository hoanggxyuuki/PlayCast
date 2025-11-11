// Professional Video Player with custom controls using expo-video
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Colors, Spacing, FontSizes } from '../../constants/theme';
import { VideoPlayerProps, PlayerState } from '../../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ channel, onClose, onError }) => {
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [controlsTimeoutId, setControlsTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    isPaused: true,
    isBuffering: true,
    currentTime: 0,
    duration: 0,
    volume: 1.0,
    isMuted: false,
    isFullscreen: true,
  });

  // Initialize video player with error handling
  const player = useVideoPlayer(channel.url, (player) => {
    try {
      player.loop = false;
      player.muted = false;
      player.play();
    } catch (err) {
      console.error('Error initializing player:', err);
      setError('Failed to initialize player');
    }
  });

  useEffect(() => {
    // Lock to landscape on mount
    const setupOrientation = async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        StatusBar.setHidden(true);
      } catch (err) {
        console.error('Error setting orientation:', err);
      }
    };

    setupOrientation();

    return () => {
      // Cleanup on unmount
      const cleanup = async () => {
        try {
          await ScreenOrientation.unlockAsync();
          StatusBar.setHidden(false);
        } catch (err) {
          console.error('Error unlocking orientation:', err);
        }
      };

      cleanup();

      if (controlsTimeoutId) {
        clearTimeout(controlsTimeoutId);
      }
    };
  }, []);

  // Monitor player status with safe property access
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        if (player && typeof player.playing !== 'undefined') {
          setPlayerState((prev) => ({
            ...prev,
            isPlaying: player.playing ?? false,
            isPaused: !player.playing ?? true,
            currentTime: player.currentTime ?? 0,
            duration: player.duration ?? 0,
            volume: player.volume ?? 1.0,
            isMuted: player.muted ?? false,
            isBuffering: player.status === 'loading',
          }));
        }
      } catch (err) {
        console.error('Error updating player state:', err);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [player]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls && playerState.isPlaying) {
      if (controlsTimeoutId) {
        clearTimeout(controlsTimeoutId);
      }

      const timeoutId = setTimeout(() => {
        setShowControls(false);
      }, 3000);

      setControlsTimeoutId(timeoutId);
    }

    return () => {
      if (controlsTimeoutId) {
        clearTimeout(controlsTimeoutId);
      }
    };
  }, [showControls, playerState.isPlaying]);

  // Handle player errors
  useEffect(() => {
    try {
      if (player && player.status === 'error') {
        const errorMessage = 'Failed to load video stream';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } catch (err) {
      console.error('Error checking player status:', err);
    }
  }, [player?.status]);

  const handlePlayPause = useCallback(() => {
    try {
      if (!player) return;

      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch (err) {
      console.error('Error toggling play/pause:', err);
      setError('Failed to control playback');
    }
  }, [player]);

  const handleMuteUnmute = useCallback(() => {
    try {
      if (!player) return;

      player.muted = !player.muted;
      setPlayerState((prev) => ({ ...prev, isMuted: player.muted }));
    } catch (err) {
      console.error('Error toggling mute:', err);
    }
  }, [player]);

  const handleReload = useCallback(() => {
    try {
      if (!player) return;

      setError(null);
      player.replace(channel.url);
      player.play();
    } catch (err) {
      console.error('Error reloading video:', err);
      setError('Failed to reload stream');
    }
  }, [player, channel.url]);

  const toggleControls = useCallback(() => {
    setShowControls((prev) => !prev);
  }, []);

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.videoContainer}
        activeOpacity={1}
        onPress={toggleControls}
      >
        <VideoView
          player={player}
          style={styles.video}
          nativeControls={false}
          contentFit="contain"
          allowsPictureInPicture={false}
        />

        {/* Buffering Indicator */}
        {playerState.isBuffering && !error && (
          <View style={styles.bufferingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.bufferingText}>Loading...</Text>
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.reloadButton} onPress={handleReload}>
              <Ionicons name="reload" size={24} color={Colors.text} />
              <Text style={styles.reloadButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButtonAlt} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Controls Overlay */}
        {showControls && !error && (
          <View style={styles.controlsOverlay}>
            {/* Top Bar */}
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="arrow-back" size={28} color={Colors.text} />
              </TouchableOpacity>
              <View style={styles.channelInfo}>
                <Text style={styles.channelName} numberOfLines={1}>
                  {channel.name}
                </Text>
                {channel.group && (
                  <Text style={styles.channelGroup} numberOfLines={1}>
                    {channel.group}
                  </Text>
                )}
              </View>
            </View>

            {/* Center Controls */}
            <View style={styles.centerControls}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={handlePlayPause}
              >
                <Ionicons
                  name={playerState.isPlaying ? 'pause' : 'play'}
                  size={64}
                  color={Colors.text}
                />
              </TouchableOpacity>
            </View>

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>
                  {formatTime(playerState.currentTime)}
                </Text>
                {playerState.duration > 0 && (
                  <>
                    <Text style={styles.timeSeparator}>/</Text>
                    <Text style={styles.timeText}>
                      {formatTime(playerState.duration)}
                    </Text>
                  </>
                )}
              </View>

              <View style={styles.bottomControls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={handleMuteUnmute}
                >
                  <Ionicons
                    name={playerState.isMuted ? 'volume-mute' : 'volume-high'}
                    size={24}
                    color={Colors.text}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={handleReload}
                >
                  <Ionicons name="reload" size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  bufferingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.overlay,
  },
  bufferingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.overlay,
    padding: Spacing.xl,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    textAlign: 'center',
  },
  reloadButton: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  reloadButtonText: {
    marginLeft: Spacing.sm,
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '600',
  },
  closeButtonAlt: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  closeButtonText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlayLight,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  channelInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  channelName: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  channelGroup: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  centerControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    padding: Spacing.lg,
  },
  bottomBar: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  timeText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  timeSeparator: {
    marginHorizontal: Spacing.xs,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  controlButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.md,
  },
});
