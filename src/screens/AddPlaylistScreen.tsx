// Add Playlist Screen
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Input } from '../components/ui';
import { Colors, FontSizes, Spacing } from '../constants/theme';
import { usePlaylist } from '../contexts/PlaylistContext';
import { useTranslation } from '../i18n/useTranslation';

interface AddPlaylistScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const AddPlaylistScreen: React.FC<AddPlaylistScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { addPlaylistFromUrl } = usePlaylist();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'m3u' | 'json'>('m3u');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddPlaylist = async () => {
    if (!name.trim()) {
      Alert.alert(t('error'), t('pleaseEnterPlaylistName'));
      return;
    }

    if (!url.trim()) {
      Alert.alert(t('error'), t('pleaseEnterPlaylistUrl'));
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      Alert.alert(t('error'), t('pleaseEnterValidUrl'));
      return;
    }

    setIsLoading(true);

    try {
      await addPlaylistFromUrl(url.trim(), name.trim(), type);
      Alert.alert(t('success'), t('playlistAddedSuccess'), [
        { text: 'OK', onPress: onSuccess },
      ]);
    } catch (error: any) {
      Alert.alert(t('error'), error.message || t('failedToAddPlaylist'));
    } finally {
      setIsLoading(false);
    }
  };

  const exampleUrls = [
    {
      name: t('m3uPlaylistVietnam'),
      url: 'https://iptv-org.github.io/iptv/countries/vn.m3u',
      type: 'm3u' as const,
    },
    {
      name: t('directVideoMp4'),
      url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      type: 'm3u' as const,
    },
    {
      name: t('hlsStreamM3u8'),
      url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      type: 'm3u' as const,
    },
  ];

  const loadExample = (example: typeof exampleUrls[0]) => {
    setName(example.name);
    setUrl(example.url);
    setType(example.type);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Button
              title=""
              variant="ghost"
              size="medium"
              icon="arrow-back"
              onPress={onBack}
            />
            <Text style={styles.title}>{t('addNewPlaylist')}</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* IPTV Explanation Banner */}
            <Card variant="outlined" margin="small">
              <View style={styles.infoBox}>
                <Ionicons name="tv-outline" size={24} color={Colors.primary} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.whatIsTitle}>{t('whatIsIptv') || 'What is IPTV/M3U?'}</Text>
                  <Text style={styles.infoText}>
                    {t('iptvExplanation') || 'M3U is a playlist format used by IPTV providers to stream TV channels.'}
                  </Text>
                </View>
              </View>
            </Card>

            {/* YouTube Warning */}
            <Card variant="outlined" margin="small">
              <View style={[styles.infoBox, { backgroundColor: 'rgba(251, 191, 36, 0.1)' }]}>
                <Ionicons name="warning-outline" size={20} color={Colors.warning} />
                <Text style={[styles.infoText, { color: Colors.warning }]}>
                  {t('notForYoutube') || 'Note: For YouTube/SoundCloud, use the "Online" tab instead!'}
                </Text>
              </View>
            </Card>

            {/* Playlist Name */}
            <Input
              label={t('playlistName')}
              value={name}
              onChangeText={setName}
              editable={!isLoading}
              placeholder={t('enterPlaylistName')}
            />

            {/* Playlist URL */}
            <Input
              label={t('playlistUrl')}
              value={url}
              onChangeText={setUrl}
              editable={!isLoading}
              placeholder={t('enterPlaylistUrl')}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              multiline
              inputStyle={styles.urlInput}
            />

            {/* Info Box */}
            <Card variant="outlined" margin="small">
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color={Colors.primary} />
                <Text style={styles.infoText}>
                  {t('supportedFormatsInfo')}
                </Text>
              </View>
            </Card>

            {/* Playlist Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('type')}</Text>
              <View style={styles.typeSelector}>
                <Button
                  title={t('m3uDirectUrl')}
                  variant={type === 'm3u' ? 'primary' : 'outline'}
                  size="medium"
                  onPress={() => setType('m3u')}
                  disabled={isLoading}
                  style={styles.typeButton}
                />
                <Button
                  title={t('json')}
                  variant={type === 'json' ? 'primary' : 'outline'}
                  size="medium"
                  onPress={() => setType('json')}
                  disabled={isLoading}
                  style={styles.typeButton}
                />
              </View>
            </View>

            {/* Examples */}
            <View style={styles.examplesSection}>
              <Text style={styles.sectionTitle}>{t('examples')}</Text>
              {exampleUrls.map((example, index) => (
                <Card
                  key={index}
                  variant="default"
                  padding="medium"
                  margin="small"
                  onPress={() => loadExample(example)}
                  disabled={isLoading}
                >
                  <View style={styles.exampleInfo}>
                    <Text style={styles.exampleName}>{example.name}</Text>
                    <Text style={styles.exampleUrl} numberOfLines={1}>
                      {example.url}
                    </Text>
                  </View>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={Colors.textTertiary}
                  />
                </Card>
              ))}
            </View>

            {/* Add Button */}
            <Button
              title={t('addPlaylist')}
              variant="primary"
              size="large"
              icon="add-circle"
              onPress={handleAddPlaylist}
              disabled={isLoading}
              loading={isLoading}
              style={styles.addButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backButton: {
    // Removed as handled by Button component
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  form: {
    padding: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  input: {
    // Removed as we're using Input component
  },
  urlInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: 8,
  },
  whatIsTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  infoText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  typeButton: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  typeButtonActive: {
    // Removed as handled by Button component
  },
  typeButtonText: {
    // Removed as handled by Button component
  },
  typeButtonTextActive: {
    // Removed as handled by Button component
  },
  examplesSection: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  exampleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    // Removed as handled by Card component
  },
  exampleInfo: {
    flex: 1,
  },
  exampleName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  exampleUrl: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    marginTop: Spacing.xl,
  },
  addButtonDisabled: {
    // Removed as handled by Button component
  },
  addButtonText: {
    // Removed as handled by Button component
  },
});
