// Online Search Screen - Search for IPTV channels online
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../constants/theme';
import { useTranslation } from '../i18n/useTranslation';
import { usePlaylist } from '../contexts/PlaylistContext';
import { M3UParser } from '../services/m3uParser';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'playlist' | 'github' | 'stream';
}

export const OnlineSearchScreen = () => {
  const { t } = useTranslation();
  const { addPlaylist } = usePlaylist();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // Popular IPTV resources
  const popularResources = [
    {
      id: '1',
      title: 'IPTV-ORG Collection',
      description: '8000+ free IPTV channels from around the world',
      url: 'https://github.com/iptv-org/iptv',
      type: 'github' as const,
    },
    {
      id: '2',
      title: 'Free-TV GitHub',
      description: 'Curated list of publicly available IPTV channels',
      url: 'https://github.com/Free-TV/IPTV',
      type: 'github' as const,
    },
    {
      id: '3',
      title: 'IPTV Playlist Search',
      description: 'Search for M3U playlists by country or category',
      url: 'https://iptv-org.github.io/',
      type: 'playlist' as const,
    },
    {
      id: '4',
      title: 'Awesome IPTV',
      description: 'A curated list of IPTV resources and channels',
      url: 'https://github.com/iptv-org/awesome-iptv',
      type: 'github' as const,
    },
  ];

  // Search suggestions based on query
  const getSearchSuggestions = (query: string): SearchResult[] => {
    const lowerQuery = query.toLowerCase();
    const suggestions: SearchResult[] = [];

    if (query.length < 2) return [];

    // Country-based suggestions
    const countries = [
      { name: 'Vietnam', url: 'https://iptv-org.github.io/iptv/countries/vn.m3u' },
      { name: 'USA', url: 'https://iptv-org.github.io/iptv/countries/us.m3u' },
      { name: 'UK', url: 'https://iptv-org.github.io/iptv/countries/uk.m3u' },
      { name: 'France', url: 'https://iptv-org.github.io/iptv/countries/fr.m3u' },
      { name: 'Germany', url: 'https://iptv-org.github.io/iptv/countries/de.m3u' },
      { name: 'Spain', url: 'https://iptv-org.github.io/iptv/countries/es.m3u' },
      { name: 'Italy', url: 'https://iptv-org.github.io/iptv/countries/it.m3u' },
      { name: 'Japan', url: 'https://iptv-org.github.io/iptv/countries/jp.m3u' },
      { name: 'Korea', url: 'https://iptv-org.github.io/iptv/countries/kr.m3u' },
      { name: 'China', url: 'https://iptv-org.github.io/iptv/countries/cn.m3u' },
    ];

    countries.forEach((country) => {
      if (country.name.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          id: `country-${country.name}`,
          title: `${country.name} Channels`,
          description: `Free IPTV channels from ${country.name}`,
          url: country.url,
          type: 'playlist',
        });
      }
    });

    // Category-based suggestions
    const categories = [
      { name: 'News', url: 'https://iptv-org.github.io/iptv/categories/news.m3u' },
      { name: 'Sports', url: 'https://iptv-org.github.io/iptv/categories/sports.m3u' },
      { name: 'Movies', url: 'https://iptv-org.github.io/iptv/categories/movies.m3u' },
      { name: 'Music', url: 'https://iptv-org.github.io/iptv/categories/music.m3u' },
      { name: 'Kids', url: 'https://iptv-org.github.io/iptv/categories/kids.m3u' },
      { name: 'Documentary', url: 'https://iptv-org.github.io/iptv/categories/documentary.m3u' },
      { name: 'Entertainment', url: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u' },
    ];

    categories.forEach((category) => {
      if (category.name.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          id: `category-${category.name}`,
          title: `${category.name} Channels`,
          description: `Browse ${category.name.toLowerCase()} channels worldwide`,
          url: category.url,
          type: 'playlist',
        });
      }
    });

    return suggestions;
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a search term');
      return;
    }

    setIsSearching(true);

    // Get suggestions based on query
    const suggestions = getSearchSuggestions(searchQuery);

    setTimeout(() => {
      setResults(suggestions);
      setIsSearching(false);

      if (suggestions.length === 0) {
        Alert.alert(
          'No Results',
          'Try searching for a country (e.g., "Vietnam", "USA") or category (e.g., "News", "Sports")'
        );
      }
    }, 500);
  };

  const handleAddPlaylist = async (item: SearchResult) => {
    setIsAdding(true);
    try {
      // Fetch M3U content from URL
      const response = await fetch(item.url);
      const m3uContent = await response.text();

      // Parse M3U
      const channels = await M3UParser.parseM3U(m3uContent);

      if (channels.length === 0) {
        Alert.alert('Error', 'No channels found in this playlist');
        setIsAdding(false);
        return;
      }

      // Add playlist
      await addPlaylist({
        name: item.title,
        url: item.url,
        type: 'm3u',
        channels,
        description: item.description,
      });

      Alert.alert(
        'Success!',
        `Added "${item.title}" with ${channels.length} channels!\n\nGo to Playlists tab to view.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error adding playlist:', error);
      Alert.alert('Error', 'Failed to load playlist. The URL might be invalid or unreachable.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleOpenResource = (item: SearchResult) => {
    Alert.alert(
      item.title,
      `${item.description}\n\nURL: ${item.url}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add Playlist',
          onPress: () => handleAddPlaylist(item),
        },
        {
          text: 'Copy URL',
          onPress: async () => {
            await Clipboard.setStringAsync(item.url);
            Alert.alert('Copied!', 'URL copied to clipboard.');
          },
        },
        {
          text: 'Open Browser',
          onPress: () => Linking.openURL(item.url),
        },
      ]
    );
  };

  const renderResourceCard = (item: SearchResult) => (
    <TouchableOpacity
      key={item.id}
      style={styles.card}
      onPress={() => handleOpenResource(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardIcon}>
        <Ionicons
          name={
            item.type === 'github'
              ? 'logo-github'
              : item.type === 'playlist'
              ? 'list'
              : 'tv'
          }
          size={32}
          color={Colors.primary}
        />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.cardUrl} numberOfLines={1}>
          {item.url}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Loading Overlay */}
      {isAdding && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingOverlayText}>Adding playlist...</Text>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>ONLINE SEARCH</Text>
        <Ionicons name="globe-outline" size={32} color={Colors.secondary} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={24} color={Colors.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by country or category..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={24} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>SEARCH</Text>
        </TouchableOpacity>
      </View>

      {/* Search Hints */}
      <View style={styles.hintsContainer}>
        <Text style={styles.hintsTitle}>Try searching:</Text>
        <View style={styles.hintChips}>
          {['Vietnam', 'USA', 'News', 'Sports', 'Movies'].map((hint) => (
            <TouchableOpacity
              key={hint}
              style={styles.hintChip}
              onPress={() => {
                setSearchQuery(hint);
                setTimeout(() => handleSearch(), 100);
              }}
            >
              <Text style={styles.hintChipText}>{hint}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Loading */}
        {isSearching && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {/* Search Results */}
        {!isSearching && results.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              SEARCH RESULTS ({results.length})
            </Text>
            {results.map(renderResourceCard)}
          </View>
        )}

        {/* Popular Resources */}
        {!isSearching && results.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>POPULAR RESOURCES</Text>
            <Text style={styles.sectionDescription}>
              Discover free IPTV channels from trusted sources
            </Text>
            {popularResources.map(renderResourceCard)}
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>HOW TO USE</Text>
          <View style={styles.instructionItem}>
            <Ionicons name="search" size={20} color={Colors.accent} />
            <Text style={styles.instructionText}>
              Search by country or category (e.g., "Vietnam", "News")
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="hand-left" size={20} color={Colors.accent} />
            <Text style={styles.instructionText}>
              Tap any result to open options dialog
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="add-circle" size={20} color={Colors.accent} />
            <Text style={styles.instructionText}>
              Click "Add Playlist" to import directly!
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="play-circle" size={20} color={Colors.accent} />
            <Text style={styles.instructionText}>
              Go to Playlists tab to watch channels
            </Text>
          </View>
        </View>
      </ScrollView>
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
    paddingVertical: Spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    ...Shadows.neonCyan,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 2,
    textShadowColor: Colors.primaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  searchSection: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: Colors.primary,
    gap: Spacing.md,
    ...Shadows.neonCyan,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '600',
    paddingVertical: Spacing.sm,
  },
  searchButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: Colors.secondary,
    alignItems: 'center',
    ...Shadows.neonMagenta,
  },
  searchButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: 1.5,
    textShadowColor: Colors.secondaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  hintsContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  hintsTitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  hintChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  hintChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: Colors.borderGlow,
  },
  hintChipText: {
    fontSize: FontSizes.sm,
    color: Colors.accent,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    marginTop: Spacing.md,
    fontWeight: '700',
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '900',
    color: Colors.secondary,
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
    textShadowColor: Colors.secondaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  sectionDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: 2,
    borderWidth: 2,
    borderLeftWidth: 4,
    borderColor: Colors.primary,
    borderLeftColor: Colors.secondary,
    ...Shadows.neonCyan,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 4,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  cardContent: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  cardTitle: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  cardUrl: {
    fontSize: FontSizes.xs,
    color: Colors.accent,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  instructions: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: Colors.purple,
    ...Shadows.neonPurple,
  },
  instructionsTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '900',
    color: Colors.purple,
    letterSpacing: 1.5,
    marginBottom: Spacing.lg,
    textShadowColor: Colors.purpleGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  instructionText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 10, 15, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingBox: {
    backgroundColor: Colors.backgroundCard,
    padding: Spacing.xxl,
    borderRadius: 2,
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: 'center',
    ...Shadows.neonCyan,
  },
  loadingOverlayText: {
    fontSize: FontSizes.lg,
    color: Colors.primary,
    marginTop: Spacing.lg,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: Colors.primaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
