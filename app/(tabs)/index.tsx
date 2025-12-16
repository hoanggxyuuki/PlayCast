
import { NewHomeScreen } from '@/src/screens/NewHomeScreen';
import { useRouter } from 'expo-router';

export default function HomeTab() {
  const router = useRouter();

  return (
    <NewHomeScreen
      onNavigateToAddPlaylist={() => router.push('/add-playlist')}
      onNavigateToChannels={(playlistId) => router.push(`/channels/${playlistId}`)}
      onNavigateToLocalFiles={() => router.push('/discover?tab=local')}
      onNavigateToOnline={() => router.push('/discover?tab=online')}
      onNavigateToPremium={() => router.push('/premium')}
      onNavigateToLibrary={() => router.push('/library')}
    />
  );
}
