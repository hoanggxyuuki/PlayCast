
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
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
import { EmptyState } from '../components/ui';
import { BorderRadius, Colors, FontSizes, Layout, Spacing } from '../constants/theme';
import { useHistory } from '../contexts/HistoryContext';
import { OnlineFavorite, useOnlineFavorites } from '../contexts/OnlineFavoritesContext';
import { usePlaylist } from '../contexts/PlaylistContext';
import { useQueue } from '../contexts/QueueContext';
import { useCustomTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../i18n/useTranslation';
import { DownloadItem, DownloadService } from '../services/downloadService';
import { OnlineSearchService } from '../services/OnlineSearchService';
import { Channel } from '../types';

type LibraryTab = 'playlists' | 'favorites' | 'online' | 'history' | 'queue' | 'downloads';

interface TabConfig {
    id: LibraryTab;
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
}

interface LibraryScreenProps {
    onNavigateToChannels?: (playlistId: string) => void;
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({ onNavigateToChannels }) => {
    const { playlists, deletePlaylist, getFavoriteChannels } = usePlaylist();
    const { history, clearHistory, removeFromHistory } = useHistory();
    const { queue, currentIndex, removeFromQueue, clearQueue, setCurrentIndex } = useQueue();
    const { favorites: onlineFavorites, youtubeFavorites, soundcloudFavorites, removeFavorite } = useOnlineFavorites();
    const { t } = useTranslation();
    const { currentTheme } = useCustomTheme();
    const themeColors = currentTheme.colors;


    const TABS: TabConfig[] = [
        { id: 'playlists', title: t('playlists'), icon: 'list' },
        { id: 'favorites', title: t('favorites'), icon: 'heart' },
        { id: 'online', title: t('online'), icon: 'globe' },
        { id: 'downloads', title: t('downloads'), icon: 'download' },
        { id: 'history', title: t('history'), icon: 'time' },
        { id: 'queue', title: t('queue'), icon: 'musical-notes' },
    ];

    const [activeTab, setActiveTab] = useState<LibraryTab>('playlists');
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [showPlayer, setShowPlayer] = useState(false);
    const [downloads, setDownloads] = useState<DownloadItem[]>([]);


    useEffect(() => {
        const loadDownloads = async () => {
            await DownloadService.init();
            setDownloads(DownloadService.getAllDownloads());
        };
        loadDownloads();
    }, [activeTab]);

    const favoriteChannels = getFavoriteChannels();

    const handlePlayChannel = (channel: Channel) => {
        setSelectedChannel(channel);
        setShowPlayer(true);
    };

    const handleClosePlayer = () => {
        setShowPlayer(false);
        setSelectedChannel(null);
    };

    const renderTabs = () => (
        <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsList}>
                {TABS.map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        style={[styles.tabPill, activeTab === tab.id && styles.tabPillActive]}
                        onPress={() => setActiveTab(tab.id)}
                    >
                        <Ionicons name={tab.icon} size={18} color={activeTab === tab.id ? '#fff' : Colors.textSecondary} />
                        <Text style={[styles.tabPillText, activeTab === tab.id && styles.tabPillTextActive]}>{tab.title}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderPlaylists = () => {
        if (playlists.length === 0) {
            return <EmptyState icon="list-outline" title="No Playlists" description="Add your first playlist from the Discover tab" />;
        }

        return (
            <FlatList
                data={playlists}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.playlistItem} onPress={() => onNavigateToChannels?.(item.id)}>
                        <LinearGradient colors={getGradientForName(item.name)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.playlistThumb}>
                            <Ionicons name="list" size={24} color="rgba(255,255,255,0.9)" />
                        </LinearGradient>
                        <View style={styles.playlistInfo}>
                            <Text style={styles.playlistName} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.playlistMeta}>{item.channels.length} channels • {item.type.toUpperCase()}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => {
                                Alert.alert('Delete Playlist', `Delete "${item.name}"?`, [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Delete', style: 'destructive', onPress: () => deletePlaylist(item.id) },
                                ]);
                            }}
                        >
                            <Ionicons name="trash-outline" size={20} color={Colors.error} />
                        </TouchableOpacity>
                    </TouchableOpacity>
                )}
            />
        );
    };

    const renderFavorites = () => {
        if (favoriteChannels.length === 0) {
            return <EmptyState icon="heart-outline" title="No Favorites" description="Tap the heart icon on any channel to add it here" />;
        }

        return (
            <FlatList
                data={favoriteChannels}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.channelItem} onPress={() => handlePlayChannel(item)}>
                        {item.logo ? (
                            <Image source={{ uri: item.logo }} style={styles.channelThumb} />
                        ) : (
                            <View style={[styles.channelThumb, styles.channelThumbPlaceholder]}>
                                <Ionicons name="tv" size={24} color={Colors.primary} />
                            </View>
                        )}
                        <View style={styles.channelInfo}>
                            <Text style={styles.channelName} numberOfLines={1}>{item.name}</Text>
                            {item.group && <Text style={styles.channelGroup} numberOfLines={1}>{item.group}</Text>}
                        </View>
                        <Ionicons name="play-circle" size={32} color={Colors.primary} />
                    </TouchableOpacity>
                )}
            />
        );
    };

    const handlePlayOnlineFavorite = async (item: OnlineFavorite) => {
        try {
            let streamUrl: string | null = null;
            if (item.platform === 'youtube' && item.videoId) {
                streamUrl = await OnlineSearchService.getYouTubeStreamUrl(item.videoId);
            } else if (item.platform === 'soundcloud') {
                streamUrl = await OnlineSearchService.getSoundCloudStreamUrl(item.id);
            }

            if (streamUrl) {
                const channel: Channel = {
                    id: item.id,
                    name: item.title,
                    url: streamUrl,
                    group: item.artist,
                    logo: item.thumbnail,
                };
                handlePlayChannel(channel);
            } else {
                Alert.alert('Error', 'Could not get stream URL');
            }
        } catch (error) {
            console.error('Error playing online favorite:', error);
            Alert.alert('Error', 'Failed to play this item');
        }
    };

    const renderOnlineFavorites = () => {
        if (onlineFavorites.length === 0) {
            return <EmptyState icon="globe-outline" title="No Online Favorites" description="Add favorites from YouTube or SoundCloud in the Discover tab" />;
        }

        return (
            <FlatList
                data={onlineFavorites}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.channelItem} onPress={() => handlePlayOnlineFavorite(item)}>
                        <Image source={{ uri: item.thumbnail }} style={styles.channelThumb} />
                        <View style={styles.channelInfo}>
                            <Text style={styles.channelName} numberOfLines={1}>{item.title}</Text>
                            <View style={styles.onlineMeta}>
                                <View style={[styles.platformBadge, { backgroundColor: item.platform === 'youtube' ? '#FF0000' : '#FF5500' }]}>
                                    <Ionicons name={item.platform === 'youtube' ? 'logo-youtube' : 'musical-notes'} size={10} color="#fff" />
                                </View>
                                <Text style={styles.channelGroup} numberOfLines={1}>{item.artist}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => removeFavorite(item.id)} style={styles.removeButton}>
                            <Ionicons name="heart-dislike" size={22} color="#FF4B6E" />
                        </TouchableOpacity>
                        <Ionicons name="play-circle" size={32} color={Colors.primary} />
                    </TouchableOpacity>
                )}
            />
        );
    };

    const renderHistory = () => {
        if (history.length === 0) {
            return <EmptyState icon="time-outline" title="No History" description="Your watch history will appear here" />;
        }

        return (
            <>
                <View style={styles.historyHeader}>
                    <Text style={styles.historyCount}>{history.length} items</Text>
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => {
                            Alert.alert('Clear History', 'Clear all watch history?', [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Clear', style: 'destructive', onPress: clearHistory },
                            ]);
                        }}
                    >
                        <Ionicons name="trash-outline" size={18} color={Colors.error} />
                        <Text style={styles.clearButtonText}>Clear All</Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.channelId}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.historyItem}
                            onPress={() => handlePlayChannel({ id: item.channelId, name: item.channelName, url: item.channelUrl, logo: item.logo })}
                        >
                            {item.logo ? (
                                <Image source={{ uri: item.logo }} style={styles.historyThumb} />
                            ) : (
                                <View style={[styles.historyThumb, styles.channelThumbPlaceholder]}>
                                    <Ionicons name="play" size={20} color={Colors.primary} />
                                </View>
                            )}
                            <View style={styles.historyInfo}>
                                <Text style={styles.historyName} numberOfLines={1}>{item.channelName}</Text>
                                <View style={styles.historyProgress}>
                                    <View style={[styles.historyProgressFill, { width: `${item.progress * 100}%` }]} />
                                </View>
                            </View>
                            <TouchableOpacity style={styles.removeButton} onPress={() => removeFromHistory(item.channelId)}>
                                <Ionicons name="close" size={20} color={Colors.textTertiary} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}
                />
            </>
        );
    };

    const renderQueue = () => {
        if (queue.length === 0) {
            return <EmptyState icon="musical-notes-outline" title="Queue Empty" description="Add items to your queue" />;
        }

        return (
            <>
                <View style={styles.queueHeader}>
                    <Text style={styles.queueCount}>{queue.length} items</Text>
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => {
                            Alert.alert('Clear Queue', 'Clear all items?', [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Clear', style: 'destructive', onPress: clearQueue },
                            ]);
                        }}
                    >
                        <Ionicons name="trash-outline" size={18} color={Colors.error} />
                        <Text style={styles.clearButtonText}>Clear</Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={queue}
                    keyExtractor={(item) => `${item.channel.id}-${item.position}`}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => {
                        const isPlaying = currentIndex === item.position;
                        return (
                            <TouchableOpacity style={[styles.queueItem, isPlaying && styles.queueItemPlaying]} onPress={() => { setCurrentIndex(item.position); handlePlayChannel(item.channel); }}>
                                {item.channel.logo ? (
                                    <Image source={{ uri: item.channel.logo }} style={styles.queueThumb} />
                                ) : (
                                    <View style={[styles.queueThumb, styles.channelThumbPlaceholder]}>
                                        <Ionicons name="musical-note" size={20} color={Colors.primary} />
                                    </View>
                                )}
                                <View style={styles.queueInfo}>
                                    <Text style={styles.queueName} numberOfLines={1}>{item.channel.name}</Text>
                                    {item.channel.group && <Text style={styles.queueGroup}>{item.channel.group}</Text>}
                                </View>
                                <TouchableOpacity style={styles.removeButton} onPress={() => removeFromQueue(item.channel.id)}>
                                    <Ionicons name="close" size={20} color={Colors.textTertiary} />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        );
                    }}
                />
            </>
        );
    };

    const renderDownloads = () => {
        if (downloads.length === 0) {
            return <EmptyState icon="download-outline" title="No Downloads" description="Downloaded videos and audio will appear here" />;
        }

        const handlePlayDownload = (item: DownloadItem) => {
            const channel: Channel = {
                id: item.id,
                name: item.title,
                url: item.localPath,
                logo: item.thumbnail,

            };
            handlePlayChannel(channel);
        };

        const handleDeleteDownload = async (item: DownloadItem) => {
            Alert.alert(
                'Delete Download',
                `Are you sure you want to delete "${item.title}"?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                            await DownloadService.deleteDownload(item.id);
                            setDownloads(DownloadService.getAllDownloads());
                        },
                    },
                ]
            );
        };

        return (
            <FlatList
                data={downloads}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.channelItem} onPress={() => handlePlayDownload(item)}>
                        {item.thumbnail ? (
                            <Image source={{ uri: item.thumbnail }} style={styles.channelThumb} />
                        ) : (
                            <View style={[styles.channelThumb, styles.channelThumbPlaceholder]}>
                                <Ionicons name="download" size={24} color={Colors.primary} />
                            </View>
                        )}
                        <View style={styles.channelInfo}>
                            <Text style={styles.channelName} numberOfLines={1}>{item.title}</Text>
                            <View style={styles.onlineMeta}>
                                { }
                                <Text style={styles.onlineArtist}>{item.artist}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.removeButton} onPress={() => handleDeleteDownload(item)}>
                            <Ionicons name="trash-outline" size={20} color={Colors.error} />
                        </TouchableOpacity>
                    </TouchableOpacity>
                )}
            />
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: themeColors.text }]}>Library</Text>
                </View>
                {renderTabs()}
                <View style={styles.content}>
                    {activeTab === 'playlists' && renderPlaylists()}
                    {activeTab === 'favorites' && renderFavorites()}
                    {activeTab === 'online' && renderOnlineFavorites()}
                    {activeTab === 'downloads' && renderDownloads()}
                    {activeTab === 'history' && renderHistory()}
                    {activeTab === 'queue' && renderQueue()}
                </View>
            </SafeAreaView>

            {selectedChannel && (
                <Modal visible={showPlayer} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleClosePlayer}>
                    <AdvancedVideoPlayer channel={selectedChannel} onClose={handleClosePlayer} onError={(e) => console.error('Player error:', e)} />
                </Modal>
            )}
        </View>
    );
};

const getGradientForName = (name: string): string[] => {
    const gradients = [
        ['#667eea', '#764ba2'],
        ['#f093fb', '#f5576c'],
        ['#4facfe', '#00f2fe'],
        ['#43e97b', '#38f9d7'],
        ['#fa709a', '#fee140'],
    ];
    return gradients[name.charCodeAt(0) % gradients.length];
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    safeArea: { flex: 1 },
    header: { paddingHorizontal: Layout.screenPadding, paddingVertical: Spacing.lg },
    headerTitle: { fontSize: FontSizes.xxxl, fontWeight: '700', color: Colors.text },
    tabsContainer: { marginBottom: Spacing.md },
    tabsList: { paddingHorizontal: Layout.screenPadding, gap: Spacing.sm },
    tabPill: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.backgroundCard, borderWidth: 1, borderColor: Colors.border },
    tabPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    tabPillText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary },
    tabPillTextActive: { color: '#fff' },
    content: { flex: 1 },
    listContent: { paddingHorizontal: Layout.screenPadding, paddingBottom: Layout.tabBarHeight + 20, gap: Spacing.sm },
    playlistItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.md },
    playlistThumb: { width: 56, height: 56, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
    playlistInfo: { flex: 1 },
    playlistName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
    playlistMeta: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
    deleteButton: { padding: Spacing.sm },
    channelItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.md },
    channelThumb: { width: 48, height: 48, borderRadius: BorderRadius.sm },
    channelThumbPlaceholder: { backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
    channelInfo: { flex: 1 },
    channelName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
    channelGroup: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Layout.screenPadding, marginBottom: Spacing.md },
    historyCount: { fontSize: FontSizes.sm, color: Colors.textSecondary },
    clearButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    clearButtonText: { fontSize: FontSizes.sm, color: Colors.error },
    historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.md },
    historyThumb: { width: 60, height: 40, borderRadius: BorderRadius.sm },
    historyInfo: { flex: 1 },
    historyName: { fontSize: FontSizes.md, fontWeight: '500', color: Colors.text, marginBottom: Spacing.xs },
    historyProgress: { height: 3, backgroundColor: Colors.border, borderRadius: 2 },
    historyProgressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
    onlineMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 2 },
    platformBadge: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    removeButton: { padding: Spacing.sm },
    queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Layout.screenPadding, marginBottom: Spacing.md },
    queueCount: { fontSize: FontSizes.sm, color: Colors.textSecondary },
    queueItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.md },
    queueItemPlaying: { backgroundColor: 'rgba(118, 75, 162, 0.2)', borderWidth: 1, borderColor: Colors.primary },
    queueThumb: { width: 48, height: 48, borderRadius: BorderRadius.sm },
    queueInfo: { flex: 1 },
    queueName: { fontSize: FontSizes.md, fontWeight: '500', color: Colors.text },
    queueGroup: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
});

export default LibraryScreen;
