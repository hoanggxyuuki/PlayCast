import { MiniPlayer } from '@/src/components/player/MiniPlayer';
import { CategoriesProvider } from '@/src/contexts/CategoriesContext';
import { HistoryProvider } from '@/src/contexts/HistoryContext';
import { MiniPlayerProvider } from '@/src/contexts/MiniPlayerContext';
import { OnlineFavoritesProvider } from '@/src/contexts/OnlineFavoritesContext';
import { ParentalControlProvider } from '@/src/contexts/ParentalControlContext';
import { PlaylistProvider } from '@/src/contexts/PlaylistContext';
import { QueueProvider } from '@/src/contexts/QueueContext';
import { SettingsProvider } from '@/src/contexts/SettingsContext';
import { CustomThemeProvider } from '@/src/contexts/ThemeContext';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

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
                    <OnlineFavoritesProvider>
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
                        {}
                        <MiniPlayer />
                        <StatusBar style="light" />
                      </ThemeProvider>
                    </OnlineFavoritesProvider>
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
