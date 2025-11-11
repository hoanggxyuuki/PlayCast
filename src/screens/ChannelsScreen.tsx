// Channels Screen - Display all channels from a playlist
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePlaylist } from '../contexts/PlaylistContext';
import { useHistory } from '../contexts/HistoryContext';
import { ChannelItem } from '../components/channel/ChannelItem';
import { EmptyState } from '../components/common/EmptyState';
import { AdvancedVideoPlayer } from '../components/player/AdvancedVideoPlayer';
import { Channel } from '../types';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/theme';

interface ChannelsScreenProps {
  playlistId: string;
  onBack: () => void;
}

export const ChannelsScreen: React.FC<ChannelsScreenProps> = ({
  playlistId,
  onBack,
}) => {
  const { playlists, favorites, toggleFavorite, isFavorite } = usePlaylist();
  const { getHistoryForChannel } = useHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [startPosition, setStartPosition] = useState(0);

  const playlist = playlists.find(p => p.id === playlistId);

  // Group channels by category
  const groupedChannels = useMemo(() => {
    if (!playlist) return new Map();

    const grouped = new Map<string, Channel[]>();
    playlist.channels.forEach(channel => {
      const group = channel.group || 'Uncategorized';
      if (!grouped.has(group)) {
        grouped.set(group, []);
      }
      grouped.get(group)!.push(channel);
    });

    return grouped;
  }, [playlist]);

  // Filter channels based on search and selected group
  const filteredChannels = useMemo(() => {
    if (!playlist) return [];

    let channels = playlist.channels;

    // Filter by group
    if (selectedGroup) {
      channels = channels.filter(c => (c.group || 'Uncategorized') === selectedGroup);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      channels = channels.filter(c =>
        c.name.toLowerCase().includes(query) ||
        (c.group && c.group.toLowerCase().includes(query))
      );
    }

    return channels;
  }, [playlist, searchQuery, selectedGroup]);

  const handlePlayChannel = (channel: Channel) => {
    // Get resume position from history
    const history = getHistoryForChannel(channel.id);
    const resumeTime = history?.currentTime || 0;

    setSelectedChannel(channel);
    setStartPosition(resumeTime);
    setShowPlayer(true);
  };

  const handleClosePlayer = () => {
    setShowPlayer(false);
    setSelectedChannel(null);
  };

  if (!playlist) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="alert-circle-outline"
          title="Playlist Not Found"
          description="The requested playlist could not be found"
        />
      </SafeAreaView>
    );
  }

  const groups = Array.from(groupedChannels.keys()).sort();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={1}>
            {playlist.name}
          </Text>
          <Text style={styles.subtitle}>
            {filteredChannels.length} channels
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search channels..."
          placeholderTextColor={Colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Group Filter */}
      {groups.length > 1 && (
        <View style={styles.groupContainer}>
          <FlatList
            horizontal
            data={['All', ...groups]}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.groupChip,
                  (item === 'All' && !selectedGroup) ||
                  item === selectedGroup
                    ? styles.groupChipActive
                    : null,
                ]}
                onPress={() => setSelectedGroup(item === 'All' ? null : item)}
              >
                <Text
                  style={[
                    styles.groupChipText,
                    (item === 'All' && !selectedGroup) ||
                    item === selectedGroup
                      ? styles.groupChipTextActive
                      : null,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.groupList}
          />
        </View>
      )}

      {/* Channels List */}
      {filteredChannels.length === 0 ? (
        <EmptyState
          icon="tv-outline"
          title="No Channels Found"
          description={
            searchQuery
              ? 'Try a different search term'
              : 'This playlist has no channels'
          }
        />
      ) : (
        <FlatList
          data={filteredChannels}
          renderItem={({ item }) => (
            <ChannelItem
              channel={item}
              onPress={() => handlePlayChannel(item)}
              isFavorite={isFavorite(item.id)}
              onToggleFavorite={() => toggleFavorite(item.id)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Video Player Modal */}
      {selectedChannel && (
        <Modal
          visible={showPlayer}
          animationType="fade"
          presentationStyle="fullScreen"
          onRequestClose={handleClosePlayer}
        >
          <AdvancedVideoPlayer
            channel={selectedChannel}
            onClose={handleClosePlayer}
            onError={(error) => console.error('Player error:', error)}
            startPosition={startPosition}
          />
        </Modal>
      )}
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  groupContainer: {
    marginBottom: Spacing.md,
  },
  groupList: {
    paddingHorizontal: Spacing.md,
  },
  groupChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  groupChipText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  groupChipTextActive: {
    color: Colors.text,
  },
  listContent: {
    paddingBottom: Spacing.lg,
  },
});
