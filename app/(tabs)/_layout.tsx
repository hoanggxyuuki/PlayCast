
import { Colors, Shadows } from '@/src/constants/theme';
import { useTranslation } from '@/src/i18n/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Dynamic bottom spacing based on safe area
  const bottomOffset = Platform.OS === 'ios' ? Math.max(insets.bottom, 10) : 12;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          position: 'absolute',
          bottom: bottomOffset,
          left: 16,
          right: 16,
          height: Platform.OS === 'ios' ? 60 : 56,
          borderRadius: 28,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: '#764ba2',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          paddingBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: Platform.OS === 'ios' ? 6 : 4,
          height: Platform.OS === 'ios' ? 54 : 50,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600',
          marginTop: 0,
          marginBottom: Platform.OS === 'ios' ? 2 : 0,
        },
        tabBarBackground: () => (
          <View style={styles.tabBarContainer}>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={80} tint="dark" style={styles.blurView}>
                <LinearGradient
                  colors={['rgba(30, 30, 60, 0.9)', 'rgba(15, 15, 35, 0.95)']}
                  style={StyleSheet.absoluteFill}
                />
              </BlurView>
            ) : (
              <View style={styles.androidBackground}>
                <LinearGradient
                  colors={['rgba(30, 30, 60, 0.98)', 'rgba(15, 15, 35, 0.98)']}
                  style={StyleSheet.absoluteFill}
                />
              </View>
            )}
            {/* Glow border */}
            <View style={styles.glowBorder} />
          </View>
        ),
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              {focused && (
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.iconGlow}
                />
              )}
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={20}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Discover Tab */}
      <Tabs.Screen
        name="discover"
        options={{
          title: t('discover'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              {focused && (
                <LinearGradient
                  colors={['#f093fb', '#f5576c']}
                  style={styles.iconGlow}
                />
              )}
              <Ionicons
                name={focused ? 'compass' : 'compass-outline'}
                size={20}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Library Tab */}
      <Tabs.Screen
        name="library"
        options={{
          title: t('library'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              {focused && (
                <LinearGradient
                  colors={['#4facfe', '#00f2fe']}
                  style={styles.iconGlow}
                />
              )}
              <Ionicons
                name={focused ? 'library' : 'library-outline'}
                size={20}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Settings Tab */}
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              {focused && (
                <LinearGradient
                  colors={['#43e97b', '#38f9d7']}
                  style={styles.iconGlow}
                />
              )}
              <Ionicons
                name={focused ? 'settings' : 'settings-outline'}
                size={20}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Hidden screens */}
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="history" options={{ href: null }} />
      <Tabs.Screen name="queue" options={{ href: null }} />
      <Tabs.Screen name="search" options={{ href: null }} />
      <Tabs.Screen name="local-network" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    overflow: 'hidden',
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    overflow: 'hidden',
  },
  androidBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    overflow: 'hidden',
  },
  glowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconWrapperActive: {
    ...Shadows.glow,
  },
  iconGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    opacity: 0.9,
  },
});

