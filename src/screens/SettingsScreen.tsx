// Settings Screen
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes } from '../constants/theme';
import { useSettings, useTheme, useLanguage } from '../contexts/SettingsContext';
import { AppSettings } from '../types';
import { useTranslation } from '../i18n/useTranslation';

export const SettingsScreen = () => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  const getLanguageName = (lang: AppSettings['language']) => {
    const names: Record<AppSettings['language'], string> = {
      en: 'English',
      vi: 'Tiếng Việt',
      zh: '中文',
      ja: '日本語',
      ko: '한국어',
    };
    return names[lang];
  };

  const getThemeName = (themeValue: AppSettings['theme']) => {
    if (themeValue === 'dark') return t('dark');
    if (themeValue === 'light') return t('light');
    return t('auto');
  };

  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSeekMenu, setShowSeekMenu] = useState(false);

  const handleResetSettings = () => {
    Alert.alert(
      t('resetAllSettings'),
      t('confirmReset'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('reset'),
          style: 'destructive',
          onPress: () => resetSettings(),
        },
      ]
    );
  };

  const renderSection = (title: string, icon: string) => (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as any} size={24} color={Colors.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const renderToggle = (
    label: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    description?: string
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.surface, true: Colors.primary }}
        thumbColor={Colors.text}
      />
    </View>
  );

  const renderSelector = (
    label: string,
    value: string | number,
    onPress: () => void,
    description?: string
  ) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <View style={styles.settingValue}>
        <Text style={styles.settingValueText}>{value}</Text>
        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Appearance Section */}
        {renderSection(t('appearance'), 'color-palette-outline')}

        {renderSelector(
          t('theme'),
          getThemeName(theme),
          () => {
            // Cycle through themes
            const themes: AppSettings['theme'][] = ['dark', 'light', 'auto'];
            const currentIndex = themes.indexOf(theme);
            const nextTheme = themes[(currentIndex + 1) % themes.length];
            setTheme(nextTheme);
          },
          t('chooseTheme')
        )}

        {renderSelector(
          t('language'),
          getLanguageName(language),
          () => {
            // Cycle through languages
            const languages: AppSettings['language'][] = ['en', 'vi', 'zh', 'ja', 'ko'];
            const currentIndex = languages.indexOf(language);
            const nextLanguage = languages[(currentIndex + 1) % languages.length];
            setLanguage(nextLanguage);
          },
          t('selectLanguage')
        )}

        {/* Playback Section */}
        {renderSection('Playback', 'play-circle-outline')}

        {renderToggle(
          'Auto-play Next',
          settings.autoPlayNext,
          (value) => updateSettings({ autoPlayNext: value }),
          'Automatically play next video in queue'
        )}

        {renderToggle(
          'Continue Watching',
          settings.continueWatching,
          (value) => updateSettings({ continueWatching: value }),
          'Resume videos from where you left off'
        )}

        {renderSelector(
          'Default Playback Speed',
          `${settings.defaultPlaybackSpeed}x`,
          () => {
            // Cycle through speeds
            const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
            const currentIndex = speeds.indexOf(settings.defaultPlaybackSpeed);
            const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
            updateSettings({ defaultPlaybackSpeed: nextSpeed });
          },
          'Default video playback speed'
        )}

        {renderSelector(
          'Default Quality',
          settings.defaultQuality === 'auto'
            ? 'Auto'
            : settings.defaultQuality.toUpperCase(),
          () => {
            // Cycle through qualities
            const qualities: AppSettings['defaultQuality'][] = [
              'auto',
              '1080p',
              '720p',
              '480p',
              '360p',
            ];
            const currentIndex = qualities.indexOf(settings.defaultQuality);
            const nextQuality = qualities[(currentIndex + 1) % qualities.length];
            updateSettings({ defaultQuality: nextQuality });
          },
          'Preferred video quality'
        )}

        {/* Player Features Section */}
        {renderSection('Player Features', 'film-outline')}

        {renderToggle(
          'Picture-in-Picture',
          settings.pictureInPicture,
          (value) => updateSettings({ pictureInPicture: value }),
          'Watch videos in a floating window'
        )}

        {renderToggle(
          'Background Playback',
          settings.backgroundPlayback,
          (value) => updateSettings({ backgroundPlayback: value }),
          'Continue audio when app is minimized'
        )}

        {/* Gesture Controls Section */}
        {renderSection('Gesture Controls', 'hand-left-outline')}

        {renderToggle(
          'Enable Gesture Controls',
          settings.gestureControls,
          (value) => updateSettings({ gestureControls: value }),
          'Touch gestures for volume, brightness, and seeking'
        )}

        {settings.gestureControls && (
          <>
            {renderToggle(
              'Volume Gesture',
              settings.volumeGesture,
              (value) => updateSettings({ volumeGesture: value }),
              'Swipe up/down on right side to adjust volume'
            )}

            {renderToggle(
              'Brightness Gesture',
              settings.brightnessGesture,
              (value) => updateSettings({ brightnessGesture: value }),
              'Swipe up/down on left side to adjust brightness'
            )}

            {renderSelector(
              'Double-tap Seek',
              `${settings.doubleTapSeek}s`,
              () => {
                // Cycle through seek intervals
                const intervals = [5, 10, 15, 30];
                const currentIndex = intervals.indexOf(settings.doubleTapSeek);
                const nextInterval = intervals[(currentIndex + 1) % intervals.length];
                updateSettings({ doubleTapSeek: nextInterval });
              },
              'Seconds to skip when double-tapping'
            )}
          </>
        )}

        {/* Download Section */}
        {renderSection('Downloads', 'download-outline')}

        {renderSelector(
          'Download Quality',
          settings.downloadQuality === 'high'
            ? 'High'
            : settings.downloadQuality === 'medium'
            ? 'Medium'
            : 'Low',
          () => {
            // Cycle through qualities
            const qualities: AppSettings['downloadQuality'][] = ['high', 'medium', 'low'];
            const currentIndex = qualities.indexOf(settings.downloadQuality);
            const nextQuality = qualities[(currentIndex + 1) % qualities.length];
            updateSettings({ downloadQuality: nextQuality });
          },
          'Quality for offline downloads'
        )}

        {/* About Section */}
        {renderSection('About', 'information-circle-outline')}

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Version</Text>
          <Text style={styles.settingValueText}>1.0.0</Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>App Name</Text>
          <Text style={styles.settingValueText}>PlayCast IPTV</Text>
        </View>

        {/* Reset Button */}
        <TouchableOpacity style={styles.resetButton} onPress={handleResetSettings}>
          <Ionicons name="refresh-outline" size={24} color={Colors.error} />
          <Text style={styles.resetButtonText}>Reset All Settings</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            PlayCast IPTV - Professional IPTV Player
          </Text>
          <Text style={styles.footerSubtext}>
            Made with ❤️ for Final Project
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
    borderRadius: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.text,
  },
  settingDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  settingValueText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: '500',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error,
    gap: Spacing.sm,
  },
  resetButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.error,
  },
  footer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  footerText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
