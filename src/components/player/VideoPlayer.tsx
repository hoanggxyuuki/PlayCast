// Simplified Video Player with loading state
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import { VideoPlayerProps } from '../../types';

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ channel, onClose, onError }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  console.log('VideoPlayer mounting with channel:', channel.name, channel.url);

  // Simple player initialization with PiP and background audio support
  let player;
  try {
    player = useVideoPlayer(channel.url, (p) => {
      console.log('Player initialized');
      // Ensure audio is enabled
      p.volume = 1;
      p.muted = false;
      // Enable background playback and Now Playing notification
      p.showNowPlayingNotification = true;
      p.staysActiveInBackground = true;
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
        // Check if video is loading or playing
        if (player.status === 'readyToPlay' || player.status === 'idle') {
          setIsLoading(false);
        }

        if (player.status === 'error') {
          setIsLoading(false);
          setHasError(true);
          onError?.('Failed to load video');
        }

        setIsPlaying(player.playing);
      } catch (err) {
        console.error('Error checking player status:', err);
      }
    }, 500);

    // Set timeout to hide loading after 5 seconds regardless
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [player]);

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

      {/* Simple close button */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close" size={32} color={Colors.text} />
      </TouchableOpacity>

      {/* Channel info */}
      <View style={styles.header}>
        <Text style={styles.channelName} numberOfLines={1}>
          {channel.name}
        </Text>
        {channel.group && (
          <Text style={styles.channelGroup}>{channel.group}</Text>
        )}
      </View>

      {/* Video view with PiP enabled */}
      <VideoView
        player={player}
        style={styles.video}
        nativeControls={true}
        contentFit="contain"
        allowsPictureInPicture={true}
      />

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading video...</Text>
          <Text style={styles.loadingSubtext}>Please wait</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  video: {
    flex: 1,
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 100,
    backgroundColor: Colors.overlay,
    borderRadius: 20,
    padding: 8,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 80,
    zIndex: 100,
    backgroundColor: Colors.overlay,
    padding: 12,
    borderRadius: 8,
  },
  channelName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  channelGroup: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
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
  loadingSubtext: {
    marginTop: Spacing.xs,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
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
