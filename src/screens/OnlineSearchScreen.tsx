
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnlineResultCard } from '../components/channel/OnlineResultCard';
import { AdvancedVideoPlayer } from '../components/player/AdvancedVideoPlayer';
import { Button, EmptyState, Input, LoadingSpinner } from '../components/ui';
import { PlatformTabs } from '../components/ui/PlatformTabs';
import { BorderRadius, Colors, FontSizes, Shadows, Spacing } from '../constants/theme';
import { useQueue } from '../contexts/QueueContext';
import { useTranslation } from '../i18n/useTranslation';
import {
  OnlineSearchResult,
  OnlineSearchService,
  SearchPlatform,
} from '../services/OnlineSearchService';
import { Channel } from '../types';

export const OnlineSearchScreen = () => {
  const { t } = useTranslation();
  const { addToQueue } = useQueue();


  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<SearchPlatform>('youtube');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<OnlineSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);


  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isLoadingStream, setIsLoadingStream] = useState(false);


  const [recentSearches, setRecentSearches] = useState<string[]>([
    'lofi hip hop',
    'jazz music',
    'workout playlist',
  ]);


  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a search term');
      return;
    }

    Keyboard.dismiss();
    setIsSearching(true);
    setHasSearched(true);

    try {
      let searchResults: OnlineSearchResult[] = [];

      switch (selectedPlatform) {
        case 'youtube':
          const ytResults = await OnlineSearchService.searchYouTube(searchQuery);
          searchResults = ytResults.map(r => ({
            platform: 'youtube' as SearchPlatform,
            id: r.videoId,
            title: r.title,
            artist: r.author,
            thumbnail: r.thumbnail,
            duration: r.duration,
            viewCount: r.viewCount,
            description: r.description,
          }));
          break;

        case 'soundcloud':
          const scResults = await OnlineSearchService.searchSoundCloud(searchQuery);
          searchResults = scResults.map(r => ({
            platform: 'soundcloud' as SearchPlatform,
            id: r.id,
            title: r.title,
            artist: r.artist,
            thumbnail: r.thumbnail,
            duration: r.duration,
            viewCount: r.playbackCount,
            streamUrl: r.streamUrl,
          }));
          break;

        case 'spotify':
          const spResults = await OnlineSearchService.searchSpotify(searchQuery);
          searchResults = spResults.map(r => ({
            platform: 'spotify' as SearchPlatform,
            id: r.id,
            title: r.title,
            artist: r.artist,
            thumbnail: r.thumbnail,
            duration: r.duration,
            streamUrl: r.previewUrl,
          }));
          break;
      }

      setResults(searchResults);


      if (!recentSearches.includes(searchQuery.trim())) {
        setRecentSearches(prev => [searchQuery.trim(), ...prev.slice(0, 4)]);
      }

      if (searchResults.length === 0) {
        Alert.alert(
          'No Results',
          `No results found for "${searchQuery}" on ${selectedPlatform}. Try a different search term.`
        );
      }
    } catch (error: any) {
      console.error('Search error:', error);
      Alert.alert(
        'Search Error',
        `Failed to search ${selectedPlatform}. Please try again.\n\n${error.message || ''}`
      );
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, selectedPlatform, recentSearches]);


  const handlePlay = useCallback(async (result: OnlineSearchResult) => {
    setIsLoadingStream(true);

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
        group: result.platform.charAt(0).toUpperCase() + result.platform.slice(1),
      };

      setSelectedChannel(channel);
    } catch (error: any) {
      console.error('Play error:', error);
      Alert.alert(
        'Playback Error',
        `Failed to play "${result.title}". ${error.message || 'Please try again.'}`
      );
    } finally {
      setIsLoadingStream(false);
    }
  }, []);


  const handleAddToQueue = useCallback(async (result: OnlineSearchResult) => {
    try {
      let streamUrl = result.streamUrl;

      // Get the original source URL for refreshing later
      const sourceUrl = result.platform === 'youtube'
        ? `https://www.youtube.com/watch?v=${result.id}`
        : result.platform === 'soundcloud'
          ? result.url || `https://soundcloud.com/track/${result.id}`
          : undefined;

      if (result.platform === 'youtube' && !streamUrl) {
        setIsLoadingStream(true);
        streamUrl = await OnlineSearchService.getYouTubeStreamUrl(result.id);
        setIsLoadingStream(false);
      }

      if (!streamUrl) {
        throw new Error('Could not get stream URL');
      }

      const channel: Channel = {
        id: `${result.platform}-${result.id}`,
        name: result.title,
        url: streamUrl,
        logo: result.thumbnail,
        group: result.platform.charAt(0).toUpperCase() + result.platform.slice(1),
        // Store source for refreshing expired streams
        sourceUrl: sourceUrl,
        sourceType: result.platform as 'youtube' | 'soundcloud',
      };

      addToQueue(channel);
      Alert.alert('Added to Queue', `"${result.title}" has been added to your queue.`);
    } catch (error: any) {
      console.error('Add to queue error:', error);
      Alert.alert('Error', 'Failed to add to queue. Please try again.');
    }
  }, [addToQueue]);


  const handleClosePlayer = useCallback(() => {
    setSelectedChannel(null);
  }, []);


  const renderResultItem = useCallback(({ item }: { item: OnlineSearchResult }) => (
    <OnlineResultCard
      result={item}
      onPlay={handlePlay}
      onAddToQueue={handleAddToQueue}
    />
  ), [handlePlay, handleAddToQueue]);


  const getPlatformInfo = () => {
    switch (selectedPlatform) {
      case 'youtube':
        return {
          name: 'YouTube',
          color: '#FF0000',
          icon: 'logo-youtube' as const,
          hints: ['lofi hip hop', 'music video', 'live concert', 'remix'],
        };
      case 'soundcloud':
        return {
          name: 'SoundCloud',
          color: '#FF5500',
          icon: 'musical-notes' as const,
          hints: ['electronic', 'indie', 'hip hop beats', 'podcast'],
        };
      case 'spotify':
        return {
          name: 'Spotify',
          color: '#1DB954',
          icon: 'musical-note' as const,
          hints: ['top hits', 'chill vibes', 'workout', 'focus'],
        };
    }
  };

  const platformInfo = getPlatformInfo();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      { }
      {isLoadingStream && (
        <LoadingSpinner
          overlay={true}
          text="Loading stream..."
          size="large"
        />
      )}

      { }
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="globe-outline" size={28} color={Colors.primary} />
          <Text style={styles.title}>Online Search</Text>
        </View>
        <View style={[styles.platformIndicator, { backgroundColor: platformInfo.color }]}>
          <Ionicons name={platformInfo.icon} size={16} color="#fff" />
          <Text style={styles.platformIndicatorText}>{platformInfo.name}</Text>
        </View>
      </View>

      { }
      <PlatformTabs
        selectedPlatform={selectedPlatform}
        onSelectPlatform={(platform) => {
          setSelectedPlatform(platform);
          setResults([]);
          setHasSearched(false);
        }}
      />

      { }
      <View style={styles.searchSection}>
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={`Search ${platformInfo.name}...`}
          leftIcon="search"
          rightIcon={searchQuery.length > 0 ? "close-circle" : undefined}
          onRightIconPress={searchQuery.length > 0 ? () => setSearchQuery('') : undefined}
          onSubmitEditing={handleSearch}
          containerStyle={styles.searchInput}
          returnKeyType="search"
        />
        <Button
          title="Search"
          variant="primary"
          size="medium"
          onPress={handleSearch}
          icon="search"
          loading={isSearching}
          style={[styles.searchButton, { backgroundColor: platformInfo.color }]}
        />
      </View>

      { }
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hintsContainer}
      >
        {platformInfo.hints.map((hint) => (
          <TouchableOpacity
            key={hint}
            style={[styles.hintChip, { borderColor: platformInfo.color }]}
            onPress={() => {
              setSearchQuery(hint);
              setTimeout(handleSearch, 100);
            }}
          >
            <Text style={[styles.hintText, { color: platformInfo.color }]}>{hint}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      { }
      {isSearching ? (
        <View style={styles.loadingContainer}>
          <LoadingSpinner text={`Searching ${platformInfo.name}...`} size="large" />
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          renderItem={renderResultItem}
          keyExtractor={(item) => `${item.platform}-${item.id}`}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
        />
      ) : hasSearched ? (
        <EmptyState
          icon="search-outline"
          title="No Results Found"
          description={`Try searching for something else on ${platformInfo.name}`}
        />
      ) : (
        <ScrollView style={styles.welcomeContainer} showsVerticalScrollIndicator={false}>
          { }
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <View style={styles.recentList}>
                {recentSearches.map((search, index) => (
                  <TouchableOpacity
                    key={`${search}-${index}`}
                    style={styles.recentItem}
                    onPress={() => {
                      setSearchQuery(search);
                      setTimeout(handleSearch, 100);
                    }}
                  >
                    <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.recentText}>{search}</Text>
                    <Ionicons name="arrow-forward" size={16} color={Colors.textTertiary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          { }
          <View style={styles.instructionsCard}>
            <View style={styles.instructionsHeader}>
              <Ionicons name="information-circle" size={24} color={platformInfo.color} />
              <Text style={styles.instructionsTitle}>How to Use</Text>
            </View>
            <View style={styles.instructionsList}>
              <View style={styles.instructionItem}>
                <View style={[styles.instructionNumber, { backgroundColor: platformInfo.color }]}>
                  <Text style={styles.instructionNumberText}>1</Text>
                </View>
                <Text style={styles.instructionText}>
                  Select platform (YouTube, SoundCloud, or Spotify)
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={[styles.instructionNumber, { backgroundColor: platformInfo.color }]}>
                  <Text style={styles.instructionNumberText}>2</Text>
                </View>
                <Text style={styles.instructionText}>
                  Enter search keywords and tap Search
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={[styles.instructionNumber, { backgroundColor: platformInfo.color }]}>
                  <Text style={styles.instructionNumberText}>3</Text>
                </View>
                <Text style={styles.instructionText}>
                  Tap any result to play or add to queue
                </Text>
              </View>
            </View>

            { }
            <View style={styles.noteBox}>
              <Ionicons name="alert-circle-outline" size={18} color={Colors.warning} />
              <Text style={styles.noteText}>
                {selectedPlatform === 'spotify'
                  ? 'Spotify: Preview only (30s). Full playback requires Spotify Premium.'
                  : selectedPlatform === 'soundcloud'
                    ? 'SoundCloud: Some tracks may have limited availability.'
                    : 'YouTube: Using free API proxy. Some videos may not be available.'}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      { }
      <Modal
        visible={selectedChannel !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleClosePlayer}
      >
        {selectedChannel && (
          <AdvancedVideoPlayer
            channel={selectedChannel}
            onClose={handleClosePlayer}
            onError={(error) => {
              console.error('Player error:', error);
              Alert.alert('Playback Error', error);
            }}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  platformIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  platformIndicatorText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: '#fff',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  searchButton: {
    minWidth: 100,
  },
  hintsContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  hintChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  hintText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsList: {
    paddingVertical: Spacing.sm,
  },
  welcomeContainer: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  recentList: {
    gap: Spacing.xs,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
  },
  recentText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  instructionsCard: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  instructionsTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  instructionsList: {
    gap: Spacing.md,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionNumberText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: '#fff',
  },
  instructionText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  noteText: {
    flex: 1,
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    lineHeight: 18,
  },
});
