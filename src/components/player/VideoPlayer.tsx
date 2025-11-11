// Simplified Video Player for debugging
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  StatusBar,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes } from '../../constants/theme';
import { VideoPlayerProps } from '../../types';

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ channel, onClose, onError }) => {
  const [hasError, setHasError] = useState(false);

  console.log('VideoPlayer mounting with channel:', channel.name, channel.url);

  // Simple player initialization
  let player;
  try {
    player = useVideoPlayer(channel.url, (p) => {
      console.log('Player initialized');
      p.play();
    });
  } catch (err) {
    console.error('Failed to create player:', err);
    setHasError(true);
  }

  if (hasError || !player) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>Failed to initialize player</Text>
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
        <Text style={styles.channelName}>{channel.name}</Text>
      </View>

      {/* Video view */}
      <VideoView
        player={player}
        style={styles.video}
        nativeControls={true}
        contentFit="contain"
      />
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
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
