import React from 'react';
import { useRouter } from 'expo-router';
import { HomeScreen } from '@/src/screens/HomeScreen';

export default function HomeTab() {
  const router = useRouter();

  return (
    <HomeScreen
      onNavigateToAddPlaylist={() => router.push('/add-playlist')}
      onNavigateToChannels={(playlistId) => router.push(`/channels/${playlistId}`)}
    />
  );
}
