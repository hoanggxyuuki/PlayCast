// Home Screen - Main screen showing playlists
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePlaylist } from '../contexts/PlaylistContext';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../constants/theme';
import { Playlist } from '../types';

interface HomeScreenProps {
  onNavigateToAddPlaylist: () => void;
  onNavigateToChannels: (playlistId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToAddPlaylist,
  onNavigateToChannels,
}) => {
  const { playlists, isLoading, deletePlaylist, refreshPlaylist, refreshData } = usePlaylist();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleDeletePlaylist = (playlist: Playlist) => {
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${playlist.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlaylist(playlist.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete playlist');
            }
          },
        },
      ]
    );
  };

  const handleRefreshPlaylist = async (playlist: Playlist) => {
    try {
      await refreshPlaylist(playlist.id);
      Alert.alert('Success', 'Playlist refreshed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh playlist');
    }
  };

  const renderPlaylistItem = ({ item }: { item: Playlist }) => (
    <TouchableOpacity
      style={styles.playlistCard}
      onPress={() => onNavigateToChannels(item.id)}
      activeOpacity={0.7}
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
            {item.channels.length} channels • {item.type.toUpperCase()}
          </Text>
          <Text style={styles.playlistDate}>
            Updated: {new Date(item.updatedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.playlistActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleRefreshPlaylist(item);
          }}
        >
          <Ionicons name="refresh" size={20} color={Colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDeletePlaylist(item);
          }}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        </TouchableOpacity>

        <View style={styles.arrowIcon}>
          <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && playlists.length === 0) {
    return <LoadingOverlay message="Loading playlists..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>PlayCast IPTV</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={onNavigateToAddPlaylist}
        >
          <Ionicons name="add-circle" size={32} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {playlists.length === 0 ? (
        <EmptyState
          icon="list-outline"
          title="No Playlists"
          description="Add your first playlist to start watching"
        />
      ) : (
        <FlatList
          data={playlists}
          renderItem={renderPlaylistItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xxxl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  addButton: {
    padding: Spacing.sm,
  },
  listContent: {
    padding: Spacing.md,
  },
  playlistCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  playlistHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  playlistIcon: {
    width: 56,
    height: 56,
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
  },
  playlistMeta: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  playlistDate: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  playlistActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    padding: Spacing.sm,
    marginRight: Spacing.md,
  },
  arrowIcon: {
    marginLeft: 'auto',
  },
});
