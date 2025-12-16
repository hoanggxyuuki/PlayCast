import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import { useSettings } from '../../contexts/SettingsContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DOUBLE_TAP_DELAY = 300;
const MIN_SWIPE_DISTANCE = 50;

interface GestureControlsProps {
  onSeek?: (seconds: number) => void;
  onVolumeChange?: (delta: number) => void;
  onBrightnessChange?: (delta: number) => void;
  onSingleTap?: () => void;
  children?: React.ReactNode;
}

export const GestureControls: React.FC<GestureControlsProps> = ({
  onSeek,
  onVolumeChange,
  onBrightnessChange,
  onSingleTap,
  children,
}) => {
  const { settings } = useSettings();

  const [showSeekIndicator, setShowSeekIndicator] = useState(false);
  const [seekAmount, setSeekAmount] = useState(0);
  const [showVolumeIndicator, setShowVolumeIndicator] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(50);
  const [showBrightnessIndicator, setShowBrightnessIndicator] = useState(false);
  const [brightnessLevel, setBrightnessLevel] = useState(50);

  const lastTap = useRef<number>(0);
  const lastTapPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const indicatorOpacity = useRef(new Animated.Value(0)).current;
  const startY = useRef<number>(0);
  const startX = useRef<number>(0);
  const isVerticalGesture = useRef<boolean>(false);
  const isHorizontalGesture = useRef<boolean>(false);
  const doubleTapDetected = useRef<boolean>(false);

  const showIndicator = () => {
    Animated.sequence([
      Animated.timing(indicatorOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(1000),
      Animated.timing(indicatorOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleDoubleTap = (x: number) => {
    if (!settings.gestureControls) return;
    doubleTapDetected.current = true;

    const seekSeconds = settings.doubleTapSeek || 10;

    if (x < SCREEN_WIDTH / 2) {
      setSeekAmount(-seekSeconds);
      onSeek?.(-seekSeconds);
    } else {
      setSeekAmount(seekSeconds);
      onSeek?.(seekSeconds);
    }

    setShowSeekIndicator(true);
    showIndicator();
    setTimeout(() => setShowSeekIndicator(false), 1500);
  };

  const handleVerticalGesture = (dy: number, x: number) => {
    if (!settings.gestureControls) return;

    const delta = -dy / SCREEN_HEIGHT;

    if (x < SCREEN_WIDTH / 2) {
      if (!settings.brightnessGesture) return;

      const newBrightness = Math.max(0, Math.min(100, brightnessLevel + delta * 100));
      setBrightnessLevel(newBrightness);
      setShowBrightnessIndicator(true);
      onBrightnessChange?.(delta);
      setTimeout(() => setShowBrightnessIndicator(false), 1500);
    } else {
      if (!settings.volumeGesture) return;

      const newVolume = Math.max(0, Math.min(100, volumeLevel + delta * 100));
      setVolumeLevel(newVolume);
      setShowVolumeIndicator(true);
      onVolumeChange?.(delta);
      setTimeout(() => setShowVolumeIndicator(false), 1500);
    }
  };

  const handleHorizontalGesture = (dx: number) => {
    if (!settings.gestureControls) return;

    const seekSeconds = Math.round((dx / SCREEN_WIDTH) * 60);

    if (Math.abs(seekSeconds) >= 5) {
      setSeekAmount(seekSeconds);
      setShowSeekIndicator(true);
      onSeek?.(seekSeconds);
      setTimeout(() => setShowSeekIndicator(false), 1500);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },

      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        startX.current = locationX;
        startY.current = locationY;
        isVerticalGesture.current = false;
        isHorizontalGesture.current = false;
        doubleTapDetected.current = false;

        const now = Date.now();
        const timeDiff = now - lastTap.current;
        const distance = Math.sqrt(
          Math.pow(locationX - lastTapPosition.current.x, 2) +
          Math.pow(locationY - lastTapPosition.current.y, 2)
        );

        if (timeDiff < DOUBLE_TAP_DELAY && distance < 50) {
          handleDoubleTap(locationX);
          lastTap.current = 0;
        } else {
          lastTap.current = now;
          lastTapPosition.current = { x: locationX, y: locationY };
        }
      },

      onPanResponderMove: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const { dx, dy } = gestureState;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (!isVerticalGesture.current && !isHorizontalGesture.current) {
          if (absDy > absDx && absDy > 10) {
            isVerticalGesture.current = true;
          } else if (absDx > absDy && absDx > 10) {
            isHorizontalGesture.current = true;
          }
        }

        if (isVerticalGesture.current && absDy > MIN_SWIPE_DISTANCE) {
          handleVerticalGesture(dy, startX.current);
        }
      },

      onPanResponderRelease: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const { dx, dy } = gestureState;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (isHorizontalGesture.current && absDx > MIN_SWIPE_DISTANCE && absDy < 50) {
          handleHorizontalGesture(dx);
        }

        if (absDx < 10 && absDy < 10 && !doubleTapDetected.current) {
          setTimeout(() => {
            if (!doubleTapDetected.current) {
              console.log('[GestureControls] Single tap detected');
              onSingleTap?.();
            }
          }, DOUBLE_TAP_DELAY + 50);
        }

        isVerticalGesture.current = false;
        isHorizontalGesture.current = false;
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {children}

      {showSeekIndicator && (
        <Animated.View style={[styles.indicator, { opacity: indicatorOpacity }]}>
          <Ionicons
            name={seekAmount > 0 ? 'play-forward' : 'play-back'}
            size={40}
            color={Colors.primary}
          />
          <Text style={styles.indicatorText}>
            {seekAmount > 0 ? '+' : ''}
            {seekAmount}s
          </Text>
        </Animated.View>
      )}

      {showVolumeIndicator && (
        <Animated.View
          style={[styles.sideIndicator, styles.rightIndicator, { opacity: indicatorOpacity }]}
        >
          <Ionicons
            name={volumeLevel > 50 ? 'volume-high' : volumeLevel > 0 ? 'volume-medium' : 'volume-mute'}
            size={32}
            color={Colors.primary}
          />
          <View style={styles.levelBar}>
            <View style={[styles.levelFill, { height: `${volumeLevel}%` }]} />
          </View>
          <Text style={styles.levelText}>{Math.round(volumeLevel)}%</Text>
        </Animated.View>
      )}

      {showBrightnessIndicator && (
        <Animated.View
          style={[styles.sideIndicator, styles.leftIndicator, { opacity: indicatorOpacity }]}
        >
          <Ionicons
            name={brightnessLevel > 50 ? 'sunny' : 'sunny-outline'}
            size={32}
            color={Colors.primary}
          />
          <View style={styles.levelBar}>
            <View style={[styles.levelFill, { height: `${brightnessLevel}%` }]} />
          </View>
          <Text style={styles.levelText}>{Math.round(brightnessLevel)}%</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  indicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -60 }],
    backgroundColor: Colors.overlay,
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  indicatorText: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  sideIndicator: {
    position: 'absolute',
    top: '30%',
    backgroundColor: Colors.overlay,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    minWidth: 60,
  },
  leftIndicator: {
    left: Spacing.lg,
  },
  rightIndicator: {
    right: Spacing.lg,
  },
  levelBar: {
    width: 8,
    height: 100,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    marginVertical: Spacing.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  levelFill: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  levelText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
  },
});
