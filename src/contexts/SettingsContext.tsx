// Settings Context for App Configuration
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings } from '../types';
import { StorageService } from '../services/storageService';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  isLoading: boolean;
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  language: 'en',
  autoPlayNext: true,
  defaultPlaybackSpeed: 1.0,
  defaultQuality: 'auto',
  continueWatching: true,
  pictureInPicture: true,
  backgroundPlayback: false,
  downloadQuality: 'high',
  gestureControls: true,
  doubleTapSeek: 10,
  volumeGesture: true,
  brightnessGesture: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const savedSettings = await StorageService.loadSettings();

      // Merge with defaults to ensure all fields exist
      const mergedSettings = { ...defaultSettings, ...savedSettings };
      setSettings(mergedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<AppSettings>) => {
    try {
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      await StorageService.saveSettings(newSettings);
      console.log('Settings updated:', updates);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  const resetSettings = async () => {
    try {
      setSettings(defaultSettings);
      await StorageService.saveSettings(defaultSettings);
      console.log('Settings reset to defaults');
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to use settings
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// Helper hooks for specific settings
export const useTheme = () => {
  const { settings, updateSettings } = useSettings();
  return {
    theme: settings.theme,
    setTheme: (theme: AppSettings['theme']) => updateSettings({ theme }),
  };
};

export const useLanguage = () => {
  const { settings, updateSettings } = useSettings();
  return {
    language: settings.language,
    setLanguage: (language: AppSettings['language']) => updateSettings({ language }),
  };
};

export const usePlaybackSettings = () => {
  const { settings, updateSettings } = useSettings();
  return {
    autoPlayNext: settings.autoPlayNext,
    defaultPlaybackSpeed: settings.defaultPlaybackSpeed,
    defaultQuality: settings.defaultQuality,
    continueWatching: settings.continueWatching,
    setAutoPlayNext: (value: boolean) => updateSettings({ autoPlayNext: value }),
    setDefaultPlaybackSpeed: (speed: number) => updateSettings({ defaultPlaybackSpeed: speed }),
    setDefaultQuality: (quality: AppSettings['defaultQuality']) =>
      updateSettings({ defaultQuality: quality }),
    setContinueWatching: (value: boolean) => updateSettings({ continueWatching: value }),
  };
};

export const usePlayerFeatures = () => {
  const { settings, updateSettings } = useSettings();
  return {
    pictureInPicture: settings.pictureInPicture,
    backgroundPlayback: settings.backgroundPlayback,
    setPictureInPicture: (value: boolean) => updateSettings({ pictureInPicture: value }),
    setBackgroundPlayback: (value: boolean) => updateSettings({ backgroundPlayback: value }),
  };
};

export const useGestureSettings = () => {
  const { settings, updateSettings } = useSettings();
  return {
    gestureControls: settings.gestureControls,
    doubleTapSeek: settings.doubleTapSeek,
    volumeGesture: settings.volumeGesture,
    brightnessGesture: settings.brightnessGesture,
    setGestureControls: (value: boolean) => updateSettings({ gestureControls: value }),
    setDoubleTapSeek: (seconds: number) => updateSettings({ doubleTapSeek: seconds }),
    setVolumeGesture: (value: boolean) => updateSettings({ volumeGesture: value }),
    setBrightnessGesture: (value: boolean) => updateSettings({ brightnessGesture: value }),
  };
};

export const useDownloadSettings = () => {
  const { settings, updateSettings } = useSettings();
  return {
    downloadQuality: settings.downloadQuality,
    setDownloadQuality: (quality: AppSettings['downloadQuality']) =>
      updateSettings({ downloadQuality: quality }),
  };
};
