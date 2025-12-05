// Home Tab - New Modern Design
import { NewHomeScreen } from '@/src/screens/NewHomeScreen';
import { useRouter } from 'expo-router';
import React from 'react';

export default function HomeTab() {
  const router = useRouter();

  return (
    <NewHomeScreen
      onNavigateToAddPlaylist={() => router.push('/add-playlist')}
      onNavigateToChannels={(playlistId) => router.push(`/channels/${playlistId}`)}
    />
  );
}
