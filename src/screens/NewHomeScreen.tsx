
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
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
import { AnimatedPressable, FadeInView } from '../components/ui/AnimatedComponents';
import { GlassCard } from '../components/ui/GlassCard';
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

    // Fetch trending tracks from YouTube and SoundCloud
    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const tracks: Array<{ id: string; title: string; artist: string; thumbnail: string; platform: 'youtube' | 'soundcloud' }> = [];

                // Fetch from YouTube (trending music)
                try {
                    const ytResults = await OnlineSearchService.searchYouTube('trending music');
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

                // Fetch from SoundCloud proxy (charts/trending)
                try {
                    const scResponse = await fetch('http://188.166.216.232:3000/charts?kind=trending&limit=3');
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

                // Shuffle and set
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

    // Play trending track with proper stream URL extraction
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

    const handleSmartLink = async () => {
        const url = pasteUrl.trim();
        if (!url) {
            Alert.alert('Error', t('pleaseEnterUrl') || 'Please paste a URL');
            return;
        }

        const detected = LinkDetectionService.detectLinkType(url);
        Keyboard.dismiss();
        setIsLoadingUrl(true);

        try {
            if (detected.type === 'iptv_playlist') {
                await addPlaylistFromUrl(url, 'IPTV Playlist', 'm3u');
                Alert.alert(
                    t('success') || 'Success',
                    t('playlistAddedSuccess') || 'Playlist added to library!'
                );
                setPasteUrl('');
                setDetectedLink(null);
            } else if (detected.type === 'webview') {
                setWebViewUrl(url);
                setWebViewTitle(detected.platformName || 'Web Content');
                setShowWebView(true);
                setPasteUrl('');
                setDetectedLink(null);
            } else if (detected.isPlayable) {
                const result = await LinkDetectionService.handlePlayableLink(detected);

                if (result.success && result.streamUrl) {
                    const channel: Channel = {
                        id: `smart-${Date.now()}`,
                        name: result.title || 'Media',
                        url: result.streamUrl,
                        logo: result.thumbnail,
                        group: LinkDetectionService.getLinkTypeLabel(result.type),
                    };
                    setSelectedChannel(channel);
                    setShowPlayer(true);
                    setPasteUrl('');
                    setDetectedLink(null);
                } else {
                    throw new Error(result.error || 'Failed to play');
                }
            } else {
                Alert.alert(
                    'Unknown Link',
                    'This link type is not supported. Try YouTube, SoundCloud, M3U playlist, or direct video URLs.'
                );
            }
        } catch (error: any) {
            console.error('Smart link error:', error);
            Alert.alert('Error', error.message || 'Failed to process link');
        } finally {
            setIsLoadingUrl(false);
        }
    };


    const renderHero = () => {
        // Create slides from trending tracks
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

        // Handle slide press - play the track
        const handleSlidePress = (slide: CarouselSlide) => {
            // Check if it's a trending track
            const trendingMatch = trendingTracks.find(t => slide.id === `trending-${t.platform}-${t.id}`);
            if (trendingMatch) {
                handlePlayTrendingTrack(trendingMatch);
                return;
            }

            // Check if it's now-playing slide
            if (slide.id === 'now-playing' && currentItem) {
                handlePlayChannel(currentItem.channel);
                return;
            }

            // Otherwise navigate to discover
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


    const renderSmartInput = () => (
        <View style={styles.smartInputContainer}>
            <FadeInView delay={100} direction="up">
                <GlassCard variant="purple" padding="large">
                    <View style={styles.smartInputHeader}>
                        <Ionicons name="flash" size={24} color={Colors.primary} />
                        <Text style={styles.smartInputTitle}>
                            {t('smartPlay') || 'Smart Play'}
                        </Text>
                    </View>

                    <Text style={styles.smartInputDesc}>
                        {t('smartPlayDesc') || 'Paste any link - YouTube, SoundCloud, M3U playlist, or video URL'}
                    </Text>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.smartInput}
                            placeholder={t('pasteAnyLink') || 'Paste any link here...'}
                            placeholderTextColor={Colors.textTertiary}
                            value={pasteUrl}
                            onChangeText={setPasteUrl}
                            autoCapitalize="none"
                            autoCorrect={false}
                            multiline={false}
                        />
                        {pasteUrl.length > 0 && (
                            <TouchableOpacity
                                onPress={() => { setPasteUrl(''); setDetectedLink(null); }}
                                style={styles.clearBtn}
                            >
                                <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {detectedLink && detectedLink.type !== 'unknown' && (
                        <View style={styles.detectedType}>
                            <Ionicons
                                name={LinkDetectionService.getLinkTypeIcon(detectedLink.type) as any}
                                size={16}
                                color={LinkDetectionService.getLinkTypeColor(detectedLink.type)}
                            />
                            <Text style={[styles.detectedTypeText, { color: LinkDetectionService.getLinkTypeColor(detectedLink.type) }]}>
                                {LinkDetectionService.getLinkTypeLabel(detectedLink.type)}
                            </Text>
                            {detectedLink.type === 'iptv_playlist' && (
                                <Text style={styles.detectedAction}>→ Add to Library</Text>
                            )}
                            {detectedLink.isPlayable && (
                                <Text style={styles.detectedAction}>→ Play</Text>
                            )}
                        </View>
                    )}

                    <AnimatedPressable
                        style={[styles.smartPlayBtn, !pasteUrl.trim() && styles.smartPlayBtnDisabled]}
                        onPress={handleSmartLink}
                        disabled={isLoadingUrl || !pasteUrl.trim()}
                    >
                        <LinearGradient
                            colors={pasteUrl.trim() ? Gradients.primary as [string, string] : ['#444', '#333']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.smartPlayBtnGradient}
                        >
                            {isLoadingUrl ? (
                                <Ionicons name="hourglass" size={20} color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="flash" size={20} color="#fff" />
                                    <Text style={styles.smartPlayBtnText}>
                                        {detectedLink?.type === 'iptv_playlist'
                                            ? (t('addToLibrary') || 'Add to Library')
                                            : detectedLink?.type === 'webview'
                                                ? `Open ${detectedLink.platformName || 'Link'}`
                                                : (t('playNow') || 'Play Now')}
                                    </Text>
                                </>
                            )}
                        </LinearGradient>
                    </AnimatedPressable>

                    <View style={styles.examplesRow}>
                        <Text style={styles.examplesLabel}>Examples:</Text>
                        <Text style={styles.exampleText}>youtube.com/watch?v=...</Text>
                        <Text style={styles.exampleText}>soundcloud.com/artist/track</Text>
                        <Text style={styles.exampleText}>iptv.example.com/playlist.m3u</Text>
                    </View>
                </GlassCard>
            </FadeInView>
        </View>
    );


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
    smartInputHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    smartInputTitle: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
        color: Colors.text,
    },
    smartInputDesc: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.md,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.md,
    },
    smartInput: {
        flex: 1,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        fontSize: FontSizes.md,
        color: Colors.text,
    },
    clearBtn: {
        padding: Spacing.sm,
    },
    detectedType: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.md,
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: BorderRadius.sm,
        alignSelf: 'flex-start',
    },
    detectedTypeText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
    detectedAction: {
        fontSize: FontSizes.xs,
        color: Colors.textSecondary,
        marginLeft: Spacing.xs,
    },
    smartPlayBtn: {
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        marginBottom: Spacing.md,
    },
    smartPlayBtnDisabled: {
        opacity: 0.5,
    },
    smartPlayBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
    },
    smartPlayBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: FontSizes.md,
    },
    examplesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
        alignItems: 'center',
    },
    examplesLabel: {
        fontSize: FontSizes.xs,
        color: Colors.textTertiary,
        marginRight: Spacing.xs,
    },
    exampleText: {
        fontSize: FontSizes.xs,
        color: Colors.textSecondary,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: Spacing.xs,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
});

export default NewHomeScreen;
