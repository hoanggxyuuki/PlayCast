// Mini Player Component - Floating draggable video player
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Shadows, Spacing } from '../../constants/theme';
import { useMiniPlayer } from '../../contexts/MiniPlayerContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const MINI_PLAYER_WIDTH = 160;
const MINI_PLAYER_HEIGHT = 90;
const PADDING = 16;

export const MiniPlayer = () => {
  const { miniPlayer, hideMiniPlayer, togglePlayback, expandPlayer } = useMiniPlayer();

  // Track position for snapping
  const [position, setPosition] = useState({
    x: SCREEN_WIDTH - MINI_PLAYER_WIDTH - PADDING,
    y: SCREEN_HEIGHT - MINI_PLAYER_HEIGHT - PADDING - 100,
  });

  const pan = useRef(new Animated.ValueXY(position)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: position.x,
          y: position.y,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();

        // Calculate final position
        let finalX = position.x + gesture.dx;
        let finalY = position.y + gesture.dy;

        // Keep within bounds
        if (finalX < PADDING) finalX = PADDING;
        if (finalX > SCREEN_WIDTH - MINI_PLAYER_WIDTH - PADDING)
          finalX = SCREEN_WIDTH - MINI_PLAYER_WIDTH - PADDING;
        if (finalY < PADDING) finalY = PADDING;
        if (finalY > SCREEN_HEIGHT - MINI_PLAYER_HEIGHT - PADDING - 100)
          finalY = SCREEN_HEIGHT - MINI_PLAYER_HEIGHT - PADDING - 100;

        setPosition({ x: finalX, y: finalY });

        Animated.spring(pan, {
          toValue: { x: finalX, y: finalY },
          useNativeDriver: false,
          friction: 7,
        }).start();
      },
    })
  ).current;

  if (!miniPlayer.isVisible || !miniPlayer.channel) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={styles.videoContainer}
        activeOpacity={0.9}
        onPress={expandPlayer}
      >
        {miniPlayer.channel.logo && (
          <Image
            source={{ uri: miniPlayer.channel.logo }}
            style={styles.backgroundLogo}
            blurRadius={10}
          />
        )}

        <View style={styles.overlay}>
          <Ionicons
            name={miniPlayer.isPlaying ? 'pause' : 'play'}
            size={32}
            color={Colors.text}
            style={styles.playIcon}
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.channelName} numberOfLines={1}>
            {miniPlayer.channel.name}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={(e) => {
            e.stopPropagation();
            togglePlayback();
          }}
        >
          <Ionicons
            name={miniPlayer.isPlaying ? 'pause' : 'play'}
            size={20}
            color={Colors.text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={(e) => {
            e.stopPropagation();
            hideMiniPlayer();
          }}
        >
          <Ionicons name="close" size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: MINI_PLAYER_WIDTH,
    height: MINI_PLAYER_HEIGHT,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundCard,
    ...Shadows.lg,
    zIndex: 9999,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    position: 'relative',
  },
  backgroundLogo: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playIcon: {
    opacity: 0.8,
  },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: Spacing.xs,
  },
  channelName: {
    fontSize: FontSizes.xs,
    color: Colors.text,
    fontWeight: '600',
  },
  controls: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  controlButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
