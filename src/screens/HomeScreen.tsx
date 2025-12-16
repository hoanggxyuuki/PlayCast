
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, EmptyState, List } from '../components/ui';
import { BorderRadius, Colors, FontSizes, Spacing } from '../constants/theme';
import { usePlaylist } from '../contexts/PlaylistContext';
import { useTranslation } from '../i18n/useTranslation';
import { Playlist } from '../types';

interface HomeScreenProps {
  onNavigateToAddPlaylist: () => void;
  onNavigateToChannels: (playlistId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToAddPlaylist,
  onNavigateToChannels,
}) => {
  const { t } = useTranslation();
  const { playlists, isLoading, deletePlaylist, refreshPlaylist, refreshData } = usePlaylist();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleDeletePlaylist = (playlist: Playlist) => {
    Alert.alert(
      t('delete'),
      `${t('delete')} "${playlist.name}"?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlaylist(playlist.id);
            } catch (error) {
              Alert.alert(t('error'), t('error'));
            }
          },
        },
      ]
    );
  };

  const handleRefreshPlaylist = async (playlist: Playlist) => {
    try {
      await refreshPlaylist(playlist.id);
      Alert.alert(t('done'), t('done'));
    } catch (error) {
      Alert.alert(t('error'), t('error'));
    }
  };

  const renderPlaylistItem = ({ item }: { item: Playlist }) => (
    <Card
      variant="elevated"
      padding="medium"
      margin="small"
      onPress={() => onNavigateToChannels(item.id)}
    >
      <View style={styles.playlistHeader}>
        <View style={styles.playlistIcon}>
          <Ionicons name="list" size={32} color={Colors.primary} />
        </View>
        <View style={styles.playlistInfo}>
          <Text style={styles.playlistName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.playlistMeta}>
            {item.channels.length} {t('channels')} • {item.type.toUpperCase()}
          </Text>
          <Text style={styles.playlistDate}>
            {new Date(item.updatedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.playlistActions}>
        <Button
          title=""
          variant="ghost"
          size="small"
          icon="refresh"
          onPress={(e) => {
            e?.stopPropagation();
            handleRefreshPlaylist(item);
          }}
        />

        <Button
          title=""
          variant="ghost"
          size="small"
          icon="trash-outline"
          onPress={(e) => {
            e?.stopPropagation();
            handleDeletePlaylist(item);
          }}
        />

        <View style={styles.arrowIcon}>
          <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
        </View>
      </View>
    </Card>
  );



  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>PlayCast IPTV</Text>
        <Button
          title=""
          variant="primary"
          size="large"
          icon="add-circle"
          onPress={onNavigateToAddPlaylist}
        />
      </View>

      {playlists.length === 0 ? (
        <EmptyState
          icon="list-outline"
          title={t('noPlaylists')}
          description={t('addFirstPlaylist')}
        />
      ) : (
        <List
          data={playlists}
          renderItem={renderPlaylistItem}
          keyExtractor={(item) => item.id}
          loading={isLoading && playlists.length === 0}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          emptyState={{
            icon: 'list-outline',
            title: t('noPlaylists'),
            description: t('addFirstPlaylist'),
            action: {
              title: t('addPlaylist'),
              onPress: onNavigateToAddPlaylist,
            },
          }}
          contentContainerStyle={styles.listContent}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.backgroundLight,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: 0.5,
  },
  addButton: {

  },
  listContent: {
    padding: Spacing.md,
  },
  playlistCard: {

  },
  playlistHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  playlistIcon: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  playlistName: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  playlistMeta: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  playlistDate: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
  },
  playlistActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.sm,
  },
  actionButton: {

  },
  arrowIcon: {
    marginLeft: 'auto',
  },
});
