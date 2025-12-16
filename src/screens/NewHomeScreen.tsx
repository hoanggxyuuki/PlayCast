
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Image,
    Keyboard,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdvancedVideoPlayer } from '../components/player/AdvancedVideoPlayer';
import { WebViewPlayer } from '../components/player/WebViewPlayer';
import { FadeInView } from '../components/ui/AnimatedComponents';
import { CarouselSlide, HeroCarousel } from '../components/ui/HeroCarousel';
import { BorderRadius, Colors, FontSizes, Gradients, Layout, Shadows, Spacing } from '../constants/theme';
import { useHistory } from '../contexts/HistoryContext';
import { usePlaylist } from '../contexts/PlaylistContext';
import { useQueue } from '../contexts/QueueContext';
import { useCustomTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../i18n/useTranslation';
import { DetectedLink, LinkDetectionService } from '../services/LinkDetectionService';
import { OnlineSearchService } from '../services/OnlineSearchService';
import { Channel } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.42;

interface NewHomeScreenProps {
    onNavigateToAddPlaylist: () => void;
    onNavigateToChannels: (playlistId: string) => void;
    onNavigateToLocalFiles?: () => void;
    onNavigateToOnline?: () => void;
    onNavigateToPremium?: () => void;
    onNavigateToLibrary?: () => void;
}

export const NewHomeScreen: React.FC<NewHomeScreenProps> = ({
    onNavigateToAddPlaylist,
    onNavigateToChannels,
    onNavigateToLocalFiles,
    onNavigateToOnline,
    onNavigateToPremium,
    onNavigateToLibrary,
}) => {
    const { playlists } = usePlaylist();
    const { getRecentlyWatched } = useHistory();
    const { currentItem } = useQueue();
    const { t } = useTranslation();
    const { currentTheme } = useCustomTheme();
    const themeColors = currentTheme.colors;

    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [showPlayer, setShowPlayer] = useState(false);
    const [showWebView, setShowWebView] = useState(false);
    const [webViewUrl, setWebViewUrl] = useState('');
    const [webViewTitle, setWebViewTitle] = useState('');
    const [pasteUrl, setPasteUrl] = useState('');
    const [isLoadingUrl, setIsLoadingUrl] = useState(false);
    const [showGuide, setShowGuide] = useState(true);
    const [detectedLink, setDetectedLink] = useState<DetectedLink | null>(null);
    const [trendingTracks, setTrendingTracks] = useState<Array<{ id: string; title: string; artist: string; thumbnail: string; platform: 'youtube' | 'soundcloud' }>>([]);
    const [isPlayingTrending, setIsPlayingTrending] = useState(false);
    const [searchResults, setSearchResults] = useState<Array<{ id: string; title: string; artist: string; thumbnail: string; platform: 'youtube' | 'soundcloud'; duration?: number }>>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const focusAnim = useRef(new Animated.Value(0)).current;
    const { addPlaylistFromUrl } = usePlaylist();

    const recentHistory = getRecentlyWatched(10);
    const hasContent = playlists.length > 0 || recentHistory.length > 0;

    useEffect(() => {
        if (pasteUrl.trim()) {
            const detected = LinkDetectionService.detectLinkType(pasteUrl);
            setDetectedLink(detected);
        } else {
            setDetectedLink(null);
        }
    }, [pasteUrl]);


    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const tracks: Array<{ id: string; title: string; artist: string; thumbnail: string; platform: 'youtube' | 'soundcloud' }> = [];


                try {
                    const ytResults = await OnlineSearchService.searchYouTube('trending music vn');
                    const ytTracks = ytResults.slice(0, 3).map(r => ({
                        id: r.videoId,
                        title: r.title,
                        artist: r.author,
                        thumbnail: r.thumbnail,
                        platform: 'youtube' as const,
                    }));
                    tracks.push(...ytTracks);
                } catch (e) {
                    console.log('[Trending] YouTube fetch failed:', e);
                }


                try {
                    const scResponse = await fetch('https://bidev.nhhoang.io.vn/charts?kind=trending&limit=3');
                    if (scResponse.ok) {
                        const scData = await scResponse.json();
                        const scTracks = (scData.results || []).slice(0, 3).map((r: any) => ({
                            id: r.id,
                            title: r.title,
                            artist: r.artist,
                            thumbnail: r.thumbnail,
                            platform: 'soundcloud' as const,
                        }));
                        tracks.push(...scTracks);
                    }
                } catch (e) {
                    console.log('[Trending] SoundCloud fetch failed:', e);
                }


                const shuffled = tracks.sort(() => Math.random() - 0.5);
                setTrendingTracks(shuffled);
            } catch (error) {
                console.log('[Trending] Failed to fetch trending:', error);
            }
        };

        fetchTrending();
    }, []);

    const handlePlayChannel = (channel: Channel) => {
        setSelectedChannel(channel);
        setShowPlayer(true);
    };

    const handleClosePlayer = () => {
        setShowPlayer(false);
        setSelectedChannel(null);
    };


    const handlePlayTrendingTrack = async (track: { id: string; title: string; artist: string; thumbnail: string; platform: 'youtube' | 'soundcloud' }) => {
        if (isPlayingTrending) return;

        setIsPlayingTrending(true);
        try {
            let streamUrl = '';

            if (track.platform === 'youtube') {
                streamUrl = await OnlineSearchService.getYouTubeStreamUrl(track.id);
            } else if (track.platform === 'soundcloud') {
                const scData = await OnlineSearchService.getSoundCloudStreamUrl(track.id);
                streamUrl = scData.streamUrl;
            }

            if (!streamUrl) throw new Error('Could not get stream URL');

            const channel: Channel = {
                id: `${track.platform}-${track.id}`,
                name: track.title,
                url: streamUrl,
                logo: track.thumbnail,
                group: track.platform === 'youtube' ? 'YouTube' : 'SoundCloud',
            };

            setSelectedChannel(channel);
            setShowPlayer(true);
        } catch (error: any) {
            console.error('[Trending] Play error:', error);
            Alert.alert('Playback Error', error.message || 'Failed to play this track');
        } finally {
            setIsPlayingTrending(false);
        }
    };


    useEffect(() => {
        if (isLoadingUrl) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.02, duration: 600, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isLoadingUrl, pulseAnim]);


    useEffect(() => {
        Animated.spring(focusAnim, {
            toValue: isInputFocused ? 1 : 0,
            tension: 100,
            friction: 10,
            useNativeDriver: false, 
        }).start();
    }, [isInputFocused, focusAnim]);


    const searchSuggestions = ['Nhạc trẻ 2024', 'Lofi chill', 'EDM remix', 'Rap Việt', 'Ballad hay'];


    const isUrl = (text: string) => {
        return text.startsWith('http://') || text.startsWith('https://') ||
            text.includes('youtube.com') || text.includes('youtu.be') ||
            text.includes('soundcloud.com') || text.includes('.m3u') ||
            text.includes('.mp4') || text.includes('.mp3');
    };

    const handleSmartInput = async () => {
        const input = pasteUrl.trim();
        if (!input) return;

        Keyboard.dismiss();
        setIsLoadingUrl(true);

        try {

            if (isUrl(input)) {
                const detected = LinkDetectionService.detectLinkType(input);

                if (detected.type === 'iptv_playlist') {
                    await addPlaylistFromUrl(input, 'IPTV Playlist', 'm3u');
                    Alert.alert('Thành công!', 'Đã thêm playlist vào thư viện');
                    setPasteUrl('');
                } else if (detected.isPlayable) {
                    const result = await LinkDetectionService.handlePlayableLink(detected);
                    if (result.success && result.streamUrl) {
                        const channel: Channel = {
                            id: `smart-${Date.now()}`,
                            name: result.title || 'Media',
                            url: result.streamUrl,
                            logo: result.thumbnail,
                            group: 'Smart Play',
                        };
                        setSelectedChannel(channel);
                        setShowPlayer(true);
                        setPasteUrl('');
                    } else {
                        throw new Error(result.error || 'Không thể phát');
                    }
                } else {
                    throw new Error('Link không được hỗ trợ');
                }
            } else {

                const results: Array<{ id: string; title: string; artist: string; thumbnail: string; platform: 'youtube' | 'soundcloud'; duration?: number }> = [];


                const [ytResults, scResults] = await Promise.allSettled([
                    OnlineSearchService.searchYouTube(input),
                    OnlineSearchService.searchSoundCloud(input),
                ]);

                if (ytResults.status === 'fulfilled' && ytResults.value) {
                    const ytMapped = ytResults.value.slice(0, 5).map(r => ({
                        id: r.videoId,
                        title: r.title,
                        artist: r.author,
                        thumbnail: r.thumbnail,
                        platform: 'youtube' as const,
                        duration: r.duration,
                    }));
                    results.push(...ytMapped);
                }

                if (scResults.status === 'fulfilled' && scResults.value) {
                    const scMapped = scResults.value.slice(0, 5).map(r => ({
                        id: r.id,
                        title: r.title,
                        artist: r.artist,
                        thumbnail: r.thumbnail,
                        platform: 'soundcloud' as const,
                        duration: r.duration ? r.duration / 1000 : undefined,
                    }));
                    results.push(...scMapped);
                }


                const ytItems = results.filter(r => r.platform === 'youtube');
                const scItems = results.filter(r => r.platform === 'soundcloud');
                const interleaved: typeof results = [];
                const maxLen = Math.max(ytItems.length, scItems.length);
                for (let i = 0; i < maxLen; i++) {
                    if (ytItems[i]) interleaved.push(ytItems[i]);
                    if (scItems[i]) interleaved.push(scItems[i]);
                }

                setSearchResults(interleaved);
                setShowSearchResults(true);
            }
        } catch (error: any) {
            console.error('Smart input error:', error);
            Alert.alert('Lỗi', error.message || 'Không thể xử lý');
        } finally {
            setIsLoadingUrl(false);
        }
    };


    const handlePlaySearchResult = async (result: typeof searchResults[0]) => {
        setShowSearchResults(false);
        setIsLoadingUrl(true);

        try {
            let streamUrl = '';

            if (result.platform === 'youtube') {
                streamUrl = await OnlineSearchService.getYouTubeStreamUrl(result.id);
            } else {
                const scData = await OnlineSearchService.getSoundCloudStreamUrl(result.id);
                streamUrl = scData.streamUrl;
            }

            if (!streamUrl) throw new Error('Không lấy được stream');

            const channel: Channel = {
                id: `${result.platform}-${result.id}`,
                name: result.title,
                url: streamUrl,
                logo: result.thumbnail,
                group: result.platform === 'youtube' ? 'YouTube' : 'SoundCloud',
            };

            setSelectedChannel(channel);
            setShowPlayer(true);
            setPasteUrl('');
        } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Không thể phát');
        } finally {
            setIsLoadingUrl(false);
        }
    };

    const renderHero = () => {

        const slides: CarouselSlide[] = trendingTracks.length > 0
            ? trendingTracks.map((track) => ({
                id: `trending-${track.platform}-${track.id}`,
                title: track.title.length > 40 ? track.title.substring(0, 37) + '...' : track.title,
                subtitle: `${track.artist} • ${track.platform === 'youtube' ? '🎬 YouTube' : '🎵 SoundCloud'}`,
                image: track.thumbnail,
                gradient: track.platform === 'youtube'
                    ? ['#FF0000', '#CC0000']
                    : ['#FF5500', '#FF3300'],
                icon: track.platform === 'youtube' ? 'logo-youtube' : 'musical-notes',
            }))
            : [
                {
                    id: '1',
                    title: `${t('welcomeBack')} 👋`,
                    subtitle: t('yourMedia'),
                    gradient: ['#667eea', '#764ba2'],
                    icon: 'play-circle',
                },
                {
                    id: '2',
                    title: t('youtubeAndSoundcloud'),
                    subtitle: t('findYourContent'),
                    gradient: ['#f093fb', '#f5576c'],
                    icon: 'logo-youtube',
                },
            ];

        if (currentItem) {
            slides.unshift({
                id: 'now-playing',
                title: t('nowPlaying'),
                subtitle: currentItem.channel.name,
                gradient: ['#764ba2', '#667eea'],
                icon: 'musical-notes',
            });
        }


        const handleSlidePress = (slide: CarouselSlide) => {

            const trendingMatch = trendingTracks.find(t => slide.id === `trending-${t.platform}-${t.id}`);
            if (trendingMatch) {
                handlePlayTrendingTrack(trendingMatch);
                return;
            }


            if (slide.id === 'now-playing' && currentItem) {
                handlePlayChannel(currentItem.channel);
                return;
            }


            onNavigateToOnline?.();
        };

        return <HeroCarousel slides={slides} onSlidePress={handleSlidePress} />;
    };

    const renderContinueWatching = () => {
        if (recentHistory.length === 0) return null;

        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('continueWatching')}</Text>
                    <TouchableOpacity onPress={onNavigateToLibrary}>
                        <Text style={styles.seeAllText}>{t('seeAll')}</Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                    horizontal
                    data={recentHistory}
                    keyExtractor={(item) => item.channelId}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.continueCard}
                            onPress={() => handlePlayChannel({
                                id: item.channelId,
                                name: item.channelName,
                                url: item.channelUrl,
                                logo: item.logo,
                            })}
                        >
                            <View style={styles.continueThumb}>
                                {item.logo ? (
                                    <Image source={{ uri: item.logo }} style={styles.continueImage} />
                                ) : (
                                    <LinearGradient
                                        colors={['#667eea', '#764ba2']}
                                        style={styles.continueImage}
                                    >
                                        <Ionicons name="play" size={32} color="#fff" />
                                    </LinearGradient>
                                )}
                                <View style={styles.progressBar}>
                                    <View style={[styles.progressFill, { width: `${item.progress * 100}%` }]} />
                                </View>
                            </View>
                            <Text style={styles.continueName} numberOfLines={2}>{item.channelName}</Text>
                        </TouchableOpacity>
                    )}
                />
            </View>
        );
    };

    const renderPlaylists = () => {
        if (playlists.length === 0) return null;

        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('yourPlaylists')}</Text>
                    <TouchableOpacity onPress={onNavigateToAddPlaylist}>
                        <Ionicons name="add-circle" size={28} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
                <View style={styles.playlistGrid}>
                    {playlists.slice(0, 4).map((playlist) => (
                        <TouchableOpacity
                            key={playlist.id}
                            style={styles.playlistCard}
                            onPress={() => onNavigateToChannels(playlist.id)}
                        >
                            <LinearGradient
                                colors={getPlaylistGradient(playlist.name)}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.playlistCardInner}
                            >
                                <Ionicons name="list" size={32} color="rgba(255,255,255,0.9)" />
                                <Text style={styles.playlistName} numberOfLines={2}>{playlist.name}</Text>
                                <Text style={styles.playlistMeta}>{playlist.channels.length} {t('channels')}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>
                {playlists.length > 4 && (
                    <TouchableOpacity style={styles.viewAllButton}>
                        <Text style={styles.viewAllText}>View all {playlists.length} playlists</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderSmartInput = () => {
        const inputHint = pasteUrl.trim()
            ? (isUrl(pasteUrl) ? '🔗 Link detected - will play' : '🔍 Will search YouTube & SoundCloud')
            : '';


        const borderColor = focusAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['rgba(102, 126, 234, 0.2)', 'rgba(102, 126, 234, 0.8)'],
        });

        return (
            <View style={styles.smartInputContainer}>
                <FadeInView delay={100} direction="up">
                    {}
                    <Animated.View style={[
                        styles.aiInputContainer,
                        {
                            transform: [{ scale: pulseAnim }],
                            borderColor: borderColor,
                            borderWidth: 1.5,
                        }
                    ]}>
                        <LinearGradient
                            colors={isLoadingUrl ? ['#667eea', '#764ba2'] : (isInputFocused ? ['#1e1e3a', '#252545'] : ['#1a1a2e', '#16213e'])}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.aiInputGradient}
                        >
                            {}
                            {(isLoadingUrl || isInputFocused) && (
                                <View style={[styles.glowEffect, isInputFocused && !isLoadingUrl && { backgroundColor: 'rgba(102, 126, 234, 0.05)' }]} />
                            )}

                            <View style={styles.aiInputRow}>
                                {isLoadingUrl ? (
                                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 12 }} />
                                ) : (
                                    <Ionicons
                                        name={pasteUrl.trim() && isUrl(pasteUrl) ? "link" : "search"}
                                        size={22}
                                        color={isInputFocused ? "#667eea" : "rgba(255,255,255,0.7)"}
                                        style={{ marginRight: 12 }}
                                    />
                                )}

                                <TextInput
                                    style={styles.aiInput}
                                    placeholder={t('searchmusicorlink')}
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    value={pasteUrl}
                                    onChangeText={setPasteUrl}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    onSubmitEditing={handleSmartInput}
                                    returnKeyType="search"
                                    editable={!isLoadingUrl}
                                    onFocus={() => setIsInputFocused(true)}
                                    onBlur={() => setIsInputFocused(false)}
                                />

                                {pasteUrl.length > 0 && !isLoadingUrl && (
                                    <TouchableOpacity
                                        onPress={() => setPasteUrl('')}
                                        style={styles.aiClearBtn}
                                    >
                                        <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.5)" />
                                    </TouchableOpacity>
                                )}

                                {pasteUrl.trim().length > 0 && !isLoadingUrl && (
                                    <TouchableOpacity
                                        onPress={handleSmartInput}
                                        style={styles.aiSendBtn}
                                    >
                                        <LinearGradient
                                            colors={['#667eea', '#764ba2']}
                                            style={styles.aiSendBtnGradient}
                                        >
                                            <Ionicons name="arrow-forward" size={18} color="#fff" />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {}
                            {inputHint ? (
                                <Text style={styles.aiInputHint}>{inputHint}</Text>
                            ) : null}
                        </LinearGradient>
                    </Animated.View>

                    {}
                    {!pasteUrl.trim() && !isLoadingUrl && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.suggestionsContainer}
                            contentContainerStyle={styles.suggestionsContent}
                        >
                            {searchSuggestions.map((suggestion, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.suggestionChip}
                                    onPress={() => {
                                        setPasteUrl(suggestion);
                                        handleSmartInput();
                                    }}
                                >
                                    <Ionicons name="trending-up" size={14} color={Colors.primary} />
                                    <Text style={styles.suggestionText}>{suggestion}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    {}
                    {isLoadingUrl && (
                        <View style={styles.loadingStatus}>
                            <View style={styles.loadingDot} />
                            <Text style={styles.loadingText}>
                                {isUrl(pasteUrl) ? 'Đang lấy stream...' : 'Đang tìm kiếm...'}
                            </Text>
                        </View>
                    )}
                </FadeInView>

                {}
                <Modal
                    visible={showSearchResults}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowSearchResults(false)}
                >
                    <View style={styles.searchResultsOverlay}>
                        <View style={styles.searchResultsContainer}>
                            {}
                            <View style={styles.searchResultsHeader}>
                                <Text style={styles.searchResultsTitle}>
                                    Kết quả cho "{pasteUrl}"
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setShowSearchResults(false)}
                                    style={styles.searchResultsClose}
                                >
                                    <Ionicons name="close" size={24} color={Colors.text} />
                                </TouchableOpacity>
                            </View>

                            {}
                            <FlatList
                                data={searchResults}
                                keyExtractor={(item) => `${item.platform}-${item.id}`}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.searchResultItem}
                                        onPress={() => handlePlaySearchResult(item)}
                                    >
                                        <Image
                                            source={{ uri: item.thumbnail }}
                                            style={styles.searchResultThumb}
                                        />
                                        <View style={styles.searchResultInfo}>
                                            <Text style={styles.searchResultTitle} numberOfLines={2}>
                                                {item.title}
                                            </Text>
                                            <View style={styles.searchResultMeta}>
                                                <View style={[
                                                    styles.platformBadge,
                                                    { backgroundColor: item.platform === 'youtube' ? '#FF0000' : '#FF5500' }
                                                ]}>
                                                    <Ionicons
                                                        name={item.platform === 'youtube' ? 'logo-youtube' : 'musical-notes'}
                                                        size={10}
                                                        color="#fff"
                                                    />
                                                </View>
                                                <Text style={styles.searchResultArtist} numberOfLines={1}>
                                                    {item.artist}
                                                </Text>
                                                {item.duration && (
                                                    <Text style={styles.searchResultDuration}>
                                                        {Math.floor(item.duration / 60)}:{String(Math.floor(item.duration % 60)).padStart(2, '0')}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                        <Ionicons name="play-circle" size={32} color={Colors.primary} />
                                    </TouchableOpacity>
                                )}
                                contentContainerStyle={{ padding: Spacing.md }}
                                ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
                            />
                        </View>
                    </View>
                </Modal>
            </View>
        );
    };

    const renderGuidanceSection = () => {
        if (!showGuide) return null;

        return (
            <View style={styles.guideContainer}>
                <View style={styles.guideHeader}>
                    <Ionicons name="help-circle-outline" size={22} color={Colors.primary} />
                    <Text style={styles.guideTitle}>{t('gettingStarted') || 'Getting Started'}</Text>
                </View>

                <View style={styles.guideItems}>
                    { }
                    <TouchableOpacity style={styles.guideItem} onPress={onNavigateToAddPlaylist}>
                        <View style={[styles.guideIconBg, { backgroundColor: 'rgba(118, 75, 162, 0.2)' }]}>
                            <Ionicons name="tv-outline" size={20} color={Colors.primary} />
                        </View>
                        <View style={styles.guideTextContainer}>
                            <Text style={styles.guideItemTitle}>{t('guideIptv') || 'IPTV / M3U'}</Text>
                            <Text style={styles.guideItemDesc}>{t('guideIptvDesc') || 'For TV channels - Import M3U/JSON playlist links'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
                    </TouchableOpacity>

                    { }
                    <TouchableOpacity style={styles.guideItem} onPress={onNavigateToOnline}>
                        <View style={[styles.guideIconBg, { backgroundColor: 'rgba(240, 147, 251, 0.2)' }]}>
                            <Ionicons name="logo-youtube" size={20} color={Colors.secondary} />
                        </View>
                        <View style={styles.guideTextContainer}>
                            <Text style={styles.guideItemTitle}>{t('guideOnline') || 'YouTube & Music'}</Text>
                            <Text style={styles.guideItemDesc}>{t('guideOnlineDesc') || 'Search and play from YouTube, SoundCloud'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
                    </TouchableOpacity>

                    { }
                    <TouchableOpacity style={styles.guideItem} onPress={onNavigateToLocalFiles}>
                        <View style={[styles.guideIconBg, { backgroundColor: 'rgba(79, 172, 254, 0.2)' }]}>
                            <Ionicons name="folder-outline" size={20} color={Colors.accent} />
                        </View>
                        <View style={styles.guideTextContainer}>
                            <Text style={styles.guideItemTitle}>{t('guideLocal') || 'Local Files'}</Text>
                            <Text style={styles.guideItemDesc}>{t('guideLocalDesc') || 'Play videos/music stored on your device'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.hideGuideBtn} onPress={() => setShowGuide(false)}>
                    <Text style={styles.hideGuideText}>{t('hideGuide') || 'Got it, hide this'}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <LinearGradient
                colors={['rgba(118, 75, 162, 0.2)', 'rgba(102, 126, 234, 0.2)']}
                style={styles.emptyGradient}
            >
                <Ionicons name="musical-notes" size={80} color={Colors.primary} />
                <Text style={styles.emptyTitle}>Welcome to PlayCast</Text>
                <Text style={styles.emptyDescription}>
                    Add your first playlist or browse local files to get started
                </Text>
                <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={onNavigateToAddPlaylist}
                >
                    <LinearGradient
                        colors={Gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.emptyButtonGradient}
                    >
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={styles.emptyButtonText}>Add Playlist</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </LinearGradient>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                <SafeAreaView edges={['top']}>
                    { }
                    <View style={styles.header}>
                        <Text style={[styles.logo, { color: themeColors.text }]}>PlayCast</Text>
                        <TouchableOpacity
                            style={styles.avatarButton}
                            onPress={onNavigateToPremium}
                        >
                            <Ionicons name="diamond" size={32} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>

                    { }
                    {renderHero()}

                    { }
                    {renderSmartInput()}

                    { }
                    {renderGuidanceSection()}

                    { }
                    {hasContent ? (
                        <>
                            {renderContinueWatching()}
                            {renderPlaylists()}
                        </>
                    ) : (
                        renderEmptyState()
                    )}

                    { }
                    <View style={{ height: Layout.tabBarHeight + 20 }} />
                </SafeAreaView>
            </ScrollView>

            { }
            {selectedChannel && (
                <Modal
                    visible={showPlayer}
                    animationType="slide"
                    presentationStyle="fullScreen"
                    onRequestClose={handleClosePlayer}
                >
                    <AdvancedVideoPlayer
                        channel={selectedChannel}
                        onClose={handleClosePlayer}
                        onError={(error) => console.error('Player error:', error)}
                    />
                </Modal>
            )}

            { }
            <WebViewPlayer
                visible={showWebView}
                url={webViewUrl}
                title={webViewTitle}
                onClose={() => setShowWebView(false)}
            />
        </View>
    );
};

const getPlaylistGradient = (name: string): string[] => {
    const gradients = [
        ['#667eea', '#764ba2'],
        ['#f093fb', '#f5576c'],
        ['#4facfe', '#00f2fe'],
        ['#43e97b', '#38f9d7'],
        ['#fa709a', '#fee140'],
        ['#a18cd1', '#fbc2eb'],
    ];
    const index = name.charCodeAt(0) % gradients.length;
    return gradients[index];
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Layout.screenPadding,
        paddingVertical: Spacing.md,
    },
    logo: {
        fontSize: FontSizes.xxl,
        fontWeight: '700',
        color: Colors.text,
        letterSpacing: 0.5,
    },
    avatarButton: {
        padding: Spacing.xs,
    },

    heroContainer: {
        marginHorizontal: Layout.screenPadding,
        marginBottom: Spacing.lg,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        height: Layout.heroHeight,
        ...Shadows.lg,
    },
    heroContent: {
        flex: 1,
        padding: Spacing.lg,
        justifyContent: 'center',
    },
    heroDecoration: {
        position: 'absolute',
        right: -20,
        bottom: -20,
    },
    heroGreeting: {
        fontSize: FontSizes.md,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: Spacing.xs,
    },
    heroTitle: {
        fontSize: FontSizes.hero,
        fontWeight: '700',
        color: '#fff',
        marginBottom: Spacing.xs,
    },
    heroSubtitle: {
        fontSize: FontSizes.lg,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: Spacing.md,
    },
    heroPlayButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        alignSelf: 'flex-start',
        gap: Spacing.xs,
    },
    heroPlayText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: FontSizes.md,
    },

    quickActions: {
        flexDirection: 'row',
        paddingHorizontal: Layout.screenPadding,
        marginBottom: Spacing.lg,
        gap: Spacing.sm,
    },
    quickAction: {
        flex: 1,
    },
    quickActionCard: {
        alignItems: 'center',
        gap: Spacing.xs,
        minHeight: 100,
        justifyContent: 'center',
        paddingVertical: Spacing.sm,
    },
    quickActionText: {
        fontSize: FontSizes.sm,
        color: Colors.text,
        fontWeight: '600',
        textAlign: 'center',
    },
    quickActionSubtext: {
        fontSize: FontSizes.xs,
        color: Colors.textTertiary,
        textAlign: 'center',
    },

    playFromLinkContainer: {
        paddingHorizontal: Layout.screenPadding,
        marginBottom: Spacing.lg,
    },
    playFromLinkHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.xs,
    },
    playFromLinkTitle: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.text,
    },
    playFromLinkDesc: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.md,
    },
    playFromLinkInputRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    playFromLinkInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    playFromLinkInput: {
        flex: 1,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontSize: FontSizes.sm,
        color: Colors.text,
    },
    clearUrlBtn: {
        padding: Spacing.sm,
    },
    playUrlBtn: {
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
    },
    playUrlBtnDisabled: {
        opacity: 0.6,
    },
    playUrlBtnGradient: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },

    section: {
        marginBottom: Spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Layout.screenPadding,
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
        color: Colors.text,
    },
    seeAllText: {
        fontSize: FontSizes.md,
        color: Colors.primary,
        fontWeight: '500',
    },
    horizontalList: {
        paddingHorizontal: Layout.screenPadding,
        gap: Spacing.md,
    },

    continueCard: {
        width: CARD_WIDTH,
    },
    continueThumb: {
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        marginBottom: Spacing.sm,
        backgroundColor: Colors.backgroundCard,
    },
    continueImage: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.primary,
    },
    continueName: {
        fontSize: FontSizes.sm,
        color: Colors.text,
        fontWeight: '500',
    },

    playlistGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: Layout.screenPadding,
        gap: Spacing.md,
    },
    playlistCard: {
        width: (SCREEN_WIDTH - Layout.screenPadding * 2 - Spacing.md) / 2,
        aspectRatio: 1,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        ...Shadows.md,
    },
    playlistCardInner: {
        flex: 1,
        padding: Spacing.md,
        justifyContent: 'flex-end',
    },
    playlistName: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: '#fff',
        marginTop: Spacing.sm,
    },
    playlistMeta: {
        fontSize: FontSizes.xs,
        color: 'rgba(255,255,255,0.7)',
        marginTop: Spacing.xs,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.md,
        gap: Spacing.xs,
    },
    viewAllText: {
        fontSize: FontSizes.md,
        color: Colors.primary,
        fontWeight: '500',
    },

    emptyContainer: {
        paddingHorizontal: Layout.screenPadding,
        marginTop: Spacing.xl,
    },
    emptyGradient: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.xxl,
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: FontSizes.xxl,
        fontWeight: '700',
        color: Colors.text,
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    emptyDescription: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: Spacing.lg,
    },
    emptyButton: {
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
        ...Shadows.glow,
    },
    emptyButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
    },
    emptyButtonText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: '#fff',
    },

    guideContainer: {
        marginHorizontal: Layout.screenPadding,
        marginBottom: Spacing.lg,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.md,
    },
    guideHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    guideTitle: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.text,
    },
    guideItems: {
        gap: Spacing.sm,
    },
    guideItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.md,
        padding: Spacing.sm,
        gap: Spacing.sm,
    },
    guideIconBg: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    guideTextContainer: {
        flex: 1,
    },
    guideItemTitle: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        color: Colors.text,
    },
    guideItemDesc: {
        fontSize: FontSizes.xs,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    hideGuideBtn: {
        marginTop: Spacing.md,
        alignItems: 'center',
    },
    hideGuideText: {
        fontSize: FontSizes.sm,
        color: Colors.textTertiary,
    },

    smartInputContainer: {
        paddingHorizontal: Layout.screenPadding,
        marginBottom: Spacing.lg,
    },


    aiInputContainer: {
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        ...Shadows.large,
    },
    aiInputGradient: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.3)',
    },
    aiInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    aiInput: {
        flex: 1,
        fontSize: FontSizes.md,
        color: '#fff',
        paddingVertical: Spacing.sm,
    },
    aiClearBtn: {
        padding: Spacing.xs,
        marginRight: Spacing.xs,
    },
    aiSendBtn: {
        marginLeft: Spacing.xs,
    },
    aiSendBtnGradient: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    aiInputHint: {
        fontSize: FontSizes.xs,
        color: 'rgba(255,255,255,0.6)',
        marginTop: Spacing.sm,
    },
    glowEffect: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: BorderRadius.xl,
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
    },
    loadingStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.md,
        gap: Spacing.sm,
    },
    loadingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#667eea',
    },
    loadingText: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
    },


    suggestionsContainer: {
        marginTop: Spacing.md,
    },
    suggestionsContent: {
        gap: Spacing.sm,
    },
    suggestionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: 'rgba(102, 126, 234, 0.15)',
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.3)',
    },
    suggestionText: {
        fontSize: FontSizes.sm,
        color: Colors.text,
        fontWeight: '500',
    },


    searchResultsOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    searchResultsContainer: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        maxHeight: '80%',
    },
    searchResultsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    searchResultsTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: Colors.text,
        flex: 1,
    },
    searchResultsClose: {
        padding: Spacing.xs,
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.sm,
        gap: Spacing.sm,
    },
    searchResultThumb: {
        width: 60,
        height: 60,
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.border,
    },
    searchResultInfo: {
        flex: 1,
    },
    searchResultTitle: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 4,
    },
    searchResultMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    platformBadge: {
        width: 16,
        height: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchResultArtist: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        flex: 1,
    },
    searchResultDuration: {
        fontSize: FontSizes.xs,
        color: Colors.textTertiary,
    },
});

export default NewHomeScreen;
