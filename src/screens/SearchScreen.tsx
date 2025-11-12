// Advanced Search Screen with Filters
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePlaylist } from '../contexts/PlaylistContext';
import { useTranslation } from '../i18n/useTranslation';
import { ChannelItem } from '../components/channel/ChannelItem';
import { EmptyState } from '../components/common/EmptyState';
import { Channel } from '../types';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/theme';

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
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchChannels')}
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
        >
          <TouchableOpacity
            style={[styles.chip, activeFilter === 'all' && styles.chipActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text
              style={[styles.chipText, activeFilter === 'all' && styles.chipTextActive]}
            >
              {t('all')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, activeFilter === 'favorites' && styles.chipActive]}
            onPress={() => setActiveFilter('favorites')}
          >
            <Ionicons
              name="heart"
              size={16}
              color={activeFilter === 'favorites' ? Colors.text : Colors.textSecondary}
            />
            <Text
              style={[
                styles.chipText,
                activeFilter === 'favorites' && styles.chipTextActive,
              ]}
            >
              {t('favorites')}
            </Text>
          </TouchableOpacity>

          {allGroups.map(group => (
            <TouchableOpacity
              key={group}
              style={[styles.chip, selectedGroups.includes(group) && styles.chipActive]}
              onPress={() => toggleGroup(group)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedGroups.includes(group) && styles.chipTextActive,
                ]}
              >
                {group}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results Count & Clear */}
        <View style={styles.resultsBar}>
          <Text style={styles.resultsText}>
            {filteredChannels.length} {t('channels')}
          </Text>
          {(selectedGroups.length > 0 || activeFilter !== 'all' || searchQuery) && (
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearText}>{t('clear')}</Text>
            </TouchableOpacity>
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
        <FlatList
          data={filteredChannels}
          renderItem={({ item }) => (
            <ChannelItem
              channel={item}
              onPress={() => {
                // Handle channel play
              }}
              isFavorite={isFavorite(item.id)}
              onToggleFavorite={() => toggleFavorite(item.id)}
            />
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  filterChips: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.text,
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
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  list: {
    padding: Spacing.md,
  },
});
