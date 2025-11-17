// Local Network Screen - Import playlists from local network
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../constants/theme';
import { LocalNetworkService } from '../services/LocalNetworkService';
import { PlaylistService } from '../services/playlistService';
import { usePlaylist } from '../contexts/PlaylistContext';
import { useTranslation } from '../i18n/useTranslation';

export const LocalNetworkScreen = () => {
  const { t } = useTranslation();
  const { addPlaylist } = usePlaylist();
  const [localIP, setLocalIP] = useState<string | null>(null);
  const [networkState, setNetworkState] = useState<any>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadNetworkInfo();
  }, []);

  const loadNetworkInfo = async () => {
    const ip = await LocalNetworkService.getLocalIP();
    const state = await LocalNetworkService.getNetworkState();
    setLocalIP(ip);
    setNetworkState(state);
  };

  const handleImportFromFile = async () => {
    try {
      setIsLoading(true);
      const file = await LocalNetworkService.pickM3UFile();

      if (!file) {
        setIsLoading(false);
        return;
      }

      // Validate M3U
      if (!LocalNetworkService.isValidM3U(file.content)) {
        Alert.alert(
          t('error'),
          'Invalid M3U file format. File must start with #EXTM3U'
        );
        setIsLoading(false);
        return;
      }

      // Parse playlist
      const playlist = await PlaylistService.parseM3U(file.content, file.name);
      await addPlaylist(playlist);

      Alert.alert(
        t('done'),
        `Imported "${file.name}" with ${playlist.channels.length} channels`
      );
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error importing file:', error);
      Alert.alert(t('error'), error.message || 'Failed to import file');
      setIsLoading(false);
    }
  };

  const handleImportFromURL = async () => {
    if (!urlInput.trim()) {
      Alert.alert(t('error'), 'Please enter a URL');
      return;
    }

    try {
      setIsLoading(true);

      // Fetch content
      const { content, name } = await LocalNetworkService.fetchFromURL(urlInput.trim());

      // Validate M3U
      if (!LocalNetworkService.isValidM3U(content)) {
        Alert.alert(
          t('error'),
          'Invalid M3U content. Response must start with #EXTM3U'
        );
        setIsLoading(false);
        return;
      }

      // Parse playlist
      const playlist = await PlaylistService.parseM3U(content, name);
      await addPlaylist(playlist);

      Alert.alert(
        t('done'),
        `Imported "${name}" with ${playlist.channels.length} channels`
      );
      setUrlInput('');
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error importing from URL:', error);
      Alert.alert(
        t('error'),
        error.message || 'Failed to fetch from URL. Check network connection.'
      );
      setIsLoading(false);
    }
  };

  const copyIPToClipboard = () => {
    if (localIP) {
      Clipboard.setString(localIP);
      Alert.alert(t('done'), 'IP address copied to clipboard');
    }
  };

  const getNetworkTypeName = () => {
    if (!networkState) return 'Unknown';
    switch (networkState.type) {
      case 'WIFI':
        return 'Wi-Fi';
      case 'CELLULAR':
        return 'Mobile Data';
      case 'ETHERNET':
        return 'Ethernet';
      default:
        return networkState.type || 'Unknown';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="globe-outline" size={48} color={Colors.primary} />
          <Text style={styles.title}>Local Network</Text>
          <Text style={styles.subtitle}>Import playlists from your local network</Text>
        </View>

        {/* Network Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="wifi" size={24} color={Colors.primary} />
            <Text style={styles.cardTitle}>Network Information</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={[styles.infoValue, { color: networkState?.isConnected ? Colors.success : Colors.error }]}>
              {networkState?.isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type:</Text>
            <Text style={styles.infoValue}>{getNetworkTypeName()}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Local IP:</Text>
            <View style={styles.ipContainer}>
              <Text style={styles.ipText}>{localIP || 'Not available'}</Text>
              {localIP && (
                <TouchableOpacity onPress={copyIPToClipboard} style={styles.copyButton}>
                  <Ionicons name="copy-outline" size={20} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Import from Device */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="folder-open-outline" size={24} color={Colors.primary} />
            <Text style={styles.cardTitle}>Import from Device</Text>
          </View>

          <Text style={styles.cardDescription}>
            Select M3U playlist file from your device storage
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={handleImportFromFile}
            disabled={isLoading}
          >
            <Ionicons name="document-outline" size={24} color={Colors.text} />
            <Text style={styles.buttonText}>Pick M3U File</Text>
          </TouchableOpacity>
        </View>

        {/* Import from URL */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="link-outline" size={24} color={Colors.primary} />
            <Text style={styles.cardTitle}>Import from Network URL</Text>
          </View>

          <Text style={styles.cardDescription}>
            Enter HTTP URL of M3U playlist on your local network
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="http://192.168.1.40:8080/playlist.m3u"
              placeholderTextColor={Colors.textTertiary}
              value={urlInput}
              onChangeText={setUrlInput}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleImportFromURL}
            disabled={isLoading || !urlInput.trim()}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.text} />
            ) : (
              <>
                <Ionicons name="cloud-download-outline" size={24} color={Colors.text} />
                <Text style={styles.buttonText}>Import from URL</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle-outline" size={24} color={Colors.primary} />
            <Text style={styles.cardTitle}>How to Share Files</Text>
          </View>

          <Text style={styles.instructionTitle}>Setup HTTP Server on PC/Mac:</Text>

          <View style={styles.codeBlock}>
            <Text style={styles.codeTitle}>Python 3:</Text>
            <Text style={styles.codeText}>python -m http.server 8080</Text>
          </View>

          <View style={styles.codeBlock}>
            <Text style={styles.codeTitle}>Node.js:</Text>
            <Text style={styles.codeText}>npx http-server -p 8080</Text>
          </View>

          <Text style={styles.instructionText}>
            1. Place your M3U files in a folder{'\n'}
            2. Run HTTP server in that folder{'\n'}
            3. Note your computer's local IP address{'\n'}
            4. Connect your phone to same Wi-Fi network{'\n'}
            5. Access: http://YOUR_PC_IP:8080/playlist.m3u
          </Text>

          <View style={styles.tipBox}>
            <Ionicons name="bulb-outline" size={20} color={Colors.warning} />
            <Text style={styles.tipText}>
              Tip: Both devices must be on the same Wi-Fi network
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.xxxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  cardTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  cardDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  ipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ipText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  copyButton: {
    padding: Spacing.xs,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  buttonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  instructionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  instructionText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginTop: Spacing.md,
  },
  codeBlock: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  codeTitle: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  codeText: {
    fontSize: FontSizes.sm,
    fontFamily: 'monospace',
    color: Colors.primary,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.warning,
  },
});
