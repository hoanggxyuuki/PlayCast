// Library Tab - Combines playlists, favorites, history, queue
import { LibraryScreen } from '@/src/screens/LibraryScreen';
import { useRouter } from 'expo-router';

export default function Library() {
    const router = useRouter();

    return (
        <LibraryScreen
            onNavigateToChannels={(playlistId) => router.push(`/channels/${playlistId}`)}
        />
    );
}
