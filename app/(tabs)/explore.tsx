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
import { useHistory } from '@/src/contexts/HistoryContext';
import { ChannelItem } from '@/src/components/channel/ChannelItem';
import { EmptyState } from '@/src/components/common/EmptyState';
import { AdvancedVideoPlayer } from '@/src/components/player/AdvancedVideoPlayer';
import { Channel } from '@/src/types';
import { Colors, Spacing, FontSizes } from '@/src/constants/theme';
import { useTranslation } from '@/src/i18n/useTranslation';

export default function FavoritesTab() {
  const { t } = useTranslation();
  const { getFavoriteChannels, toggleFavorite, isFavorite } = usePlaylist();
  const { getHistoryForChannel } = useHistory();
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [startPosition, setStartPosition] = useState(0);

  const favoriteChannels = getFavoriteChannels();

  const handlePlayChannel = (channel: Channel) => {

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('myFavorites')}</Text>
      </View>

      {favoriteChannels.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title={t('noFavorites')}
          description={t('addChannelsToFavorites')}
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
