// Add Playlist Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePlaylist } from '../contexts/PlaylistContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../constants/theme';

interface AddPlaylistScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const AddPlaylistScreen: React.FC<AddPlaylistScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const { addPlaylistFromUrl } = usePlaylist();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'m3u' | 'json'>('m3u');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddPlaylist = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a playlist name');
      return;
    }

    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a playlist URL');
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    setIsLoading(true);

    try {
      await addPlaylistFromUrl(url.trim(), name.trim(), type);
      Alert.alert('Success', 'Playlist added successfully', [
        { text: 'OK', onPress: onSuccess },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add playlist');
    } finally {
      setIsLoading(false);
    }
  };

  const exampleUrls = [
    {
      name: 'M3U Playlist (Vietnam)',
      url: 'https://iptv-org.github.io/iptv/countries/vn.m3u',
      type: 'm3u' as const,
    },
    {
      name: 'Direct Video (MP4)',
      url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      type: 'm3u' as const,
    },
    {
      name: 'HLS Stream (M3U8)',
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
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Add Playlist</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Playlist Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Playlist Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter playlist name"
                placeholderTextColor={Colors.textTertiary}
                value={name}
                onChangeText={setName}
                editable={!isLoading}
              />
            </View>

            {/* Playlist URL */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Playlist URL</Text>
              <TextInput
                style={[styles.input, styles.urlInput]}
                placeholder="https://example.com/playlist.m3u"
                placeholderTextColor={Colors.textTertiary}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                editable={!isLoading}
                multiline
              />
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>
                You can add M3U playlists, JSON playlists, or direct media URLs (.mp4, .m3u8, .mp3, etc.)
              </Text>
            </View>

            {/* Playlist Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === 'm3u' && styles.typeButtonActive,
                  ]}
                  onPress={() => setType('m3u')}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === 'm3u' && styles.typeButtonTextActive,
                    ]}
                  >
                    M3U / Direct URL
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === 'json' && styles.typeButtonActive,
                  ]}
                  onPress={() => setType('json')}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === 'json' && styles.typeButtonTextActive,
                    ]}
                  >
                    JSON
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Examples */}
            <View style={styles.examplesSection}>
              <Text style={styles.sectionTitle}>Examples</Text>
              {exampleUrls.map((example, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.exampleCard}
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
                </TouchableOpacity>
              ))}
            </View>

            {/* Add Button */}
            <TouchableOpacity
              style={[styles.addButton, isLoading && styles.addButtonDisabled]}
              onPress={handleAddPlaylist}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.text} />
              ) : (
                <>
                  <Ionicons name="add-circle" size={24} color={Colors.text} />
                  <Text style={styles.addButtonText}>Add Playlist</Text>
                </>
              )}
            </TouchableOpacity>
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
    padding: Spacing.sm,
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
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  urlInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
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
    padding: Spacing.md,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  typeButtonTextActive: {
    color: Colors.text,
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
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.xl,
    ...Shadows.md,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    marginLeft: Spacing.sm,
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
});
