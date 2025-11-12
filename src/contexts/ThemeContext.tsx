// Theme Customization Context
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CustomTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    background: string;
    backgroundCard: string;
    surface: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
  };
}

export const PRESET_THEMES: CustomTheme[] = [
  {
    id: 'default',
    name: 'Default Dark',
    colors: {
      primary: '#6366F1',
      background: '#0F172A',
      backgroundCard: '#1E293B',
      surface: '#334155',
      text: '#F1F5F9',
      textSecondary: '#CBD5E1',
      textTertiary: '#94A3B8',
      border: '#334155',
      error: '#EF4444',
      success: '#10B981',
      warning: '#F59E0B',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    colors: {
      primary: '#0EA5E9',
      background: '#0C1F2E',
      backgroundCard: '#1A3447',
      surface: '#2A4A5F',
      text: '#E0F2FE',
      textSecondary: '#BAE6FD',
      textTertiary: '#7DD3FC',
      border: '#2A4A5F',
      error: '#DC2626',
      success: '#059669',
      warning: '#D97706',
    },
  },
  {
    id: 'purple',
    name: 'Purple Dream',
    colors: {
      primary: '#A855F7',
      background: '#1E1033',
      backgroundCard: '#2E1F47',
      surface: '#3E2F5B',
      text: '#FAF5FF',
      textSecondary: '#E9D5FF',
      textTertiary: '#D8B4FE',
      border: '#3E2F5B',
      error: '#DC2626',
      success: '#10B981',
      warning: '#F59E0B',
    },
  },
  {
    id: 'forest',
    name: 'Forest Green',
    colors: {
      primary: '#10B981',
      background: '#0A1F1A',
      backgroundCard: '#1A3328',
      surface: '#2A4736',
      text: '#D1FAE5',
      textSecondary: '#A7F3D0',
      textTertiary: '#6EE7B7',
      border: '#2A4736',
      error: '#DC2626',
      success: '#059669',
      warning: '#D97706',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    colors: {
      primary: '#F59E0B',
      background: '#1F1108',
      backgroundCard: '#332314',
      surface: '#47351F',
      text: '#FEF3C7',
      textSecondary: '#FDE68A',
      textTertiary: '#FCD34D',
      border: '#47351F',
      error: '#DC2626',
      success: '#10B981',
      warning: '#D97706',
    },
  },
  {
    id: 'light',
    name: 'Light Mode',
    colors: {
      primary: '#6366F1',
      background: '#F8FAFC',
      backgroundCard: '#FFFFFF',
      surface: '#F1F5F9',
      text: '#0F172A',
      textSecondary: '#475569',
      textTertiary: '#64748B',
      border: '#E2E8F0',
      error: '#EF4444',
      success: '#10B981',
      warning: '#F59E0B',
    },
  },
];

interface ThemeContextType {
  currentTheme: CustomTheme;
  setTheme: (themeId: string) => void;
  customThemes: CustomTheme[];
  addCustomTheme: (theme: CustomTheme) => void;
  removeCustomTheme: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@playcast_custom_theme';
const CUSTOM_THEMES_KEY = '@playcast_custom_themes';

export const CustomThemeProvider = ({ children }: { children: ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<CustomTheme>(PRESET_THEMES[0]);
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);

  useEffect(() => {
    loadTheme();
    loadCustomThemes();
  }, []);

  const loadTheme = async () => {
    try {
      const savedThemeId = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedThemeId) {
        const allThemes = [...PRESET_THEMES, ...customThemes];
        const theme = allThemes.find(t => t.id === savedThemeId);
        if (theme) {
          setCurrentTheme(theme);
        }
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const loadCustomThemes = async () => {
    try {
      const data = await AsyncStorage.getItem(CUSTOM_THEMES_KEY);
      if (data) {
        setCustomThemes(JSON.parse(data));
      }
    } catch (error) {
      console.error('Failed to load custom themes:', error);
    }
  };

  const setTheme = async (themeId: string) => {
    const allThemes = [...PRESET_THEMES, ...customThemes];
    const theme = allThemes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, themeId);
      } catch (error) {
        console.error('Failed to save theme:', error);
      }
    }
  };

  const addCustomTheme = async (theme: CustomTheme) => {
    const newCustomThemes = [...customThemes, theme];
    setCustomThemes(newCustomThemes);
    try {
      await AsyncStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(newCustomThemes));
    } catch (error) {
      console.error('Failed to save custom theme:', error);
    }
  };

  const removeCustomTheme = async (themeId: string) => {
    const newCustomThemes = customThemes.filter(t => t.id !== themeId);
    setCustomThemes(newCustomThemes);
    try {
      await AsyncStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(newCustomThemes));
    } catch (error) {
      console.error('Failed to remove custom theme:', error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setTheme,
        customThemes,
        addCustomTheme,
        removeCustomTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useCustomTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useCustomTheme must be used within CustomThemeProvider');
  }
  return context;
};
