import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChannelsScreen } from '@/src/screens/ChannelsScreen';

export default function Channels() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  if (!id || typeof id !== 'string') {
    router.back();
    return null;
  }

  return (
    <ChannelsScreen
      playlistId={id}
      onBack={() => router.back()}
    />
  );
}
