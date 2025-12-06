// DISCOVER SCREEN - Local files, Online search, Add links
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
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
import { BorderRadius, Colors, FontSizes, Gradients, Layout, Spacing } from '../constants/theme';
import { usePlaylist } from '../contexts/PlaylistContext';
import { OnlineSearchResult, OnlineSearchService, SearchPlatform } from '../services/OnlineSearchService';
import { Channel } from '../types';

type DiscoverTab = 'local' | 'online' | 'link';

const SOURCE_OPTIONS = [
    { id: 'local' as DiscoverTab, title: 'Local Files', icon: 'folder-open' as const, color: '#4facfe', description: 'Play from device' },
    { id: 'online' as DiscoverTab, title: 'Online', icon: 'globe' as const, color: '#f093fb', description: 'YouTube, SoundCloud' },
    { id: 'link' as DiscoverTab, title: 'Add Link', icon: 'link' as const, color: '#43e97b', description: 'Paste URL' },
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
        setSearchResults([]);

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
                    duration: r.duration / 1000,
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
                    duration: r.duration / 1000,
                    streamUrl: r.previewUrl,
                }));
            }

            setSearchResults(results);
        } catch (error: any) {
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
            Alert.alert('Error', error.message || 'Failed to add link');
        } finally {
            setIsAddingLink(false);
        }
    };

    const handlePlayResult = async (result: OnlineSearchResult) => {
        try {
            setIsSearching(true);
            let streamUrl = result.streamUrl;

            if (result.platform === 'youtube' && !streamUrl) {
                streamUrl = await OnlineSearchService.getYouTubeStreamUrl(result.id);
            } else if (result.platform === 'soundcloud' && !streamUrl) {
                streamUrl = await OnlineSearchService.getSoundCloudStreamUrl(result.id);
            }

            if (!streamUrl) throw new Error('Could not get stream URL');

            const channel: Channel = {
                id: `${result.platform}-${result.id}`,
                name: result.title,
                url: streamUrl,
                logo: result.thumbnail,
                group: result.platform.charAt(0).toUpperCase() + result.platform.slice(1),
            };

            setSelectedChannel(channel);
            setShowPlayer(true);
        } catch (error: any) {
            Alert.alert('Playback Error', error.message || 'Failed to play');
        } finally {
            setIsSearching(false);
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

                    {activeTab === 'local' && (
                        <View style={styles.tabContent}>
                            <GlassCard variant="purple" padding="large" style={styles.centerCard}>
                                <Ionicons name="folder-open" size={64} color={Colors.accent} />
                                <Text style={styles.cardTitle}>Browse Local Files</Text>
                                <Text style={styles.cardDesc}>Select video or audio files</Text>
                                <TouchableOpacity style={styles.actionButton} onPress={handlePickLocalFile}>
                                    <LinearGradient colors={Gradients.accent as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionButtonGradient}>
                                        <Ionicons name="folder-open-outline" size={20} color="#fff" />
                                        <Text style={styles.actionButtonText}>Browse Files</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </GlassCard>
                        </View>
                    )}

                    {activeTab === 'online' && (
                        <View style={styles.tabContent}>
                            <View style={styles.platformSelector}>
                                {(['youtube', 'soundcloud'] as SearchPlatform[]).map((p) => (
                                    <TouchableOpacity
                                        key={p}
                                        style={[styles.platformChip, selectedPlatform === p && styles.platformChipActive]}
                                        onPress={() => { setSelectedPlatform(p); setSearchResults([]); }}
                                    >
                                        <Ionicons
                                            name={p === 'youtube' ? 'logo-youtube' : 'cloudy'}
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
                                    placeholder={`Search ${selectedPlatform}...`}
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

                            <TouchableOpacity style={styles.searchButton} onPress={handleOnlineSearch} disabled={isSearching}>
                                <LinearGradient colors={Gradients.secondary as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.searchButtonGradient}>
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
                                            {item.thumbnail ? (
                                                <Image source={{ uri: item.thumbnail }} style={styles.resultThumb} />
                                            ) : (
                                                <View style={[styles.resultThumb, styles.resultThumbPlaceholder]}>
                                                    <Ionicons name="play" size={24} color="#fff" />
                                                </View>
                                            )}
                                            <View style={styles.resultInfo}>
                                                <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
                                                <Text style={styles.resultArtist} numberOfLines={1}>{item.artist}</Text>
                                                {item.duration > 0 && (
                                                    <Text style={styles.resultDuration}>{OnlineSearchService.formatDuration(item.duration)}</Text>
                                                )}
                                            </View>
                                            <Ionicons name="play-circle" size={32} color={Colors.primary} />
                                        </TouchableOpacity>
                                    )}
                                />
                            ) : null}
                        </View>
                    )}

                    {activeTab === 'link' && (
                        <View style={styles.tabContent}>
                            <GlassCard variant="purple" padding="large">
                                <Text style={styles.cardTitle}>Add Playlist Link</Text>
                                <Text style={styles.cardDesc}>Paste M3U playlist URL</Text>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>URL *</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="https://example.com/playlist.m3u"
                                        placeholderTextColor={Colors.textTertiary}
                                        value={linkUrl}
                                        onChangeText={setLinkUrl}
                                        autoCapitalize="none"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Name</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="My Playlist"
                                        placeholderTextColor={Colors.textTertiary}
                                        value={linkName}
                                        onChangeText={setLinkName}
                                    />
                                </View>
                                <TouchableOpacity style={styles.addButton} onPress={handleAddLink} disabled={isAddingLink}>
                                    <LinearGradient colors={Gradients.primary as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addButtonGradient}>
                                        {isAddingLink ? <LoadingSpinner size="small" /> : (
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
                    <VideoPlayer channel={selectedChannel} onClose={() => { setShowPlayer(false); setSelectedChannel(null); }} />
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
    centerCard: { alignItems: 'center', gap: Spacing.md },
    cardTitle: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text, textAlign: 'center' },
    cardDesc: { fontSize: FontSizes.sm, color: Colors.textSecondary, textAlign: 'center' },
    actionButton: { marginTop: Spacing.md, borderRadius: BorderRadius.full, overflow: 'hidden' },
    actionButtonGradient: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
    actionButtonText: { color: '#fff', fontWeight: '600', fontSize: FontSizes.md },
    platformSelector: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
    platformChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.full, backgroundColor: Colors.backgroundCard, borderWidth: 1, borderColor: Colors.border },
    platformChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    platformText: { fontSize: FontSizes.sm, fontWeight: '500', color: Colors.textSecondary },
    platformTextActive: { color: '#fff' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginBottom: Spacing.md },
    searchInput: { flex: 1, fontSize: FontSizes.md, color: Colors.text, paddingVertical: Spacing.sm },
    searchButton: { borderRadius: BorderRadius.md, overflow: 'hidden', marginBottom: Spacing.lg },
    searchButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
    searchButtonText: { color: '#fff', fontWeight: '600', fontSize: FontSizes.md },
    loadingContainer: { paddingVertical: Spacing.xxl, alignItems: 'center' },
    resultsList: { marginTop: Spacing.sm },
    resultCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.md },
    resultThumb: { width: 80, height: 60, borderRadius: BorderRadius.sm, backgroundColor: Colors.surface },
    resultThumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
    resultInfo: { flex: 1 },
    resultTitle: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text, marginBottom: 2 },
    resultArtist: { fontSize: FontSizes.sm, color: Colors.textSecondary },
    resultDuration: { fontSize: FontSizes.xs, color: Colors.textTertiary, marginTop: 2 },
    inputGroup: { width: '100%', marginTop: Spacing.md },
    inputLabel: { fontSize: FontSizes.sm, fontWeight: '500', color: Colors.textSecondary, marginBottom: Spacing.xs },
    textInput: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSizes.md, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
    addButton: { marginTop: Spacing.lg, borderRadius: BorderRadius.md, overflow: 'hidden' },
    addButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
    addButtonText: { color: '#fff', fontWeight: '600', fontSize: FontSizes.md },
});

export default DiscoverScreen;
