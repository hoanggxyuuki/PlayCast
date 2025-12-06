/**
 * OnlineFavoritesContext - Manage favorites for YouTube and SoundCloud content
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

// Types for online favorites
export interface OnlineFavorite {
    id: string;
    platform: 'youtube' | 'soundcloud';
    title: string;
    artist: string;
    thumbnail: string;
    duration: number; // in seconds for YT, milliseconds for SC
    addedAt: Date;
    // Platform specific
    videoId?: string; // YouTube
    permalinkUrl?: string; // SoundCloud
    viewCount?: number;
    playbackCount?: number;
}

interface OnlineFavoritesContextType {
    favorites: OnlineFavorite[];
    youtubeFavorites: OnlineFavorite[];
    soundcloudFavorites: OnlineFavorite[];
    addFavorite: (item: Omit<OnlineFavorite, 'addedAt'>) => Promise<void>;
    removeFavorite: (id: string) => Promise<void>;
    isFavorite: (id: string) => boolean;
    toggleFavorite: (item: Omit<OnlineFavorite, 'addedAt'>) => Promise<void>;
    clearAllFavorites: () => Promise<void>;
    isLoading: boolean;
}

const STORAGE_KEY = '@playcast_online_favorites';

const OnlineFavoritesContext = createContext<OnlineFavoritesContextType | undefined>(undefined);

export const useOnlineFavorites = (): OnlineFavoritesContextType => {
    const context = useContext(OnlineFavoritesContext);
    if (!context) {
        throw new Error('useOnlineFavorites must be used within an OnlineFavoritesProvider');
    }
    return context;
};

interface OnlineFavoritesProviderProps {
    children: ReactNode;
}

export const OnlineFavoritesProvider: React.FC<OnlineFavoritesProviderProps> = ({ children }) => {
    const [favorites, setFavorites] = useState<OnlineFavorite[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load favorites from storage on mount
    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Convert date strings back to Date objects
                const withDates = parsed.map((f: any) => ({
                    ...f,
                    addedAt: new Date(f.addedAt),
                }));
                setFavorites(withDates);
            }
        } catch (error) {
            console.error('[Favorites] Failed to load:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveFavorites = async (newFavorites: OnlineFavorite[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
        } catch (error) {
            console.error('[Favorites] Failed to save:', error);
        }
    };

    const addFavorite = useCallback(async (item: Omit<OnlineFavorite, 'addedAt'>) => {
        const newFavorite: OnlineFavorite = {
            ...item,
            addedAt: new Date(),
        };

        setFavorites((prev) => {
            // Check if already exists
            if (prev.some((f) => f.id === item.id)) {
                return prev;
            }
            const updated = [newFavorite, ...prev];
            saveFavorites(updated);
            return updated;
        });

        console.log(`[Favorites] Added: ${item.title}`);
    }, []);

    const removeFavorite = useCallback(async (id: string) => {
        setFavorites((prev) => {
            const updated = prev.filter((f) => f.id !== id);
            saveFavorites(updated);
            return updated;
        });
        console.log(`[Favorites] Removed: ${id}`);
    }, []);

    const isFavorite = useCallback((id: string): boolean => {
        return favorites.some((f) => f.id === id);
    }, [favorites]);

    const toggleFavorite = useCallback(async (item: Omit<OnlineFavorite, 'addedAt'>) => {
        if (isFavorite(item.id)) {
            await removeFavorite(item.id);
        } else {
            await addFavorite(item);
        }
    }, [isFavorite, removeFavorite, addFavorite]);

    const clearAllFavorites = useCallback(async () => {
        setFavorites([]);
        await AsyncStorage.removeItem(STORAGE_KEY);
        console.log('[Favorites] Cleared all');
    }, []);

    // Computed: filter by platform
    const youtubeFavorites = favorites.filter((f) => f.platform === 'youtube');
    const soundcloudFavorites = favorites.filter((f) => f.platform === 'soundcloud');

    return (
        <OnlineFavoritesContext.Provider
            value={{
                favorites,
                youtubeFavorites,
                soundcloudFavorites,
                addFavorite,
                removeFavorite,
                isFavorite,
                toggleFavorite,
                clearAllFavorites,
                isLoading,
            }}
        >
            {children}
        </OnlineFavoritesContext.Provider>
    );
};
