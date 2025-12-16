
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
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
import { useTranslation } from '../../i18n/useTranslation';
import { getSoundCloudRelatedTracks, getYouTubeQualities, getYouTubeRelatedVideos, VideoQuality } from '../../services/AutoplayService';
import { DownloadService } from '../../services/downloadService';
import { OnlineSearchService, SoundCloudResult, YouTubeResult } from '../../services/OnlineSearchService';
import { SleepTimerService } from '../../services/sleepTimerService';
import { VideoPlayerProps } from '../../types';
import { GestureControls } from './GestureControls';
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
  const { t } = useTranslation();
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
  const [qualities, setQualities] = useState<VideoQuality[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>('auto');
  const [nextVideo, setNextVideo] = useState<YouTubeResult | SoundCloudResult | null>(null);
  const [showUpNext, setShowUpNext] = useState(false);
  const [upNextCountdown, setUpNextCountdown] = useState(5);


  type DisplayMode = 'video' | 'audio';
  const [displayMode, setDisplayMode] = useState<DisplayMode>('video');


  const [activeChannel, setActiveChannel] = useState(channel);


  const [internalLoopMode, setInternalLoopMode] = useState<'none' | 'one' | 'all'>(loopMode);
  const [internalShuffleMode, setInternalShuffleMode] = useState(shuffleMode);
  const [showQueueModal, setShowQueueModal] = useState(false);

  const { addToHistory, updateProgress } = useHistory();
  const { queue, playNext: queueNext, playPrevious: queuePrev, hasNext, hasPrevious, addToQueue, isInQueue, shuffleQueue, setCurrentIndex } = useQueue();
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();

  const videoRef = useRef<VideoRef>(null);
  const controlsTimeout = useRef<NodeJS.Timeout>();
  const progressInterval = useRef<NodeJS.Timeout>();
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const showControlsRef = useRef(true);
  const currentTimeRef = useRef(0);

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
    if (channel) {
      const isSoundCloud = channel.group?.toLowerCase() === 'soundcloud' || channel.url.includes('soundcloud');
      const isSpotify = channel.group?.toLowerCase() === 'spotify';
      const isAudioContent = isSoundCloud || isSpotify;
      setDisplayMode(isAudioContent ? 'audio' : 'video');
    }
  }, [channel]);

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

  useEffect(() => {
    if (settings.defaultPlaybackSpeed && settings.defaultPlaybackSpeed !== 1.0) {
      setPlaybackSpeed(settings.defaultPlaybackSpeed);
    }
  }, []);

  useEffect(() => {
    const fetchRelatedContent = async () => {
      if (!channel) return;

      const isYouTube = channel.group?.toLowerCase() === 'youtube' || channel.url.includes('googlevideo');
      const isSoundCloud = channel.group?.toLowerCase() === 'soundcloud' || channel.url.includes('soundcloud');

      try {
        if (isYouTube) {
          const videoId = channel.id.replace('youtube-', '');

          const quals = await getYouTubeQualities(videoId);
          console.log('[YouTube] Fetched qualities:', quals.length);
          if (quals.length > 0) {
            setQualities(quals);
            setCurrentQuality(quals[0].label);
          }

          if (settings.autoPlayNext) {
            const related = await getYouTubeRelatedVideos(videoId);
            if (related.length > 0) {
              setNextVideo(related[0]);
            }
          }
        } else if (isSoundCloud && settings.autoPlayNext) {
          const trackId = channel.id.replace('soundcloud-', '');
          const related = await getSoundCloudRelatedTracks(trackId);
          if (related.length > 0) {
            setNextVideo(related[0]);
          }
        }
      } catch (error) {
        console.log('Failed to fetch related content:', error);
      }
    };

    fetchRelatedContent();
  }, [channel]);

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
    currentTimeRef.current = data.currentTime;
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
    } else if (nextVideo && settings.autoPlayNext) {
      setShowUpNext(true);
      setUpNextCountdown(5);

      const countdown = setInterval(() => {
        setUpNextCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            playNextVideo();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const playNextVideo = async () => {
    if (!nextVideo) return;
    setShowUpNext(false);

    try {
      const isYouTube = 'videoId' in nextVideo;
      let streamUrl = '';
      let thumbnail = '';
      let title = '';

      if (isYouTube) {
        const ytVideo = nextVideo as YouTubeResult;
        streamUrl = await OnlineSearchService.getYouTubeStreamUrl(ytVideo.videoId);
        thumbnail = ytVideo.thumbnail;
        title = ytVideo.title;
      } else {
        const scTrack = nextVideo as SoundCloudResult;
        const scData = await OnlineSearchService.getSoundCloudStreamUrl(scTrack.id);
        streamUrl = scData.streamUrl;
        thumbnail = scTrack.thumbnail;
        title = scTrack.title;
      }

      const newChannel: Channel = {
        id: isYouTube ? `youtube-${(nextVideo as YouTubeResult).videoId}` : `soundcloud-${(nextVideo as SoundCloudResult).id}`,
        name: title,
        url: streamUrl,
        logo: thumbnail,
        group: isYouTube ? 'YouTube' : 'SoundCloud',
      };

      console.log('Auto-playing next:', newChannel.name);
    } catch (error) {
      console.error('Failed to play next video:', error);
    }
  };

  const cancelUpNext = () => {
    setShowUpNext(false);
    setIsPlaying(false);
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
    showControlsRef.current = false;
    setShowControls(false);
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const showControlsAnimated = () => {
    showControlsRef.current = true;
    setShowControls(true);
    controlsOpacity.setValue(1);
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
        setActiveChannel(prev);
        setCurrentTime(0);
        setIsLoading(true);
        setIsPlaying(true);
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
        setActiveChannel(next);
        setCurrentTime(0);
        setIsLoading(true);
        setIsPlaying(true);
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
      {displayMode === 'audio' && channel?.logo && (
        <View style={StyleSheet.absoluteFill}>
          <Image
            source={{ uri: activeChannel.logo }}
            style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
            blurRadius={50}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(30,20,10,0.4)', 'rgba(30,20,10,0.7)', 'rgba(20,15,10,0.95)']}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}

      {}
      <View style={[styles.videoContainer, displayMode === 'audio' && styles.hiddenVideo]}>
        <Video
          ref={videoRef}
          source={{ uri: activeChannel.url }}
          style={styles.video}
          resizeMode="contain"
          paused={!isPlaying}
          rate={playbackSpeed}
          volume={1.0}
          muted={false}
          repeat={loopMode === 'one'}
          audioOnly={displayMode === 'audio'}
          poster={activeChannel.logo}
          posterResizeMode="contain"
          pictureInPicture={true}
          playInBackground={true}
          playWhenInactive={true}
          controls={false}
          showNotificationControls={true}
          metadata={{
            title: activeChannel.name,
            artist: activeChannel.group || 'PlayCast',
            imageUri: activeChannel.logo,
          }}
          onLoad={onVideoLoad}
          onProgress={onVideoProgress}
          onBuffer={onVideoBuffer}
          onError={onVideoError}
          onEnd={onVideoEnd}
        />
      </View>

      {}
      {displayMode === 'audio' && channel?.logo && (
        <View style={styles.artworkSection}>
          <View style={styles.artworkContainer}>
            <Image
              source={{ uri: activeChannel.logo }}
              style={styles.artwork}
              resizeMode="cover"
            />
          </View>
        </View>
      )}

      {}
      <GestureControls
        onSeek={(seconds) => {
          const maxTime = duration > 0 ? duration : 999999;
          const newTime = Math.max(0, Math.min(maxTime, currentTimeRef.current + seconds));
          console.log(`[Seek] currentRef: ${currentTimeRef.current}, seconds: ${seconds}, newTime: ${newTime}, duration: ${duration}`);
          videoRef.current?.seek(newTime);
          currentTimeRef.current = newTime;
          setCurrentTime(newTime);
          showControlsAnimated();
        }}
        onVolumeChange={(delta) => console.log('Volume change:', delta)}
        onBrightnessChange={(delta) => console.log('Brightness change:', delta)}
        onSingleTap={() => {
          if (showControlsRef.current) {
            hideControls();
          } else {
            showControlsAnimated();
          }
        }}
      >
        <View style={styles.touchOverlay} />
      </GestureControls>

      {}
      {(isLoading || isBuffering) && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9500" />
        </View>
      )}

      {}
      <Animated.View
        style={[
          styles.controlsOverlay,
          { opacity: displayMode === 'audio' ? 1 : controlsOpacity },
          isLandscape && styles.controlsOverlayLandscape
        ]}
        pointerEvents={displayMode === 'audio' || showControls ? 'box-none' : 'none'}
      >
        {}
        <View style={[styles.topBar, { paddingTop: isLandscape ? 10 : insets.top + 10 }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>

          {}
          <View style={styles.sourceBadge}>
            <Ionicons
              name={activeChannel.group?.toLowerCase() === 'youtube' ? 'logo-youtube' : 'musical-notes'}
              size={16}
              color="#FF0000"
            />
            <Text style={styles.sourceText}>{activeChannel.group || 'PlayCast'}</Text>
          </View>

          {}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, displayMode === 'video' && styles.toggleBtnActive]}
              onPress={() => setDisplayMode('video')}
            >
              <Text style={[styles.toggleText, displayMode === 'video' && styles.toggleTextActive]}>Video</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, displayMode === 'audio' && styles.toggleBtnActive]}
              onPress={() => setDisplayMode('audio')}
            >
              <Text style={[styles.toggleText, displayMode === 'audio' && styles.toggleTextActive]}>{t('image')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {}
        {isLandscape && displayMode === 'audio' ? (
          <View style={styles.landscapeContent}>
            {}
            <View style={styles.landscapeArtwork}>
              {channel?.logo && (
                <Image
                  source={{ uri: channel.logo }}
                  style={styles.landscapeArtworkImage}
                  resizeMode="cover"
                />
              )}
            </View>

            {}
            <View style={styles.landscapeControls}>
              {}
              <Text style={styles.landscapeTitleText} numberOfLines={1}>{activeChannel.name}</Text>
              <Text style={styles.landscapeArtistText} numberOfLines={1}>{activeChannel.group || 'Unknown Artist'}</Text>

              {}
              <View style={styles.landscapeProgress}>
                <Text style={styles.landscapeTimeText}>{formatTime(currentTime)}</Text>
                <Slider
                  style={styles.landscapeSlider}
                  minimumValue={0}
                  maximumValue={duration || 100}
                  value={currentTime}
                  onValueChange={handleSeek}
                  minimumTrackTintColor="#FF9500"
                  maximumTrackTintColor="rgba(255,255,255,0.3)"
                  thumbTintColor="#FF9500"
                />
                <Text style={styles.landscapeTimeText}>{formatTime(duration)}</Text>
              </View>

              {}
              <View style={styles.landscapeMainControls}>
                <TouchableOpacity onPress={handlePrevious} disabled={!onPrevious && !hasPrevious()}>
                  <Ionicons name="play-back" size={28} color={!onPrevious && !hasPrevious() ? 'rgba(255,255,255,0.3)' : '#FF9500'} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.landscapePlayBtn} onPress={togglePlayPause}>
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#1a1a1a" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleNext} disabled={!onNext && !hasNext()}>
                  <Ionicons name="play-forward" size={28} color={!onNext && !hasNext() ? 'rgba(255,255,255,0.3)' : '#FF9500'} />
                </TouchableOpacity>
              </View>
            </View>

            {}
            <TouchableOpacity style={styles.landscapeExitBtn} onPress={toggleOrientation}>
              <Ionicons name="contract" size={24} color="white" />
            </TouchableOpacity>
          </View>
        ) : isLandscape && displayMode === 'video' ? (

          <>
            <View style={{ flex: 1 }} />
            <View style={styles.landscapeVideoControls}>
              {}
              <Text style={styles.landscapeTimeText}>{formatTime(currentTime)}</Text>
              <Slider
                style={styles.landscapeVideoSlider}
                minimumValue={0}
                maximumValue={duration || 100}
                value={currentTime}
                onValueChange={handleSeek}
                minimumTrackTintColor="#FF9500"
                maximumTrackTintColor="rgba(255,255,255,0.3)"
                thumbTintColor="#FF9500"
              />
              <Text style={styles.landscapeTimeText}>{formatTime(duration)}</Text>

              {}
              <TouchableOpacity style={styles.landscapeVideoPlayBtn} onPress={togglePlayPause}>
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="white" />
              </TouchableOpacity>

              {}
              <TouchableOpacity onPress={toggleOrientation}>
                <Ionicons name="contract" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </>
        ) : (

          <>
            {displayMode === 'video' && <View style={{ flex: 1 }} />}

            <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 20 }]}>
              {}
              <View style={styles.trackInfo}>
                <View style={styles.trackTitleRow}>
                  <Text style={styles.trackTitle} numberOfLines={1}>{activeChannel.name}</Text>
                  <View style={styles.trackActions}>
                    <TouchableOpacity
                      style={styles.trackActionBtn}
                      onPress={() => {
                        if (!isInQueue(activeChannel.id)) {
                          addToQueue(activeChannel);
                        }
                      }}
                    >
                      <Ionicons
                        name={isInQueue(activeChannel.id) ? "checkmark-circle" : "add-circle-outline"}
                        size={28}
                        color={isInQueue(activeChannel.id) ? "#FF9500" : "rgba(255,255,255,0.7)"}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.trackActionBtn} onPress={() => setShowMoreMenu(true)}>
                      <Ionicons name="ellipsis-horizontal" size={24} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.trackArtist} numberOfLines={1}>{activeChannel.group || 'Unknown Artist'}</Text>
              </View>

              {}
              <View style={styles.progressSection}>
                <Slider
                  style={styles.progressSlider}
                  minimumValue={0}
                  maximumValue={duration || 100}
                  value={currentTime}
                  onValueChange={handleSeek}
                  minimumTrackTintColor="#FF9500"
                  maximumTrackTintColor="rgba(255,255,255,0.3)"
                  thumbTintColor="#FF9500"
                />
                <View style={styles.timeRow}>
                  <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                  <Text style={styles.timeText}>-{formatTime(duration - currentTime)}</Text>
                </View>
              </View>

              {}
              <View style={styles.mainControls}>
                <TouchableOpacity
                  style={styles.shuffleBtn}
                  onPress={() => {
                    if (onShuffleModeChange) {
                      onShuffleModeChange(!shuffleMode);
                    } else {
                      const newShuffle = !internalShuffleMode;
                      setInternalShuffleMode(newShuffle);
                      if (newShuffle && queue.length > 1) {
                        shuffleQueue();
                      }
                    }
                  }}
                >
                  <Ionicons name="shuffle" size={24} color={(shuffleMode || internalShuffleMode) ? '#FF9500' : 'rgba(255,255,255,0.6)'} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipBtn}
                  onPress={handlePrevious}
                  disabled={!onPrevious && !hasPrevious()}
                >
                  <Ionicons name="play-back" size={36} color={!onPrevious && !hasPrevious() ? 'rgba(255,255,255,0.3)' : '#FF9500'} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.playBtn} onPress={togglePlayPause}>
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={36} color="#1a1a1a" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipBtn}
                  onPress={handleNext}
                  disabled={!onNext && !hasNext()}
                >
                  <Ionicons name="play-forward" size={36} color={!onNext && !hasNext() ? 'rgba(255,255,255,0.3)' : '#FF9500'} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.repeatBtn}
                  onPress={() => {
                    const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
                    if (onLoopModeChange) {
                      const currentIdx = modes.indexOf(loopMode);
                      const nextMode = modes[(currentIdx + 1) % modes.length];
                      onLoopModeChange(nextMode);
                    } else {
                      const currentIdx = modes.indexOf(internalLoopMode);
                      const nextMode = modes[(currentIdx + 1) % modes.length];
                      setInternalLoopMode(nextMode);
                    }
                  }}
                >
                  <Ionicons
                    name="repeat"
                    size={24}
                    color={(loopMode !== 'none' || internalLoopMode !== 'none') ? '#FF9500' : 'rgba(255,255,255,0.6)'}
                  />
                  {(loopMode === 'one' || internalLoopMode === 'one') && <Text style={styles.repeatOneText}>1</Text>}
                </TouchableOpacity>
              </View>

              {}
              <View style={styles.secondaryActions}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowQueueModal(true)}>
                  <Ionicons name="list" size={22} color={queue.length > 0 ? '#FF9500' : 'rgba(255,255,255,0.6)'} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowSpeedMenu(true)}>
                  <Text style={styles.speedBtnText}>{playbackSpeed}x</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={toggleOrientation}>
                  <Ionicons name="expand" size={22} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowSleepTimer(true)}>
                  <Ionicons name="moon-outline" size={22} color={sleepTimerRemaining ? '#FF9500' : 'rgba(255,255,255,0.6)'} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </Animated.View>

      { }
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

      { }
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

            {qualities.length > 0 && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMoreMenu(false);
                  Alert.alert(
                    'Video Quality',
                    'Select quality:',
                    [
                      ...qualities.map((q) => ({
                        text: q.label,
                        onPress: () => {
                          setCurrentQuality(q.label);
                          console.log('Changed quality to:', q.label, q.url);
                        },
                      })),
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                }}
              >
                <Ionicons name="settings-outline" size={24} color={Colors.text} />
                <Text style={styles.menuItemText}>Quality ({currentQuality})</Text>
              </TouchableOpacity>
            )}

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

      { }
      <SleepTimerModal
        visible={showSleepTimer}
        onClose={() => setShowSleepTimer(false)}
        onTimerSet={(minutes) => console.log(`Sleep timer set for ${minutes} minutes`)}
      />

      {}
      <Modal
        visible={showQueueModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQueueModal(false)}
      >
        <View style={styles.queueModalContainer}>
          <View style={styles.queueModalContent}>
            <View style={styles.queueModalHeader}>
              <Text style={styles.queueModalTitle}>Queue ({queue.length})</Text>
              <TouchableOpacity onPress={() => setShowQueueModal(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {queue.length === 0 ? (
              <View style={styles.queueEmptyState}>
                <Ionicons name="musical-notes-outline" size={48} color="rgba(255,255,255,0.3)" />
                <Text style={styles.queueEmptyText}>Queue is empty</Text>
                <Text style={styles.queueEmptySubtext}>Add tracks using the + button</Text>
              </View>
            ) : (
              <FlatList
                data={queue}
                keyExtractor={(item) => `${item.channel.id}-${item.position}`}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[styles.queueItem, activeChannel.id === item.channel.id && styles.queueItemActive]}
                    onPress={() => {
                      setCurrentIndex(index);
                      setActiveChannel(item.channel);
                      setCurrentTime(0);
                      setIsLoading(true);
                      setIsPlaying(true);
                      setShowQueueModal(false);
                    }}
                  >
                    {item.channel.logo ? (
                      <Image source={{ uri: item.channel.logo }} style={styles.queueItemThumb} />
                    ) : (
                      <View style={[styles.queueItemThumb, styles.queueItemThumbPlaceholder]}>
                        <Ionicons name="musical-note" size={18} color="#FF9500" />
                      </View>
                    )}
                    <View style={styles.queueItemInfo}>
                      <Text style={styles.queueItemTitle} numberOfLines={1}>{item.channel.name}</Text>
                      <Text style={styles.queueItemArtist} numberOfLines={1}>{item.channel.group || 'Unknown'}</Text>
                    </View>
                    {activeChannel.id === item.channel.id && (
                      <Ionicons name="volume-high" size={18} color="#FF9500" />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      { }
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

      {showUpNext && nextVideo && (
        <View style={styles.upNextOverlay}>
          <View style={styles.upNextCard}>
            <Text style={styles.upNextLabel}>Up Next in {upNextCountdown}s</Text>
            <View style={styles.upNextContent}>
              <Image
                source={{ uri: 'videoId' in nextVideo ? nextVideo.thumbnail : (nextVideo as SoundCloudResult).thumbnail }}
                style={styles.upNextThumb}
              />
              <View style={styles.upNextInfo}>
                <Text style={styles.upNextTitle} numberOfLines={2}>
                  {'videoId' in nextVideo ? nextVideo.title : (nextVideo as SoundCloudResult).title}
                </Text>
                <Text style={styles.upNextArtist} numberOfLines={1}>
                  {'videoId' in nextVideo ? nextVideo.author : (nextVideo as SoundCloudResult).artist}
                </Text>
              </View>
            </View>
            <View style={styles.upNextButtons}>
              <TouchableOpacity style={styles.upNextCancelBtn} onPress={cancelUpNext}>
                <Text style={styles.upNextCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.upNextPlayBtn} onPress={playNextVideo}>
                <Ionicons name="play" size={18} color="#fff" />
                <Text style={styles.upNextPlayText}>Play Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  videoContainer: {
    flex: 1,
  },
  hiddenVideo: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  video: {
    flex: 1,
    width: '100%',
  },
  touchOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  artworkSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  artworkContainer: {
    width: Dimensions.get('window').width * 0.85,
    height: Dimensions.get('window').width * 0.85,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 20,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 50,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  closeButton: {
    padding: 8,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  sourceText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 17,
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(80,80,80,0.8)',
  },
  toggleText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: 'white',
  },
  bottomSection: {
    paddingHorizontal: 24,
  },
  trackInfo: {
    marginBottom: 20,
  },
  trackTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackTitle: {
    flex: 1,
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  trackActions: {
    flexDirection: 'row',
    gap: 8,
  },
  trackActionBtn: {
    padding: 4,
  },
  trackArtist: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    marginTop: 4,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressSlider: {
    width: '100%',
    height: 40,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  timeText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  shuffleBtn: {
    padding: 8,
  },
  skipBtn: {
    padding: 8,
  },
  playBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  repeatBtn: {
    padding: 8,
    position: 'relative',
  },
  repeatOneText: {
    position: 'absolute',
    top: 0,
    right: 0,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
  },
  secondaryBtn: {
    padding: 12,
  },
  speedBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },

  controlsOverlayLandscape: {
    flexDirection: 'column',
  },
  landscapeContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    gap: 40,
  },
  landscapeArtwork: {
    width: 180,
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
  },
  landscapeArtworkImage: {
    width: '100%',
    height: '100%',
  },
  landscapeControls: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  landscapeTitleText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  landscapeArtistText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginBottom: 15,
  },
  landscapeProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  landscapeSlider: {
    flex: 1,
    height: 30,
  },
  landscapeTimeText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    width: 40,
  },
  landscapeMainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
  },
  landscapePlayBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  landscapeExitBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  landscapeVideoControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    gap: 15,
  },
  landscapeVideoSlider: {
    flex: 1,
    height: 30,
  },
  landscapeVideoPlayBtn: {
    padding: 8,
  },

  queueModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  queueModalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 30,
  },
  queueModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  queueModalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  queueEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  queueEmptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    marginTop: 12,
  },
  queueEmptySubtext: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    marginTop: 6,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
  },
  queueItemActive: {
    backgroundColor: 'rgba(255,149,0,0.15)',
  },
  queueItemThumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  queueItemThumbPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  queueItemInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  queueItemTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
  },
  queueItemArtist: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginTop: 2,
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
  upNextOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  upNextCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: Spacing.lg,
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  upNextLabel: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  upNextContent: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  upNextThumb: {
    width: 120,
    height: 68,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  upNextInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  upNextTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  upNextArtist: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  upNextButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  upNextCancelBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  upNextCancelText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  upNextPlayBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  upNextPlayText: {
    fontSize: FontSizes.md,
    color: '#fff',
    fontWeight: '600',
  },
});
