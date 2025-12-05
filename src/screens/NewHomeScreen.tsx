// NEW HOME SCREEN - Modern design with hero, continue watching, playlists
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdvancedVideoPlayer } from '../components/player/AdvancedVideoPlayer';
import { GlassCard } from '../components/ui/GlassCard';
import { BorderRadius, Colors, FontSizes, Gradients, Layout, Shadows, Spacing } from '../constants/theme';
import { useHistory } from '../contexts/HistoryContext';
import { usePlaylist } from '../contexts/PlaylistContext';
import { useQueue } from '../contexts/QueueContext';
import { Channel } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.42;

interface NewHomeScreenProps {
    onNavigateToAddPlaylist: () => void;
    onNavigateToChannels: (playlistId: string) => void;
}

export const NewHomeScreen: React.FC<NewHomeScreenProps> = ({
    onNavigateToAddPlaylist,
    onNavigateToChannels,
}) => {
    const { playlists } = usePlaylist();
    const { getRecentlyWatched } = useHistory();
    const { currentItem } = useQueue();

    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [showPlayer, setShowPlayer] = useState(false);

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

    // Render hero section
    const renderHero = () => (
        <LinearGradient
            colors={Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroContainer}
        >
            <View style={styles.heroContent}>
                <Text style={styles.heroGreeting}>Welcome back! 👋</Text>
                {currentItem ? (
                    <>
                        <Text style={styles.heroTitle}>Now Playing</Text>
                        <Text style={styles.heroSubtitle} numberOfLines={1}>
                            {currentItem.channel.name}
                        </Text>
                        <TouchableOpacity
                            style={styles.heroPlayButton}
                            onPress={() => handlePlayChannel(currentItem.channel)}
                        >
                            <Ionicons name="play" size={20} color="#fff" />
                            <Text style={styles.heroPlayText}>Continue</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <Text style={styles.heroTitle}>PlayCast</Text>
                        <Text style={styles.heroSubtitle}>Your media, your way</Text>
                    </>
                )}
            </View>
            <View style={styles.heroDecoration}>
                <Ionicons name="musical-notes" size={120} color="rgba(255,255,255,0.1)" />
            </View>
        </LinearGradient>
    );

    // Render continue watching section
    const renderContinueWatching = () => {
        if (recentHistory.length === 0) return null;

        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Continue Watching</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAllText}>See all</Text>
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

    // Render playlists section
    const renderPlaylists = () => {
        if (playlists.length === 0) return null;

        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Your Playlists</Text>
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
                                <Text style={styles.playlistMeta}>{playlist.channels.length} channels</Text>
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

    // Render quick actions
    const renderQuickActions = () => (
        <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} onPress={onNavigateToAddPlaylist}>
                <GlassCard variant="purple" padding="medium" style={styles.quickActionCard}>
                    <Ionicons name="add-circle-outline" size={28} color={Colors.primary} />
                    <Text style={styles.quickActionText}>Add Playlist</Text>
                </GlassCard>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
                <GlassCard variant="purple" padding="medium" style={styles.quickActionCard}>
                    <Ionicons name="folder-outline" size={28} color={Colors.accent} />
                    <Text style={styles.quickActionText}>Local Files</Text>
                </GlassCard>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
                <GlassCard variant="purple" padding="medium" style={styles.quickActionCard}>
                    <Ionicons name="globe-outline" size={28} color={Colors.secondary} />
                    <Text style={styles.quickActionText}>Online</Text>
                </GlassCard>
            </TouchableOpacity>
        </View>
    );

    // Render empty state
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
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                <SafeAreaView edges={['top']}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.logo}>PlayCast</Text>
                        <TouchableOpacity style={styles.avatarButton}>
                            <Ionicons name="person-circle" size={36} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Hero */}
                    {renderHero()}

                    {/* Quick Actions */}
                    {renderQuickActions()}

                    {/* Content */}
                    {hasContent ? (
                        <>
                            {renderContinueWatching()}
                            {renderPlaylists()}
                        </>
                    ) : (
                        renderEmptyState()
                    )}

                    {/* Spacer for tab bar */}
                    <View style={{ height: Layout.tabBarHeight + 20 }} />
                </SafeAreaView>
            </ScrollView>

            {/* Video Player Modal */}
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

// Helper function to get gradient based on playlist name
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
    // Hero styles
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
    // Quick actions
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
        gap: Spacing.sm,
        minHeight: 90,
        justifyContent: 'center',
    },
    quickActionText: {
        fontSize: FontSizes.sm,
        color: Colors.text,
        fontWeight: '500',
        textAlign: 'center',
    },
    // Section styles
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
    // Continue watching card
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
    // Playlist grid
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
    // Empty state
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
});

export default NewHomeScreen;
