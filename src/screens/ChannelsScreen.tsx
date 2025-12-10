
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChannelItem } from '../components/channel/ChannelItem';
import { EmptyState } from '../components/common/EmptyState';
import { AdvancedVideoPlayer } from '../components/player/AdvancedVideoPlayer';
import { BorderRadius, Colors, FontSizes, Spacing } from '../constants/theme';
import { useHistory } from '../contexts/HistoryContext';
import { usePlaylist } from '../contexts/PlaylistContext';
import { useTranslation } from '../i18n/useTranslation';
import { Channel } from '../types';

interface ChannelsScreenProps {
  playlistId: string;
  onBack: () => void;
}

export const ChannelsScreen: React.FC<ChannelsScreenProps> = ({
  playlistId,
  onBack,
}) => {
  const { t } = useTranslation();
  const { playlists, favorites, toggleFavorite, isFavorite } = usePlaylist();
  const { getHistoryForChannel } = useHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [startPosition, setStartPosition] = useState(0);
  const [currentChannelIndex, setCurrentChannelIndex] = useState(0);
  const [loopMode, setLoopMode] = useState<'none' | 'one' | 'all'>('none');
  const [shuffleMode, setShuffleMode] = useState(false);

  const playlist = playlists.find(p => p.id === playlistId);


  const groupedChannels = useMemo(() => {
    if (!playlist) return new Map();

    const grouped = new Map<string, Channel[]>();
    playlist.channels.forEach(channel => {
      const group = channel.group || t('uncategorized');
      if (!grouped.has(group)) {
        grouped.set(group, []);
      }
      grouped.get(group)!.push(channel);
    });

    return grouped;
  }, [playlist, t]);


  const filteredChannels = useMemo(() => {
    if (!playlist) return [];

    let channels = playlist.channels;


    if (selectedGroup) {
      channels = channels.filter(c => (c.group || t('uncategorized')) === selectedGroup);
    }


    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      channels = channels.filter(c =>
        c.name.toLowerCase().includes(query) ||
        (c.group && c.group.toLowerCase().includes(query))
      );
    }

    return channels;
  }, [playlist, searchQuery, selectedGroup, t]);

  const handlePlayChannel = (channel: Channel, index?: number) => {

    const history = getHistoryForChannel(channel.id);
    const resumeTime = history?.currentTime || 0;


    const channelIndex = index ?? filteredChannels.findIndex(c => c.id === channel.id);

    setSelectedChannel(channel);
    setStartPosition(resumeTime);
    setCurrentChannelIndex(channelIndex >= 0 ? channelIndex : 0);
    setShowPlayer(true);
  };

  const handleNext = () => {
    if (filteredChannels.length === 0) return;

    let nextIndex: number;

    if (shuffleMode) {

      if (filteredChannels.length === 1) {
        nextIndex = 0;
      } else {
        do {
          nextIndex = Math.floor(Math.random() * filteredChannels.length);
        } while (nextIndex === currentChannelIndex);
      }
    } else {

      nextIndex = currentChannelIndex + 1;

      if (nextIndex >= filteredChannels.length) {
        if (loopMode === 'all') {
          nextIndex = 0; 
        } else if (loopMode === 'one') {
          nextIndex = currentChannelIndex; 
        } else {
          return; 
        }
      }
    }

    const nextChannel = filteredChannels[nextIndex];
    if (nextChannel) {
      const history = getHistoryForChannel(nextChannel.id);
      setSelectedChannel(nextChannel);
      setStartPosition(history?.currentTime || 0);
      setCurrentChannelIndex(nextIndex);
    }
  };

  const handlePrevious = () => {
    if (filteredChannels.length === 0) return;

    let prevIndex: number;

    if (shuffleMode) {

      if (filteredChannels.length === 1) {
        prevIndex = 0;
      } else {
        do {
          prevIndex = Math.floor(Math.random() * filteredChannels.length);
        } while (prevIndex === currentChannelIndex);
      }
    } else {

      prevIndex = currentChannelIndex - 1;

      if (prevIndex < 0) {
        if (loopMode === 'all') {
          prevIndex = filteredChannels.length - 1; 
        } else if (loopMode === 'one') {
          prevIndex = currentChannelIndex; 
        } else {
          return; 
        }
      }
    }

    const prevChannel = filteredChannels[prevIndex];
    if (prevChannel) {
      const history = getHistoryForChannel(prevChannel.id);
      setSelectedChannel(prevChannel);
      setStartPosition(history?.currentTime || 0);
      setCurrentChannelIndex(prevIndex);
    }
  };


  const canGoNext = shuffleMode || loopMode !== 'none' || currentChannelIndex < filteredChannels.length - 1;
  const canGoPrevious = shuffleMode || loopMode !== 'none' || currentChannelIndex > 0;

  const handleClosePlayer = () => {
    setShowPlayer(false);
    setSelectedChannel(null);
  };

  if (!playlist) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="alert-circle-outline"
          title={t('playlistNotFound')}
          description={t('playlistNotFoundDesc')}
        />
      </SafeAreaView>
    );
  }

  const groups = Array.from(groupedChannels.keys()).sort();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={1}>
            {playlist.name}
          </Text>
          <Text style={styles.subtitle}>
            {filteredChannels.length} {t('channels')}
          </Text>
        </View>
      </View>

      {}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchChannels')}
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

      {}
      {groups.length > 1 && (
        <View style={styles.groupContainer}>
          <FlatList
            horizontal
            data={[t('all'), ...groups]}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.groupChip,
                  (item === t('all') && !selectedGroup) ||
                    item === selectedGroup
                    ? styles.groupChipActive
                    : null,
                ]}
                onPress={() => setSelectedGroup(item === t('all') ? null : item)}
              >
                <Text
                  style={[
                    styles.groupChipText,
                    (item === t('all') && !selectedGroup) ||
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

      {}
      {filteredChannels.length === 0 ? (
        <EmptyState
          icon="tv-outline"
          title={t('noChannelsFound')}
          description={
            searchQuery
              ? t('tryDifferentSearch')
              : t('playlistHasNoChannels')
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

      {}
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
            onNext={canGoNext ? handleNext : undefined}
            onPrevious={canGoPrevious ? handlePrevious : undefined}
            loopMode={loopMode}
            shuffleMode={shuffleMode}
            onLoopModeChange={setLoopMode}
            onShuffleModeChange={setShuffleMode}
            playlistInfo={{
              current: currentChannelIndex + 1,
              total: filteredChannels.length,
            }}
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.backgroundLight,
  },
  backButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
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
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
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
