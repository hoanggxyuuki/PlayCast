// Simple Video Player with react-native-video for PiP and background audio
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Video, { OnBufferData, OnLoadData, VideoRef } from 'react-native-video';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import { VideoPlayerProps } from '../../types';

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ channel, onClose, onError }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const videoRef = useRef<VideoRef>(null);

  console.log('VideoPlayer mounting with channel:', channel.name, channel.url);

  const onVideoLoad = (data: OnLoadData) => {
    console.log('Player initialized, duration:', data.duration);
    setIsLoading(false);
  };

  const onVideoBuffer = (data: OnBufferData) => {
    setIsBuffering(data.isBuffering);
  };

  const onVideoError = (error: any) => {
    console.error('Failed to load video:', error);
    setIsLoading(false);
    setHasError(true);
    onError?.('Failed to load video');
  };

  if (hasError) {
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

      {/* Top controls row */}
      <View style={styles.topControls}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={32} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Channel info */}
      <View style={styles.header}>
        <Text style={styles.channelName} numberOfLines={1}>
          {channel.name}
        </Text>
        {channel.group && (
          <Text style={styles.channelGroup}>{channel.group}</Text>
        )}
      </View>

      {/* Video view with react-native-video - PiP and background audio enabled */}
      <Video
        ref={videoRef}
        source={{ uri: channel.url }}
        style={styles.video}
        resizeMode="contain"
        paused={!isPlaying}
        volume={1.0}
        muted={false}
        // PiP and background audio
        pictureInPicture={true}
        playInBackground={true}
        playWhenInactive={true}
        // Use native controls for simple player
        controls={true}
        // Callbacks
        onLoad={onVideoLoad}
        onBuffer={onVideoBuffer}
        onError={onVideoError}
      />

      {/* Loading overlay */}
      {(isLoading || isBuffering) && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            {isBuffering ? 'Buffering...' : 'Loading video...'}
          </Text>
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
  topControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
  },
  closeButton: {
    backgroundColor: Colors.overlay,
    borderRadius: 20,
    padding: 8,
  },
  header: {
    position: 'absolute',
    top: 110,
    left: 20,
    right: 20,
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
