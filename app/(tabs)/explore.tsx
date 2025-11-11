import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlaylist } from '@/src/contexts/PlaylistContext';
import { ChannelItem } from '@/src/components/channel/ChannelItem';
import { EmptyState } from '@/src/components/common/EmptyState';
import { VideoPlayer } from '@/src/components/player/VideoPlayer';
import { Channel } from '@/src/types';
import { Colors, Spacing, FontSizes } from '@/src/constants/theme';

export default function FavoritesTab() {
  const { getFavoriteChannels, toggleFavorite, isFavorite } = usePlaylist();
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  const favoriteChannels = getFavoriteChannels();

  const handlePlayChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    setShowPlayer(true);
  };

  const handleClosePlayer = () => {
    setShowPlayer(false);
    setSelectedChannel(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorite Channels</Text>
      </View>

      {favoriteChannels.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="No Favorites"
          description="Add channels to your favorites to see them here"
        />
      ) : (
        <FlatList
          data={favoriteChannels}
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
          <VideoPlayer
            channel={selectedChannel}
            onClose={handleClosePlayer}
            onError={(error) => console.error('Player error:', error)}
          />
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xxxl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  listContent: {
    paddingBottom: Spacing.lg,
  },
});
