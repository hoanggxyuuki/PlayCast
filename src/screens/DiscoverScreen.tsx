// DISCOVER SCREEN - Local files, Online search, Add links
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    Keyboard,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { LoadingSpinner } from '../components/ui';
import { GlassCard } from '../components/ui/GlassCard';
import { BorderRadius, Colors, FontSizes, Gradients, Layout, Shadows, Spacing } from '../constants/theme';
import { usePlaylist } from '../contexts/PlaylistContext';
import {
    OnlineSearchResult,
    OnlineSearchService,
    SearchPlatform,
} from '../services/OnlineSearchService';
import { Channel } from '../types';

type DiscoverTab = 'local' | 'online' | 'link';

interface SourceOption {
    id: DiscoverTab;
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    description: string;
}

const SOURCE_OPTIONS: SourceOption[] = [
    {
        id: 'local',
        title: 'Local Files',
        icon: 'folder-open',
        color: '#4facfe',
        description: 'Play from device',
    },
    {
        id: 'online',
        title: 'Online',
        icon: 'globe',
        color: '#f093fb',
        description: 'YouTube, SoundCloud',
    },
    {
        id: 'link',
        title: 'Add Link',
        icon: 'link',
        color: '#43e97b',
        description: 'Paste URL',
    },
];

export const DiscoverScreen = () => {
    const { addPlaylistFromUrl } = usePlaylist();

    const [activeTab, setActiveTab] = useState<DiscoverTab>('local');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPlatform, setSelectedPlatform] = useState<SearchPlatform>('youtube');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<OnlineSearchResult[]>([]);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkName, setLinkName] = useState('');
    const [isAddingLink, setIsAddingLink] = useState(false);

    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [showPlayer, setShowPlayer] = useState(false);

    const handlePickLocalFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['video/*', 'audio/*'],
                copyToCacheDirectory: true,
                multiple: false,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const file = result.assets[0];
                const channel: Channel = {
                    id: `local-${Date.now()}`,
                    name: file.name || 'Local Media',
                    url: file.uri,
                    group: 'Local Files',
                };
                setSelectedChannel(channel);
                setShowPlayer(true);
            }
        } catch (error) {
            console.error('Error picking file:', error);
            Alert.alert('Error', 'Failed to pick file');
        }
    };

    const handleOnlineSearch = useCallback(async () => {
        if (!searchQuery.trim()) return;

        Keyboard.dismiss();
        setIsSearching(true);

        try {
            let results: OnlineSearchResult[] = [];

            if (selectedPlatform === 'youtube') {
                const ytResults = await OnlineSearchService.searchYouTube(searchQuery);
                results = ytResults.map(r => ({
                    platform: 'youtube' as SearchPlatform,
                    id: r.videoId,
                    title: r.title,
                    artist: r.author,
                    thumbnail: r.thumbnail,
                    duration: r.duration,
                    viewCount: r.viewCount,
                }));
            } else if (selectedPlatform === 'soundcloud') {
                const scResults = await OnlineSearchService.searchSoundCloud(searchQuery);
                results = scResults.map(r => ({
                    platform: 'soundcloud' as SearchPlatform,
                    id: r.id,
                    title: r.title,
                    artist: r.artist,
                    thumbnail: r.thumbnail,
                    duration: r.duration,
                    viewCount: r.playbackCount,
                }));
            } else if (selectedPlatform === 'spotify') {
                const spResults = await OnlineSearchService.searchSpotify(searchQuery);
                results = spResults.map(r => ({
                    platform: 'spotify' as SearchPlatform,
                    id: r.id,
                    title: r.title,
                    artist: r.artist,
                    thumbnail: r.thumbnail,
                    duration: r.duration,
                    streamUrl: r.previewUrl,
                }));
            }

            setSearchResults(results);
        } catch (error: any) {
            console.error('Search error:', error);
            Alert.alert('Search Error', error.message || 'Failed to search');
        } finally {
            setIsSearching(false);
        }
    }, [searchQuery, selectedPlatform]);

    const handleAddLink = async () => {
        if (!linkUrl.trim()) {
            Alert.alert('Error', 'Please enter a URL');
            return;
        }

        setIsAddingLink(true);

        try {
            await addPlaylistFromUrl(linkUrl, linkName || 'New Playlist', 'm3u');
            Alert.alert('Success', 'Playlist added!');
            setLinkUrl('');
            setLinkName('');
        } catch (error: any) {
            console.error('Add link error:', error);
            Alert.alert('Error', error.message || 'Failed to add link');
        } finally {
            setIsAddingLink(false);
        }
    };

    const handlePlayResult = async (result: OnlineSearchResult) => {
        try {
            let streamUrl = result.streamUrl;

            if (result.platform === 'youtube' && !streamUrl) {
                streamUrl = await OnlineSearchService.getYouTubeStreamUrl(result.id);
            }

            if (!streamUrl) {
                throw new Error('Could not get stream URL');
            }

            const channel: Channel = {
                id: `${result.platform}-${result.id}`,
                name: result.title,
                url: streamUrl,
                logo: result.thumbnail,
                group: result.platform,
            };

            setSelectedChannel(channel);
            setShowPlayer(true);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to play');
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Discover</Text>
                    <Text style={styles.headerSubtitle}>Find your content</Text>
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Source tabs */}
                    <View style={styles.sourceCards}>
                        {SOURCE_OPTIONS.map((source) => (
                            <TouchableOpacity
                                key={source.id}
                                style={[styles.sourceCard, activeTab === source.id && styles.sourceCardActive]}
                                onPress={() => setActiveTab(source.id)}
                            >
                                <View style={[styles.sourceIcon, { backgroundColor: `${source.color}20` }]}>
                                    <Ionicons name={source.icon} size={24} color={source.color} />
                                </View>
                                <Text style={styles.sourceTitle}>{source.title}</Text>
                                <Text style={styles.sourceDesc}>{source.description}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Local files tab */}
                    {activeTab === 'local' && (
                        <View style={styles.tabContent}>
                            <GlassCard variant="purple" padding="large" style={styles.centerCard}>
                                <Ionicons name="folder-open" size={64} color={Colors.accent} />
                                <Text style={styles.cardTitle}>Browse Local Files</Text>
                                <Text style={styles.cardDesc}>Select video or audio files from your device</Text>
                                <TouchableOpacity style={styles.actionButton} onPress={handlePickLocalFile}>
                                    <LinearGradient colors={Gradients.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionButtonGradient}>
                                        <Ionicons name="folder-open-outline" size={20} color="#fff" />
                                        <Text style={styles.actionButtonText}>Browse Files</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </GlassCard>
                            <Text style={styles.supportText}>Supported: MP4, MKV, AVI, MOV, MP3, AAC, FLAC</Text>
                        </View>
                    )}

                    {/* Online search tab */}
                    {activeTab === 'online' && (
                        <View style={styles.tabContent}>
                            <View style={styles.platformSelector}>
                                {(['youtube', 'soundcloud', 'spotify'] as SearchPlatform[]).map((p) => (
                                    <TouchableOpacity
                                        key={p}
                                        style={[styles.platformChip, selectedPlatform === p && styles.platformChipActive]}
                                        onPress={() => setSelectedPlatform(p)}
                                    >
                                        <Ionicons
                                            name={p === 'youtube' ? 'logo-youtube' : 'musical-notes'}
                                            size={16}
                                            color={selectedPlatform === p ? '#fff' : Colors.textSecondary}
                                        />
                                        <Text style={[styles.platformText, selectedPlatform === p && styles.platformTextActive]}>
                                            {p.charAt(0).toUpperCase() + p.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.searchContainer}>
                                <Ionicons name="search" size={20} color={Colors.textTertiary} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search..."
                                    placeholderTextColor={Colors.textTertiary}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    onSubmitEditing={handleOnlineSearch}
                                    returnKeyType="search"
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <TouchableOpacity style={styles.searchButton} onPress={handleOnlineSearch}>
                                <LinearGradient colors={Gradients.secondary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.searchButtonGradient}>
                                    <Ionicons name="search" size={20} color="#fff" />
                                    <Text style={styles.searchButtonText}>Search</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            {isSearching ? (
                                <View style={styles.loadingContainer}>
                                    <LoadingSpinner text="Searching..." size="large" />
                                </View>
                            ) : searchResults.length > 0 ? (
                                <FlatList
                                    data={searchResults}
                                    keyExtractor={(item) => `${item.platform}-${item.id}`}
                                    style={styles.resultsList}
                                    scrollEnabled={false}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity style={styles.resultCard} onPress={() => handlePlayResult(item)}>
                                            <View style={styles.resultThumb}>
                                                <Ionicons name="play" size={24} color="#fff" />
                                            </View>
                                            <View style={styles.resultInfo}>
                                                <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
                                                <Text style={styles.resultArtist} numberOfLines={1}>{item.artist}</Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
                                        </TouchableOpacity>
                                    )}
                                />
                            ) : null}
                        </View>
                    )}

                    {/* Add link tab */}
                    {activeTab === 'link' && (
                        <View style={styles.tabContent}>
                            <GlassCard variant="purple" padding="large">
                                <Text style={styles.cardTitle}>Add Playlist or Media Link</Text>
                                <Text style={styles.cardDesc}>Paste an M3U playlist URL or direct video link</Text>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>URL *</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="https://example.com/playlist.m3u"
                                        placeholderTextColor={Colors.textTertiary}
                                        value={linkUrl}
                                        onChangeText={setLinkUrl}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Name (optional)</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="My Playlist"
                                        placeholderTextColor={Colors.textTertiary}
                                        value={linkName}
                                        onChangeText={setLinkName}
                                    />
                                </View>

                                <TouchableOpacity style={styles.addButton} onPress={handleAddLink} disabled={isAddingLink}>
                                    <LinearGradient colors={Gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addButtonGradient}>
                                        {isAddingLink ? (
                                            <LoadingSpinner size="small" />
                                        ) : (
                                            <>
                                                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                                                <Text style={styles.addButtonText}>Add Playlist</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </GlassCard>
                        </View>
                    )}

                    <View style={{ height: Layout.tabBarHeight + 20 }} />
                </ScrollView>
            </SafeAreaView>

            {selectedChannel && (
                <Modal visible={showPlayer} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowPlayer(false)}>
                    <VideoPlayer
                        channel={selectedChannel}
                        onClose={() => {
                            setShowPlayer(false);
                            setSelectedChannel(null);
                        }}
                    />
                </Modal>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    safeArea: { flex: 1 },
    header: { paddingHorizontal: Layout.screenPadding, paddingVertical: Spacing.lg },
    headerTitle: { fontSize: FontSizes.xxxl, fontWeight: '700', color: Colors.text },
    headerSubtitle: { fontSize: FontSizes.md, color: Colors.textSecondary, marginTop: Spacing.xs },
    scrollView: { flex: 1 },
    sourceCards: { flexDirection: 'row', paddingHorizontal: Layout.screenPadding, gap: Spacing.sm, marginBottom: Spacing.lg },
    sourceCard: { flex: 1, backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
    sourceCardActive: { borderColor: Colors.primary, backgroundColor: 'rgba(118, 75, 162, 0.15)' },
    sourceIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
    sourceTitle: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.text, textAlign: 'center' },
    sourceDesc: { fontSize: FontSizes.xs, color: Colors.textTertiary, textAlign: 'center', marginTop: 2 },
    tabContent: { paddingHorizontal: Layout.screenPadding },
    centerCard: { alignItems: 'center' },
    cardTitle: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text, marginTop: Spacing.lg, marginBottom: Spacing.sm, textAlign: 'center' },
    cardDesc: { fontSize: FontSizes.md, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },
    actionButton: { borderRadius: BorderRadius.full, overflow: 'hidden', ...Shadows.md },
    actionButtonGradient: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
    actionButtonText: { fontSize: FontSizes.md, fontWeight: '600', color: '#fff' },
    supportText: { fontSize: FontSizes.sm, color: Colors.textTertiary, textAlign: 'center', marginTop: Spacing.lg },
    platformSelector: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
    platformChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.backgroundCard, borderWidth: 1, borderColor: Colors.border },
    platformChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    platformText: { fontSize: FontSizes.xs, fontWeight: '600', color: Colors.textSecondary },
    platformTextActive: { color: '#fff' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
    searchInput: { flex: 1, paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm, fontSize: FontSizes.md, color: Colors.text },
    searchButton: { borderRadius: BorderRadius.md, overflow: 'hidden', marginBottom: Spacing.lg },
    searchButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
    searchButtonText: { fontSize: FontSizes.md, fontWeight: '600', color: '#fff' },
    loadingContainer: { paddingVertical: Spacing.xxl, alignItems: 'center' },
    resultsList: { marginBottom: Spacing.md },
    resultCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.md, marginBottom: Spacing.sm },
    resultThumb: { width: 48, height: 48, borderRadius: BorderRadius.sm, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
    resultInfo: { flex: 1 },
    resultTitle: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
    resultArtist: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
    inputGroup: { marginBottom: Spacing.md },
    inputLabel: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
    textInput: { backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontSize: FontSizes.md, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
    addButton: { borderRadius: BorderRadius.md, overflow: 'hidden', marginTop: Spacing.md },
    addButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
    addButtonText: { fontSize: FontSizes.md, fontWeight: '600', color: '#fff' },
});

export default DiscoverScreen;
