// Platform Tabs Component - Switch between YouTube, SoundCloud, Spotify
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, FontSizes, Shadows, Spacing } from '../../constants/theme';
import { SearchPlatform } from '../../services/OnlineSearchService';

export interface PlatformTabsProps {
    selectedPlatform: SearchPlatform;
    onSelectPlatform: (platform: SearchPlatform) => void;
}

interface PlatformConfig {
    id: SearchPlatform;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    bgColor: string;
}

const PLATFORMS: PlatformConfig[] = [
    {
        id: 'youtube',
        name: 'YouTube',
        icon: 'logo-youtube',
        color: '#FF0000',
        bgColor: 'rgba(255, 0, 0, 0.15)',
    },
    {
        id: 'soundcloud',
        name: 'SoundCloud',
        icon: 'musical-notes',
        color: '#FF5500',
        bgColor: 'rgba(255, 85, 0, 0.15)',
    },
    {
        id: 'spotify',
        name: 'Spotify',
        icon: 'musical-note',
        color: '#1DB954',
        bgColor: 'rgba(29, 185, 84, 0.15)',
    },
];

export const PlatformTabs: React.FC<PlatformTabsProps> = ({
    selectedPlatform,
    onSelectPlatform,
}) => {
    return (
        <View style={styles.container}>
            {PLATFORMS.map((platform) => {
                const isSelected = selectedPlatform === platform.id;
                return (
                    <TouchableOpacity
                        key={platform.id}
                        style={[
                            styles.tab,
                            isSelected && {
                                backgroundColor: platform.bgColor,
                                borderColor: platform.color,
                            },
                        ]}
                        onPress={() => onSelectPlatform(platform.id)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={platform.icon}
                            size={20}
                            color={isSelected ? platform.color : Colors.textSecondary}
                        />
                        <Text
                            style={[
                                styles.tabText,
                                isSelected && { color: platform.color },
                            ]}
                        >
                            {platform.name}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        gap: Spacing.sm,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderColor: Colors.border,
        ...Shadows.sm,
    },
    tabText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
});
