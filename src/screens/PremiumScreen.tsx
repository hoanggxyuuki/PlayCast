// Premium Coming Soon Screen - Beautiful preview of upcoming features
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../components/ui/GlassCard';
import { Colors, FontSizes, Gradients, Spacing } from '../constants/theme';
import { useTranslation } from '../i18n/useTranslation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PremiumScreenProps {
    onBack: () => void;
}

interface UpcomingFeature {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
    color: string;
}

export const PremiumScreen: React.FC<PremiumScreenProps> = ({ onBack }) => {
    const { t } = useTranslation();

    const upcomingFeatures: UpcomingFeature[] = [
        { icon: 'cloud-download', title: 'Smart Downloads', description: 'Tự động tải video khi kết nối WiFi', color: '#4facfe' },
        { icon: 'color-palette', title: 'Custom Themes', description: 'Tùy chỉnh giao diện theo ý thích', color: '#43e97b' },
        { icon: 'people', title: 'Family Sharing', description: 'Chia sẻ playlist với gia đình', color: '#f093fb' },
        { icon: 'stats-chart', title: 'Watch Statistics', description: 'Theo dõi thời gian xem', color: '#fa709a' },
        { icon: 'notifications', title: 'Smart Reminders', description: 'Nhắc nhở xem chương trình yêu thích', color: '#667eea' },
        { icon: 'shield-checkmark', title: 'Ad-Free Experience', description: 'Trải nghiệm không quảng cáo', color: '#f5576c' },
        { icon: 'musical-notes', title: 'Audio Equalizer Pro', description: '10-band EQ với presets chuyên nghiệp', color: '#4facfe' },
        { icon: 'tv', title: 'Chromecast Support', description: 'Cast lên TV dễ dàng', color: '#43e97b' },
        { icon: 'globe', title: 'Multi-Language', description: 'Hỗ trợ 20+ ngôn ngữ', color: '#f093fb' },
    ];

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1a1a2e', '#16213e', '#0f3460']}
                style={styles.gradient}
            >
                <SafeAreaView style={styles.safeArea} edges={['top']}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={onBack}>
                            <Ionicons name="arrow-back" size={24} color={Colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Premium</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Diamond Hero */}
                        <View style={styles.hero}>
                            <LinearGradient
                                colors={['rgba(102, 126, 234, 0.3)', 'rgba(118, 75, 162, 0.3)']}
                                style={styles.diamondContainer}
                            >
                                <LinearGradient
                                    colors={Gradients.primary}
                                    style={styles.diamondInner}
                                >
                                    <Ionicons name="diamond" size={60} color="#fff" />
                                </LinearGradient>
                            </LinearGradient>

                            <Text style={styles.heroTitle}>Coming Soon</Text>
                            <Text style={styles.heroSubtitle}>
                                Chúng tôi đang phát triển những tính năng tuyệt vời cho bạn
                            </Text>
                        </View>

                        {/* Stats */}
                        <View style={styles.statsContainer}>
                            <GlassCard variant="purple" padding="medium" style={styles.statCard}>
                                <Text style={styles.statNumber}>100+</Text>
                                <Text style={styles.statLabel}>Tính năng mới</Text>
                            </GlassCard>
                            <GlassCard variant="purple" padding="medium" style={styles.statCard}>
                                <Text style={styles.statNumber}>2026</Text>
                                <Text style={styles.statLabel}>Dự kiến ra mắt</Text>
                            </GlassCard>
                        </View>

                        {/* Features Grid */}
                        <Text style={styles.sectionTitle}>Tính năng sắp ra mắt</Text>

                        <View style={styles.featuresGrid}>
                            {upcomingFeatures.map((feature, index) => (
                                <GlassCard
                                    key={index}
                                    variant="purple"
                                    padding="medium"
                                    style={styles.featureCard}
                                >
                                    <View style={[styles.featureIcon, { backgroundColor: `${feature.color}20` }]}>
                                        <Ionicons name={feature.icon} size={24} color={feature.color} />
                                    </View>
                                    <Text style={styles.featureTitle}>{feature.title}</Text>
                                    <Text style={styles.featureDesc}>{feature.description}</Text>
                                </GlassCard>
                            ))}
                        </View>

                        {/* CTA */}
                        <GlassCard variant="purple" padding="large" style={styles.ctaCard}>
                            <Ionicons name="heart" size={32} color={Colors.primary} />
                            <Text style={styles.ctaTitle}>Cảm ơn bạn đã sử dụng PlayCast!</Text>
                            <Text style={styles.ctaDesc}>
                                Hãy theo dõi các bản cập nhật mới nhất của chúng tôi
                            </Text>

                        </GlassCard>

                        {/* Footer */}
                        <Text style={styles.footer}>Made with ❤️ by BiDev</Text>

                        <View style={{ height: 40 }} />
                    </ScrollView>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
        color: Colors.text,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.md,
    },
    hero: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    diamondContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    diamondInner: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    heroSubtitle: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: Spacing.xl,
        lineHeight: 24,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 36,
        fontWeight: '800',
        color: Colors.primary,
    },
    statLabel: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
    sectionTitle: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: Spacing.md,
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    featureCard: {
        width: (SCREEN_WIDTH - Spacing.md * 3) / 2,
        alignItems: 'center',
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    featureTitle: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: Spacing.xs,
    },
    featureDesc: {
        fontSize: FontSizes.xs,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 16,
    },
    ctaCard: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    ctaTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '700',
        color: Colors.text,
        marginTop: Spacing.md,
        textAlign: 'center',
    },
    ctaDesc: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: Spacing.sm,
    },
    socialButtons: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.lg,
    },
    socialButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footer: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: Spacing.md,
    },
});

export default PremiumScreen;
