
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
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
import { GlassCard } from '../components/ui/GlassCard';
import { CarouselSlide, HeroCarousel } from '../components/ui/HeroCarousel';
import { BorderRadius, Colors, FontSizes, Gradients, Layout, Shadows, Spacing } from '../constants/theme';
import { useHistory } from '../contexts/HistoryContext';
import { usePlaylist } from '../contexts/PlaylistContext';
import { useQueue } from '../contexts/QueueContext';
import { useCustomTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../i18n/useTranslation';
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
    const [pasteUrl, setPasteUrl] = useState('');
    const [isLoadingUrl, setIsLoadingUrl] = useState(false);
    const [showGuide, setShowGuide] = useState(true);

    const recentHistory = getRecentlyWatched(10);
    const hasContent = playlists.length > 0 || recentHistory.length > 0;

    const handlePlayChannel = (channel: Channel) => {
        setSelectedChannel(channel);
        setShowPlayer(true);
    };

    const handleClosePlayer = () => {
        setShowPlayer(false);
        setSelectedChannel(null);
    };


    const handlePlayFromUrl = async () => {
        const url = pasteUrl.trim();
        if (!url) {
            Alert.alert('Error', 'Please paste a URL');
            return;
        }

        setIsLoadingUrl(true);
        Keyboard.dismiss();

        try {
            let streamUrl: string | null = null;
            let title = 'Playing from URL';
            let thumbnail = '';
            let platform: 'youtube' | 'soundcloud' = 'youtube';


            const ytPatterns = [
                /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
                /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
            ];

            let videoId: string | null = null;


            for (const pattern of ytPatterns) {
                const match = url.match(pattern);
                if (match) {
                    videoId = match[1];
                    platform = 'youtube';
                    break;
                }
            }

            if (videoId) {

                try {
                    const details = await OnlineSearchService.getYouTubeVideoDetails(videoId);
                    title = details.title;
                    thumbnail = details.thumbnail;
                } catch (e) {

                    console.warn('Failed to fetch YouTube details', e);
                    title = 'YouTube Video';
                    thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                }
                streamUrl = await OnlineSearchService.getYouTubeStreamUrl(videoId);
            } else if (url.includes('soundcloud.com')) {
                platform = 'soundcloud';
                const scData = await OnlineSearchService.getSoundCloudStreamUrl(url);
                streamUrl = scData.streamUrl;
                title = scData.title;
                thumbnail = scData.thumbnail;
            }

            if (streamUrl) {
                const channel: Channel = {
                    id: `url-${Date.now()}`,
                    name: title,
                    url: streamUrl,
                    logo: thumbnail,
                    group: platform === 'youtube' ? 'YouTube' : 'SoundCloud',
                };
                setSelectedChannel(channel);
                setShowPlayer(true);
                setPasteUrl('');
            } else {
                Alert.alert('Error', 'Could not play this URL. Make sure it\'s a valid YouTube or SoundCloud link.');
            }
        } catch (error: any) {
            console.error('Error playing from URL:', error);
            Alert.alert('Error', error.message || 'Failed to play from URL');
        } finally {
            setIsLoadingUrl(false);
        }
    };


    const renderHero = () => {

        const slides: CarouselSlide[] = [
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
            {
                id: '3',
                title: 'IPTV',
                subtitle: t('m3uPlaylist'),
                gradient: ['#4facfe', '#00f2fe'],
                icon: 'tv',
            },
            {
                id: '4',
                title: t('backgroundPlayback'),
                subtitle: t('backgroundDesc'),
                gradient: ['#43e97b', '#38f9d7'],
                icon: 'headset',
            },
        ];


        if (currentItem) {
            slides.unshift({
                id: 'now-playing',
                title: t('nowPlaying'),
                subtitle: currentItem.channel.name,
                gradient: ['#764ba2', '#667eea'],
                icon: 'musical-notes',
                action: {
                    label: t('continueWatching'),
                    onPress: () => handlePlayChannel(currentItem.channel),
                },
            });
        }

        return <HeroCarousel slides={slides} autoPlayInterval={5000} />;
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


    const renderQuickActions = () => (
        <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} onPress={onNavigateToAddPlaylist}>
                <GlassCard variant="purple" padding="medium" style={styles.quickActionCard}>
                    <Ionicons name="tv-outline" size={28} color={Colors.primary} />
                    <Text style={styles.quickActionText}>{t('addPlaylist')}</Text>
                    <Text style={styles.quickActionSubtext}>{t('addPlaylistSubtitle') || 'IPTV channels'}</Text>
                </GlassCard>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={onNavigateToLocalFiles}>
                <GlassCard variant="purple" padding="medium" style={styles.quickActionCard}>
                    <Ionicons name="folder-outline" size={28} color={Colors.accent} />
                    <Text style={styles.quickActionText}>{t('localFiles')}</Text>
                    <Text style={styles.quickActionSubtext}>{t('localFilesSubtitle') || 'Device videos'}</Text>
                </GlassCard>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={onNavigateToOnline}>
                <GlassCard variant="purple" padding="medium" style={styles.quickActionCard}>
                    <Ionicons name="logo-youtube" size={28} color={Colors.secondary} />
                    <Text style={styles.quickActionText}>{t('online')}</Text>
                    <Text style={styles.quickActionSubtext}>{t('onlineSubtitle') || 'YouTube, SoundCloud'}</Text>
                </GlassCard>
            </TouchableOpacity>
        </View>
    );


    const renderPlayFromLink = () => (
        <View style={styles.playFromLinkContainer}>
            <GlassCard variant="purple" padding="medium">
                <View style={styles.playFromLinkHeader}>
                    <Ionicons name="link" size={22} color={Colors.primary} />
                    <Text style={styles.playFromLinkTitle}>{t('playFromLink') || 'Play from Link'}</Text>
                </View>
                <Text style={styles.playFromLinkDesc}>{t('pasteUrlPlaceholder') || 'Paste YouTube or SoundCloud URL'}</Text>
                <View style={styles.playFromLinkInputRow}>
                    <View style={styles.playFromLinkInputContainer}>
                        <TextInput
                            style={styles.playFromLinkInput}
                            placeholder="https://youtube.com/watch?v=..."
                            placeholderTextColor={Colors.textTertiary}
                            value={pasteUrl}
                            onChangeText={setPasteUrl}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {pasteUrl.length > 0 && (
                            <TouchableOpacity onPress={() => setPasteUrl('')} style={styles.clearUrlBtn}>
                                <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity
                        style={[styles.playUrlBtn, !pasteUrl.trim() && styles.playUrlBtnDisabled]}
                        onPress={handlePlayFromUrl}
                        disabled={isLoadingUrl || !pasteUrl.trim()}
                    >
                        <LinearGradient
                            colors={pasteUrl.trim() ? Gradients.accent as [string, string] : ['#555', '#444']}
                            style={styles.playUrlBtnGradient}
                        >
                            {isLoadingUrl ? (
                                <Ionicons name="hourglass" size={18} color="#fff" />
                            ) : (
                                <Ionicons name="play" size={18} color="#fff" />
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </GlassCard>
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
                    {}
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

                    {}
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

                    {}
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
                    {}
                    <View style={styles.header}>
                        <Text style={[styles.logo, { color: themeColors.text }]}>PlayCast</Text>
                        <TouchableOpacity
                            style={styles.avatarButton}
                            onPress={onNavigateToPremium}
                        >
                            <Ionicons name="diamond" size={32} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {}
                    {renderHero()}

                    {}
                    {renderQuickActions()}

                    {}
                    {renderGuidanceSection()}

                    {}
                    {renderPlayFromLink()}

                    {}
                    {hasContent ? (
                        <>
                            {renderContinueWatching()}
                            {renderPlaylists()}
                        </>
                    ) : (
                        renderEmptyState()
                    )}

                    {}
                    <View style={{ height: Layout.tabBarHeight + 20 }} />
                </SafeAreaView>
            </ScrollView>

            {}
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
});

export default NewHomeScreen;
