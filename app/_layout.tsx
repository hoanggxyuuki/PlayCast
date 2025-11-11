import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { PlaylistProvider } from '@/src/contexts/PlaylistContext';
import { SettingsProvider } from '@/src/contexts/SettingsContext';
import { HistoryProvider } from '@/src/contexts/HistoryContext';
import { QueueProvider } from '@/src/contexts/QueueContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <SettingsProvider>
      <HistoryProvider>
        <QueueProvider>
          <PlaylistProvider>
            <ThemeProvider value={DarkTheme}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: '#0f172a' },
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="add-playlist"
                  options={{
                    presentation: 'modal',
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="channels/[id]"
                  options={{
                    headerShown: false,
                  }}
                />
              </Stack>
              <StatusBar style="light" />
            </ThemeProvider>
          </PlaylistProvider>
        </QueueProvider>
      </HistoryProvider>
    </SettingsProvider>
  );
}
