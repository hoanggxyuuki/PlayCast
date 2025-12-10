

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Shadows, Spacing } from '../../constants/theme';
import { OnlineFavorite, useOnlineFavorites } from '../../contexts/OnlineFavoritesContext';
import { OnlineSearchResult, OnlineSearchService, SearchPlatform } from '../../services/OnlineSearchService';

interface OnlineResultCardProps {
    result: OnlineSearchResult;
    onPlay: (result: OnlineSearchResult) => void;
    onAddToQueue?: (result: OnlineSearchResult) => void;
}

const getPlatformColor = (platform: SearchPlatform): string => {
    switch (platform) {
        case 'youtube':
            return '#FF0000';
        case 'soundcloud':
            return '#FF5500';
        case 'spotify':
            return '#1DB954';
        default:
            return Colors.primary;
    }
};

const getPlatformIcon = (platform: SearchPlatform): keyof typeof Ionicons.glyphMap => {
    switch (platform) {
        case 'youtube':
            return 'logo-youtube';
        case 'soundcloud':
            return 'musical-notes';
        case 'spotify':
            return 'musical-note';
        default:
            return 'play';
    }
};

export const OnlineResultCard: React.FC<OnlineResultCardProps> = ({
    result,
    onPlay,
    onAddToQueue,
}) => {
    const { isFavorite, toggleFavorite } = useOnlineFavorites();
    const platformColor = getPlatformColor(result.platform);
    const platformIcon = getPlatformIcon(result.platform);
    const formattedDuration = OnlineSearchService.formatDuration(result.duration);
    const formattedViews = result.viewCount
        ? OnlineSearchService.formatViewCount(result.viewCount)
        : null;

    const isCurrentlyFavorite = isFavorite(result.id);

    const handleToggleFavorite = async () => {
        const favoriteItem: Omit<OnlineFavorite, 'addedAt'> = {
            id: result.id,
            platform: result.platform as 'youtube' | 'soundcloud',
            title: result.title,
            artist: result.artist,
            thumbnail: result.thumbnail,
            duration: result.duration,
            viewCount: result.viewCount,

            videoId: result.platform === 'youtube' ? result.id : undefined,
            permalinkUrl: result.platform === 'soundcloud' ? result.streamUrl : undefined,
        };
        await toggleFavorite(favoriteItem);
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => onPlay(result)}
            activeOpacity={0.7}
        >
            {}
            <View style={styles.thumbnailContainer}>
                <Image
                    source={{ uri: result.thumbnail || 'https://via.placeholder.com/120x90?text=No+Image' }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                />
                {}
                <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{formattedDuration}</Text>
                </View>
                {}
                <View style={[styles.platformBadge, { backgroundColor: platformColor }]}>
                    <Ionicons name={platformIcon} size={12} color="#fff" />
                </View>
                {}
                <View style={styles.playOverlay}>
                    <Ionicons name="play" size={32} color="#fff" />
                </View>
            </View>

            {}
            <View style={styles.content}>
                {}
                <Text style={styles.title} numberOfLines={2}>
                    {result.title}
                </Text>

                {}
                <Text style={styles.artist} numberOfLines={1}>
                    {result.artist}
                </Text>

                {}
                <View style={styles.metaContainer}>
                    {formattedViews && (
                        <View style={styles.metaItem}>
                            <Ionicons name="eye-outline" size={12} color={Colors.textSecondary} />
                            <Text style={styles.metaText}>{formattedViews}</Text>
                        </View>
                    )}
                    <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
                        <Text style={styles.metaText}>{formattedDuration}</Text>
                    </View>
                </View>

                {}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.playButton, { backgroundColor: platformColor }]}
                        onPress={() => onPlay(result)}
                    >
                        <Ionicons name="play" size={16} color="#fff" />
                        <Text style={styles.playButtonText}>Play</Text>
                    </TouchableOpacity>

                    {}
                    <TouchableOpacity
                        style={[
                            styles.favoriteButton,
                            isCurrentlyFavorite && styles.favoriteButtonActive
                        ]}
                        onPress={handleToggleFavorite}
                    >
                        <Ionicons
                            name={isCurrentlyFavorite ? 'heart' : 'heart-outline'}
                            size={18}
                            color={isCurrentlyFavorite ? '#FF4B6E' : Colors.text}
                        />
                    </TouchableOpacity>

                    {onAddToQueue && (
                        <TouchableOpacity
                            style={styles.queueButton}
                            onPress={() => onAddToQueue(result)}
                        >
                            <Ionicons name="add" size={20} color={Colors.text} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        marginHorizontal: Spacing.md,
        marginVertical: Spacing.xs,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    thumbnailContainer: {
        width: 140,
        height: 100,
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
        backgroundColor: Colors.backgroundLight,
    },
    durationBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    durationText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#fff',
    },
    platformBadge: {
        position: 'absolute',
        top: 4,
        left: 4,
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.7,
    },
    content: {
        flex: 1,
        padding: Spacing.sm,
        justifyContent: 'space-between',
    },
    title: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        color: Colors.text,
        lineHeight: 18,
    },
    artist: {
        fontSize: FontSizes.xs,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginTop: 4,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 11,
        color: Colors.textSecondary,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.xs,
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 6,
        borderRadius: BorderRadius.sm,
    },
    playButtonText: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
        color: '#fff',
    },
    favoriteButton: {
        width: 32,
        height: 32,
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    favoriteButtonActive: {
        backgroundColor: 'rgba(255, 75, 110, 0.15)',
    },
    queueButton: {
        width: 32,
        height: 32,
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
