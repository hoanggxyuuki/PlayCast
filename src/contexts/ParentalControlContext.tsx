// Parental Control Context
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

interface ParentalControlSettings {
  enabled: boolean;
  pin: string;
  restrictedCategories: string[];
  restrictedChannels: string[];
  requirePinForSettings: boolean;
  requirePinForAdultContent: boolean;
  ageRating: number; // 0 = all, 12, 16, 18
}

interface ParentalControlContextType {
  settings: ParentalControlSettings;
  isLocked: boolean;
  unlock: (pin: string) => boolean;
  lock: () => void;
  setPin: (oldPin: string, newPin: string) => Promise<boolean>;
  enableParentalControl: (pin: string) => Promise<void>;
  disableParentalControl: (pin: string) => Promise<boolean>;
  addRestrictedCategory: (category: string) => void;
  removeRestrictedCategory: (category: string) => void;
  addRestrictedChannel: (channelId: string) => void;
  removeRestrictedChannel: (channelId: string) => void;
  isChannelRestricted: (channelId: string, category?: string) => boolean;
  requiresPin: (action: 'settings' | 'adult' | 'channel', channelId?: string) => boolean;
}

const ParentalControlContext = createContext<ParentalControlContextType | undefined>(undefined);

const SETTINGS_KEY = '@playcast_parental_control';
const DEFAULT_SETTINGS: ParentalControlSettings = {
  enabled: false,
  pin: '',
  restrictedCategories: [],
  restrictedChannels: [],
  requirePinForSettings: true,
  requirePinForAdultContent: true,
  ageRating: 0,
};

export const ParentalControlProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<ParentalControlSettings>(DEFAULT_SETTINGS);
  const [isLocked, setIsLocked] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      if (data) {
        const loaded = JSON.parse(data);
        setSettings(loaded);
        setIsLocked(loaded.enabled);
      }
    } catch (error) {
      console.error('Failed to load parental control settings:', error);
    }
  };

  const saveSettings = async (newSettings: ParentalControlSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save parental control settings:', error);
    }
  };

  const unlock = (pin: string): boolean => {
    if (!settings.enabled) {
      setIsLocked(false);
      return true;
    }

    if (pin === settings.pin) {
      setIsLocked(false);
      // Auto-lock after 5 minutes
      setTimeout(() => setIsLocked(true), 5 * 60 * 1000);
      return true;
    }

    return false;
  };

  const lock = () => {
    setIsLocked(true);
  };

  const setPin = async (oldPin: string, newPin: string): Promise<boolean> => {
    if (settings.enabled && oldPin !== settings.pin) {
      return false;
    }

    if (newPin.length < 4) {
      Alert.alert('Error', 'PIN must be at least 4 digits');
      return false;
    }

    const newSettings = { ...settings, pin: newPin };
    await saveSettings(newSettings);
    return true;
  };

  const enableParentalControl = async (pin: string) => {
    if (pin.length < 4) {
      Alert.alert('Error', 'PIN must be at least 4 digits');
      return;
    }

    const newSettings = { ...settings, enabled: true, pin };
    await saveSettings(newSettings);
    setIsLocked(true);
  };

  const disableParentalControl = async (pin: string): Promise<boolean> => {
    if (pin !== settings.pin) {
      return false;
    }

    const newSettings = { ...settings, enabled: false, pin: '' };
    await saveSettings(newSettings);
    setIsLocked(false);
    return true;
  };

  const addRestrictedCategory = (category: string) => {
    const newCategories = [...settings.restrictedCategories, category];
    saveSettings({ ...settings, restrictedCategories: newCategories });
  };

  const removeRestrictedCategory = (category: string) => {
    const newCategories = settings.restrictedCategories.filter(c => c !== category);
    saveSettings({ ...settings, restrictedCategories: newCategories });
  };

  const addRestrictedChannel = (channelId: string) => {
    const newChannels = [...settings.restrictedChannels, channelId];
    saveSettings({ ...settings, restrictedChannels: newChannels });
  };

  const removeRestrictedChannel = (channelId: string) => {
    const newChannels = settings.restrictedChannels.filter(c => c !== channelId);
    saveSettings({ ...settings, restrictedChannels: newChannels });
  };

  const isChannelRestricted = (channelId: string, category?: string): boolean => {
    if (!settings.enabled) return false;

    // Check if channel is explicitly restricted
    if (settings.restrictedChannels.includes(channelId)) {
      return true;
    }

    // Check if category is restricted
    if (category && settings.restrictedCategories.includes(category)) {
      return true;
    }

    // Check adult content keywords
    if (settings.requirePinForAdultContent && category) {
      const adultKeywords = ['adult', '18+', 'xxx', 'mature', 'porn'];
      const lowerCategory = category.toLowerCase();
      if (adultKeywords.some(keyword => lowerCategory.includes(keyword))) {
        return true;
      }
    }

    return false;
  };

  const requiresPin = (action: 'settings' | 'adult' | 'channel', channelId?: string): boolean => {
    if (!settings.enabled) return false;
    if (isLocked) return true;

    switch (action) {
      case 'settings':
        return settings.requirePinForSettings;
      case 'adult':
        return settings.requirePinForAdultContent;
      case 'channel':
        return channelId ? settings.restrictedChannels.includes(channelId) : false;
      default:
        return false;
    }
  };

  return (
    <ParentalControlContext.Provider
      value={{
        settings,
        isLocked,
        unlock,
        lock,
        setPin,
        enableParentalControl,
        disableParentalControl,
        addRestrictedCategory,
        removeRestrictedCategory,
        addRestrictedChannel,
        removeRestrictedChannel,
        isChannelRestricted,
        requiresPin,
      }}
    >
      {children}
    </ParentalControlContext.Provider>
  );
};

export const useParentalControl = () => {
  const context = useContext(ParentalControlContext);
  if (!context) {
    throw new Error('useParentalControl must be used within ParentalControlProvider');
  }
  return context;
};
