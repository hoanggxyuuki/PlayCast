
import { DiscoverScreen } from '@/src/screens/DiscoverScreen';
import { useLocalSearchParams } from 'expo-router';

export default function Discover() {
    const { tab } = useLocalSearchParams<{ tab?: string }>();

    return <DiscoverScreen initialTab={tab as 'local' | 'online' | 'link' | undefined} />;
}
