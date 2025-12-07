// Premium Screen Route
import { PremiumScreen } from '@/src/screens/PremiumScreen';
import { useRouter } from 'expo-router';

export default function Premium() {
    const router = useRouter();

    return <PremiumScreen onBack={() => router.back()} />;
}
