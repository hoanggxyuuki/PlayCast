import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { PlaylistProvider } from '@/src/contexts/PlaylistContext';
import { SettingsProvider } from '@/src/contexts/SettingsContext';
import { HistoryProvider } from '@/src/contexts/HistoryContext';
import { QueueProvider } from '@/src/contexts/QueueContext';
import { MiniPlayerProvider } from '@/src/contexts/MiniPlayerContext';
import { CategoriesProvider } from '@/src/contexts/CategoriesContext';
import { CustomThemeProvider } from '@/src/contexts/ThemeContext';
import { ParentalControlProvider } from '@/src/contexts/ParentalControlContext';
import { MiniPlayer } from '@/src/components/player/MiniPlayer';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <SettingsProvider>
      <CustomThemeProvider>
        <ParentalControlProvider>
          <MiniPlayerProvider>
            <CategoriesProvider>
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
                      {/* Mini Player - Floating video player */}
                      <MiniPlayer />
                      <StatusBar style="light" />
                    </ThemeProvider>
                  </PlaylistProvider>
                </QueueProvider>
              </HistoryProvider>
            </CategoriesProvider>
          </MiniPlayerProvider>
        </ParentalControlProvider>
      </CustomThemeProvider>
    </SettingsProvider>
  );
}
