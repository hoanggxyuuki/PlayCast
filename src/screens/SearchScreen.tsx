// Advanced Search Screen with Filters
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChannelItem } from '../components/channel/ChannelItem';
import { Chip, EmptyState, Input } from '../components/ui';
import { Colors, FontSizes, Spacing } from '../constants/theme';
import { usePlaylist } from '../contexts/PlaylistContext';
import { useTranslation } from '../i18n/useTranslation';

type FilterType = 'all' | 'favorites' | 'recent';
type SortType = 'name' | 'recent' | 'popular';

export const SearchScreen = () => {
  const { t } = useTranslation();
  const { playlists, favorites, isFavorite, toggleFavorite } = usePlaylist();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('name');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  // Get all channels from all playlists
  const allChannels = useMemo(() => {
    return playlists.flatMap(p => p.channels);
  }, [playlists]);

  // Get all unique groups
  const allGroups = useMemo(() => {
    const groups = new Set<string>();
    allChannels.forEach(channel => {
      if (channel.group) groups.add(channel.group);
    });
    return Array.from(groups).sort();
  }, [allChannels]);

  // Filter and search channels
  const filteredChannels = useMemo(() => {
    let channels = allChannels;

    // Apply filter type
    if (activeFilter === 'favorites') {
      channels = channels.filter(c => isFavorite(c.id));
    }

    // Apply group filter
    if (selectedGroups.length > 0) {
      channels = channels.filter(c => c.group && selectedGroups.includes(c.group));
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      channels = channels.filter(
        c =>
          c.name.toLowerCase().includes(query) ||
          (c.group && c.group.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    channels = [...channels].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      // Add more sorting options
      return 0;
    });

    return channels;
  }, [allChannels, searchQuery, activeFilter, selectedGroups, sortBy, isFavorite]);

  const toggleGroup = (group: string) => {
    setSelectedGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActiveFilter('all');
    setSelectedGroups([]);
    setSortBy('name');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('searchChannels')}
          leftIcon="search"
          rightIcon={searchQuery.length > 0 ? "close-circle" : undefined}
          onRightIconPress={searchQuery.length > 0 ? () => setSearchQuery('') : undefined}
          autoFocus
          containerStyle={styles.searchBar}
        />

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
        >
          <Chip
            title={t('all')}
            selected={activeFilter === 'all'}
            onPress={() => setActiveFilter('all')}
            variant="filter"
          />

          <Chip
            title={t('favorites')}
            selected={activeFilter === 'favorites'}
            onPress={() => setActiveFilter('favorites')}
            variant="filter"
            icon="heart"
          />

          {allGroups.map(group => (
            <Chip
              key={group}
              title={group}
              selected={selectedGroups.includes(group)}
              onPress={() => toggleGroup(group)}
              variant="category"
            />
          ))}
        </ScrollView>

        {/* Results Count & Clear */}
        <View style={styles.resultsBar}>
          <Text style={styles.resultsText}>
            {filteredChannels.length} {t('channels')}
          </Text>
          {(selectedGroups.length > 0 || activeFilter !== 'all' || searchQuery) && (
            <Chip
              title={t('clear')}
              onPress={clearFilters}
              variant="ghost"
              size="small"
            />
          )}
        </View>
      </View>

      {/* Results */}
      {filteredChannels.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title={t('noChannelsFound')}
          description={t('tryDifferentSearch')}
        />
      ) : (
        <List
          data={filteredChannels}
          renderItem={({ item }) => (
            <ChannelItem
              channel={item}
              onPress={() => {
                // TODO: Navigate to player with this channel
                console.log('Play channel:', item.name);
              }}
              isFavorite={isFavorite(item.id)}
              onToggleFavorite={() => toggleFavorite(item.id)}
            />
          )}
          keyExtractor={item => item.id}
          emptyState={{
            icon: 'search-outline',
            title: t('noChannelsFound'),
            description: t('tryDifferentSearch'),
          }}
          contentContainerStyle={styles.list}
          estimatedItemSize={80} // Approximate height for ChannelItem
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchSection: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    marginBottom: Spacing.md,
  },
  searchInput: {
    // Removed as handled by Input component
  },
  filterChips: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  chip: {
    // Removed as handled by Chip component
  },
  chipActive: {
    // Removed as handled by Chip component
  },
  chipText: {
    // Removed as handled by Chip component
  },
  chipTextActive: {
    // Removed as handled by Chip component
  },
  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  resultsText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  clearText: {
    // Removed as handled by Chip component
  },
  list: {
    padding: Spacing.md,
  },
});
