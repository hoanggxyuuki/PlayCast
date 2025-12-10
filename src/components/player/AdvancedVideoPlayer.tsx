
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  Share,
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
import { DownloadService } from '../../services/downloadService';
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
  loopMode = 'none',
  shuffleMode = false,
  onLoopModeChange,
  onShuffleModeChange,
  playlistInfo,
}) => {

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
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showQualityMenu, setShowQualityMenu] = useState(false);


  const { addToHistory, updateProgress } = useHistory();
  const { playNext: queueNext, playPrevious: queuePrev, hasNext, hasPrevious } = useQueue();
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();


  const videoRef = useRef<VideoRef>(null);
  const controlsTimeout = useRef<NodeJS.Timeout>();
  const progressInterval = useRef<NodeJS.Timeout>();
  const controlsOpacity = useRef(new Animated.Value(1)).current;


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


  useEffect(() => {
    if (showControls && isPlaying) {
      resetControlsTimeout();
    }
  }, [showControls, isPlaying]);


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


  const onVideoLoad = (data: OnLoadData) => {
    console.log('Video loaded:', data.duration);
    setIsLoading(false);
    setDuration(data.duration);


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

    if (loopMode === 'one') {

      videoRef.current?.seek(0);
      setIsPlaying(true);
      return;
    }


    if (onNext) {

      onNext();
    } else if (hasNext()) {
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

    controlsOpacity.setValue(1);
    setShowControls(true);
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

      {}
      <View style={styles.videoContainer}>
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

          audioOnly={channel.url.includes('soundcloud') || channel.group?.toLowerCase() === 'soundcloud'}
          poster={channel.logo}
          posterResizeMode="contain"

          pictureInPicture={true}
          playInBackground={true}
          playWhenInactive={true}

          controls={false}
          showNotificationControls={true}
          metadata={{
            title: channel.name,
            artist: channel.group || 'PlayCast',
            imageUri: channel.logo,
          }}

          onLoad={onVideoLoad}
          onProgress={onVideoProgress}
          onBuffer={onVideoBuffer}
          onError={onVideoError}
          onEnd={onVideoEnd}
        />

        {}
        {channel.logo && (channel.url.includes('soundcloud') || channel.group?.toLowerCase() === 'soundcloud') && (
          <View style={styles.audioArtworkContainer}>
            <Image
              source={{ uri: channel.logo }}
              style={styles.audioArtwork}
              blurRadius={20}
            />
            <View style={styles.audioArtworkOverlay} />
            <Image
              source={{ uri: channel.logo }}
              style={styles.audioArtworkMain}
              resizeMode="contain"
            />
          </View>
        )}
      </View>

      {}
      <TouchableOpacity
        style={styles.touchOverlay}
        activeOpacity={1}
        onPress={() => {
          console.log('[Controls] Tap detected, showControls:', showControls);
          if (showControls) {
            console.log('[Controls] Hiding controls...');
            hideControls();
          } else {
            console.log('[Controls] Showing controls...');
            showControlsAnimated();
          }
        }}
      />

      {}
      {
        (isLoading || isBuffering) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>
              {isBuffering ? 'Buffering...' : 'Loading video...'}
            </Text>
          </View>
        )
      }

      {}
      {
        showControls && (
          <Animated.View style={[styles.controlsContainer, { opacity: controlsOpacity }]}>
            {}
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

            {}
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

            {}
            <View style={[styles.bottomBar, { paddingBottom: isLandscape ? Spacing.md : insets.bottom + Spacing.md }]}>
              {}
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

              {}
              <View style={styles.bottomControls}>
                {}
                {onShuffleModeChange && (
                  <TouchableOpacity
                    style={styles.modeButton}
                    onPress={() => onShuffleModeChange(!shuffleMode)}
                  >
                    <Ionicons
                      name="shuffle"
                      size={22}
                      color={shuffleMode ? Colors.primary : Colors.textSecondary}
                    />
                  </TouchableOpacity>
                )}

                {}
                {playlistInfo && playlistInfo.total > 1 && (
                  <View style={styles.playlistInfoContainer}>
                    <Text style={styles.playlistInfoText}>
                      {playlistInfo.current} / {playlistInfo.total}
                    </Text>
                  </View>
                )}

                {}
                {onLoopModeChange && (
                  <TouchableOpacity
                    style={styles.modeButton}
                    onPress={() => {
                      const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
                      const currentIndex = modes.indexOf(loopMode);
                      const nextMode = modes[(currentIndex + 1) % modes.length];
                      onLoopModeChange(nextMode);
                    }}
                  >
                    <Ionicons
                      name={loopMode === 'one' ? 'repeat-outline' : 'repeat'}
                      size={22}
                      color={loopMode !== 'none' ? Colors.primary : Colors.textSecondary}
                    />
                    {loopMode === 'one' && (
                      <Text style={styles.loopOneIndicator}>1</Text>
                    )}
                  </TouchableOpacity>
                )}

                {}
                {sleepTimerRemaining && (
                  <View style={styles.sleepTimerIndicator}>
                    <Ionicons name="moon" size={16} color={Colors.primary} />
                    <Text style={styles.sleepTimerText}>{sleepTimerRemaining}</Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>
        )
      }

      {}
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

      {}
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
                setShowQualityMenu(true);
              }}
            >
              <Ionicons name="speedometer-outline" size={24} color={Colors.text} />
              <Text style={styles.menuItemText}>Speed ({playbackSpeed}x)</Text>
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
              onPress={async () => {
                setShowMoreMenu(false);
                try {
                  await Share.share({
                    message: `Check out "${channel.name}" on PlayCast!\n${channel.url}`,
                    title: channel.name,
                  });
                } catch (error) {
                  console.error('Share error:', error);
                }
              }}
            >
              <Ionicons name="share-outline" size={24} color={Colors.text} />
              <Text style={styles.menuItemText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={async () => {
                setShowMoreMenu(false);


                const isHLSStream = channel.url.includes('.m3u8') ||
                  channel.url.includes('/hls/') ||
                  channel.url.includes('m3u8');

                if (isHLSStream && !isDownloading) {
                  Alert.alert(
                    'Download Not Supported',
                    'This is a live stream (HLS) and cannot be downloaded. Only direct video files (MP4, MP3, etc.) can be downloaded.',
                    [{ text: 'OK' }]
                  );
                  return;
                }

                if (isDownloading) {
                  await DownloadService.cancelDownload(channel.id);
                  setIsDownloading(false);
                  setDownloadProgress(0);
                } else {
                  setIsDownloading(true);
                  const unsubscribe = DownloadService.onProgress(channel.id, (progress) => {
                    setDownloadProgress(progress.progress);
                    if (progress.status === 'completed') {
                      setIsDownloading(false);
                      setDownloadProgress(0);
                      Alert.alert('Download Complete', `"${channel.name}" has been downloaded successfully!`);
                    } else if (progress.status === 'failed') {
                      setIsDownloading(false);
                      setDownloadProgress(0);
                      Alert.alert('Download Failed', 'Could not download this video. The stream format may not be supported.');
                    }
                  });
                  try {
                    await DownloadService.startDownload(
                      channel.id,
                      channel.name,
                      channel.group || 'Unknown',
                      channel.logo || '',
                      duration,
                      'local',
                      channel.url,
                      'video/mp4'
                    );
                  } catch (error) {
                    console.error('Download failed:', error);
                    setIsDownloading(false);
                    Alert.alert('Download Failed', 'Could not download this video.');
                  }
                }
              }}
            >
              <Ionicons
                name={isDownloading ? "close-circle-outline" : "download-outline"}
                size={24}
                color={isDownloading ? Colors.error : Colors.text}
              />
              <Text style={[styles.menuItemText, isDownloading && { color: Colors.error }]}>
                {isDownloading ? `Cancel (${Math.round(downloadProgress * 100)}%)` : 'Download'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {}
      <SleepTimerModal
        visible={showSleepTimer}
        onClose={() => setShowSleepTimer(false)}
        onTimerSet={(minutes) => console.log(`Sleep timer set for ${minutes} minutes`)}
      />

      {}
      <Modal
        visible={showQualityMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQualityMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowQualityMenu(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.moreMenu}
          >
            <Text style={styles.menuTitle}>Playback Speed</Text>
            {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[styles.menuItem, playbackSpeed === speed && { backgroundColor: 'rgba(118, 75, 162, 0.3)' }]}
                onPress={() => {
                  setPlaybackSpeed(speed);
                  setShowQualityMenu(false);
                }}
              >
                <Ionicons
                  name={playbackSpeed === speed ? "checkmark-circle" : "speedometer-outline"}
                  size={24}
                  color={playbackSpeed === speed ? Colors.primary : Colors.text}
                />
                <Text style={[styles.menuItemText, playbackSpeed === speed && { color: Colors.primary }]}>
                  {speed === 1.0 ? 'Normal' : `${speed}x`}
                </Text>
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View >
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
  touchOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  audioArtworkContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  audioArtwork: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  audioArtworkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  audioArtworkMain: {
    width: 200,
    height: 200,
    borderRadius: 12,
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
  modeButton: {
    padding: Spacing.sm,
    position: 'relative',
  },
  playlistInfoContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  playlistInfoText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  loopOneIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
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
