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
import { HTTPServerService } from '../services/HTTPServerService';
import { M3UParser } from '../services/m3uParser';
import { usePlaylist } from '../contexts/PlaylistContext';
import { useTranslation } from '../i18n/useTranslation';

export const LocalNetworkScreen = () => {
  const { t } = useTranslation();
  const { addPlaylist } = usePlaylist();
  const [localIP, setLocalIP] = useState<string | null>(null);
  const [networkState, setNetworkState] = useState<any>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverRunning, setServerRunning] = useState(false);
  const [serverURL, setServerURL] = useState('');
  const [serverPort] = useState(8080);

  useEffect(() => {
    loadNetworkInfo();
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    const status = await HTTPServerService.getStatus();
    setServerRunning(status.isRunning);
    setServerURL(status.url);
  };

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

      // Parse M3U to channels
      const channels = await M3UParser.parseM3U(file.content);

      // Create playlist object
      const playlist = {
        id: `local-${Date.now()}`,
        name: file.name.replace(/\.(m3u|m3u8)$/i, ''),
        url: file.uri,
        type: 'm3u' as const,
        channels,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: 'Imported from device',
      };

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

      // Parse M3U to channels
      const channels = await M3UParser.parseM3U(content);

      // Create playlist object
      const playlist = {
        id: `network-${Date.now()}`,
        name: name.replace(/\.(m3u|m3u8)$/i, ''),
        url: urlInput.trim(),
        type: 'm3u' as const,
        channels,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: 'Imported from network',
      };

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

  const handleStartServer = async () => {
    try {
      setIsLoading(true);
      const result = await HTTPServerService.startServer(serverPort);

      if (result.success) {
        setServerRunning(true);
        setServerURL(result.url);
        Alert.alert(
          'Server Started',
          `Server đang chạy tại:\n${result.url}\n\nTruy cập URL này từ máy tính để upload M3U file.`
        );
      } else {
        Alert.alert(t('error'), result.message);
      }
      setIsLoading(false);
    } catch (error: any) {
      Alert.alert(t('error'), error.message);
      setIsLoading(false);
    }
  };

  const handleStopServer = async () => {
    try {
      setIsLoading(true);
      const result = await HTTPServerService.stopServer();

      if (result.success) {
        setServerRunning(false);
        setServerURL('');
        Alert.alert('Server Stopped', 'HTTP Server đã dừng');
      } else {
        Alert.alert(t('error'), result.message);
      }
      setIsLoading(false);
    } catch (error: any) {
      Alert.alert(t('error'), error.message);
      setIsLoading(false);
    }
  };

  const copyServerURL = () => {
    if (serverURL) {
      Clipboard.setString(serverURL);
      Alert.alert(t('done'), 'Server URL copied to clipboard');
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

        {/* HTTP Server Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="server-outline" size={24} color={Colors.primary} />
            <Text style={styles.cardTitle}>HTTP Server</Text>
          </View>

          <Text style={styles.cardDescription}>
            {HTTPServerService.isNativeModuleAvailable()
              ? 'Start HTTP server to receive M3U uploads from other devices'
              : '⚠️ HTTP Server chưa được cài đặt. Xem file SETUP_HTTP_SERVER.md để hướng dẫn cài đặt native module.'}
          </Text>

          {serverRunning && serverURL && (
            <View style={styles.serverInfoBox}>
              <Text style={styles.serverInfoLabel}>Server URL:</Text>
              <View style={styles.urlContainer}>
                <Text style={styles.serverURL} numberOfLines={2}>{serverURL}</Text>
                <TouchableOpacity onPress={copyServerURL} style={styles.copyButton}>
                  <Ionicons name="copy-outline" size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.serverHint}>
                Truy cập URL này từ máy tính để upload file M3U
              </Text>
            </View>
          )}

          {HTTPServerService.isNativeModuleAvailable() ? (
            <TouchableOpacity
              style={[
                styles.button,
                serverRunning && { backgroundColor: Colors.error },
              ]}
              onPress={serverRunning ? handleStopServer : handleStartServer}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.text} />
              ) : (
                <>
                  <Ionicons
                    name={serverRunning ? 'stop-circle-outline' : 'play-circle-outline'}
                    size={24}
                    color={Colors.text}
                  />
                  <Text style={styles.buttonText}>
                    {serverRunning ? 'Stop Server' : 'Start Server'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.warningBox}>
              <Ionicons name="warning-outline" size={24} color={Colors.warning} />
              <Text style={styles.warningText}>
                Cần eject Expo và cài native module để dùng HTTP Server. Xem SETUP_HTTP_SERVER.md
              </Text>
            </View>
          )}
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
  serverInfoBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginVertical: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  serverInfoLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  serverURL: {
    flex: 1,
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.success,
    fontFamily: 'monospace',
  },
  serverHint: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  warningText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.warning,
    lineHeight: 20,
  },
});
