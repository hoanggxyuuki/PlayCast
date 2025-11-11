import React from 'react';
import { useRouter } from 'expo-router';
import { AddPlaylistScreen } from '@/src/screens/AddPlaylistScreen';

export default function AddPlaylist() {
  const router = useRouter();

  return (
    <AddPlaylistScreen
      onBack={() => router.back()}
      onSuccess={() => router.back()}
    />
  );
}
