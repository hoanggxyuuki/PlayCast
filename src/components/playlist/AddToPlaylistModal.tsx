import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../constants/theme';
import { usePlaylist } from '../../contexts/PlaylistContext';
import { Channel } from '../../types';

interface AddToPlaylistModalProps {
    visible: boolean;
    onClose: () => void;
    channel: Channel | null;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
    visible,
    onClose,
    channel,
}) => {
    const { playlists, addChannelToPlaylist, createEmptyPlaylist } = usePlaylist();
    const [showCreateNew, setShowCreateNew] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');

    const handleAddToPlaylist = async (playlistId: string) => {
        if (!channel) return;

        try {
            await addChannelToPlaylist(playlistId, channel);
            Alert.alert('Added!', `"${channel.name}" has been added to the playlist.`);
            onClose();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to add to playlist');
        }
    };

    const handleCreatePlaylist = async () => {
        if (!newPlaylistName.trim()) {
            Alert.alert('Error', 'Please enter a playlist name');
            return;
        }

        try {
            const playlistId = await createEmptyPlaylist(newPlaylistName.trim());
            if (channel) {
                await addChannelToPlaylist(playlistId, channel);
                Alert.alert('Success!', `Created "${newPlaylistName}" and added the track.`);
            } else {
                Alert.alert('Success!', `Created "${newPlaylistName}"`);
            }
            setNewPlaylistName('');
            setShowCreateNew(false);
            onClose();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create playlist');
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <BlurView intensity={30} style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Add to Playlist</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    </View>

                    {channel && (
                        <View style={styles.trackInfo}>
                            <Ionicons name="musical-notes" size={20} color={Colors.primary} />
                            <Text style={styles.trackName} numberOfLines={1}>{channel.name}</Text>
                        </View>
                    )}

                    {showCreateNew ? (
                        <View style={styles.createNewContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter playlist name..."
                                placeholderTextColor={Colors.textTertiary}
                                value={newPlaylistName}
                                onChangeText={setNewPlaylistName}
                                autoFocus
                            />
                            <View style={styles.createNewButtons}>
                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton]}
                                    onPress={() => {
                                        setShowCreateNew(false);
                                        setNewPlaylistName('');
                                    }}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, styles.createButton]}
                                    onPress={handleCreatePlaylist}
                                >
                                    <Text style={styles.createButtonText}>Create</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={styles.createNewOption}
                                onPress={() => setShowCreateNew(true)}
                            >
                                <View style={styles.createNewIcon}>
                                    <Ionicons name="add" size={24} color={Colors.primary} />
                                </View>
                                <Text style={styles.createNewText}>Create New Playlist</Text>
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            {playlists.length > 0 ? (
                                <FlatList
                                    data={playlists}
                                    keyExtractor={(item) => item.id}
                                    style={styles.list}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.playlistItem}
                                            onPress={() => handleAddToPlaylist(item.id)}
                                        >
                                            <View style={styles.playlistIcon}>
                                                <Ionicons name="list" size={20} color={Colors.text} />
                                            </View>
                                            <View style={styles.playlistInfo}>
                                                <Text style={styles.playlistName} numberOfLines={1}>
                                                    {item.name}
                                                </Text>
                                                <Text style={styles.playlistCount}>
                                                    {item.channels.length} tracks
                                                </Text>
                                            </View>
                                            <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
                                        </TouchableOpacity>
                                    )}
                                />
                            ) : (
                                <View style={styles.emptyState}>
                                    <Ionicons name="albums-outline" size={48} color={Colors.textTertiary} />
                                    <Text style={styles.emptyText}>No playlists yet</Text>
                                    <Text style={styles.emptySubtext}>Create one to get started</Text>
                                </View>
                            )}
                        </>
                    )}
                </View>
            </BlurView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
        width: '90%',
        maxWidth: 400,
        maxHeight: '70%',
        backgroundColor: Colors.backgroundLight,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    title: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: Colors.text,
    },
    closeButton: {
        padding: Spacing.xs,
    },
    trackInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        backgroundColor: Colors.surface,
        gap: Spacing.sm,
    },
    trackName: {
        flex: 1,
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
    },
    createNewContainer: {
        padding: Spacing.md,
    },
    input: {
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: FontSizes.md,
        color: Colors.text,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    createNewButtons: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    button: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: Colors.surface,
    },
    cancelButtonText: {
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    createButton: {
        backgroundColor: Colors.primary,
    },
    createButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    createNewOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        gap: Spacing.md,
    },
    createNewIcon: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.primary,
        borderStyle: 'dashed',
    },
    createNewText: {
        fontSize: FontSizes.md,
        color: Colors.primary,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginHorizontal: Spacing.md,
    },
    list: {
        maxHeight: 300,
    },
    playlistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        gap: Spacing.md,
    },
    playlistIcon: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playlistInfo: {
        flex: 1,
    },
    playlistName: {
        fontSize: FontSizes.md,
        color: Colors.text,
        fontWeight: '500',
    },
    playlistCount: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    emptyState: {
        padding: Spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        marginTop: Spacing.md,
    },
    emptySubtext: {
        fontSize: FontSizes.sm,
        color: Colors.textTertiary,
        marginTop: Spacing.xs,
    },
});
