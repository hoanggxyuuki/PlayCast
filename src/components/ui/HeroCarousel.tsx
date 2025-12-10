
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, FontSizes, Gradients, Spacing } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface CarouselSlide {
    id: string;
    title: string;
    subtitle: string;
    image?: string;
    gradient?: string[];
    icon?: keyof typeof Ionicons.glyphMap;
    action?: {
        label: string;
        onPress: () => void;
    };
}

interface HeroCarouselProps {
    slides: CarouselSlide[];
    autoPlayInterval?: number;
    onSlidePress?: (slide: CarouselSlide) => void;
}


const DEFAULT_SLIDES: CarouselSlide[] = [
    {
        id: '1',
        title: 'Welcome to PlayCast',
        subtitle: 'Your media, your way',
        gradient: ['#667eea', '#764ba2'],
        icon: 'play-circle',
    },
    {
        id: '2',
        title: 'YouTube & SoundCloud',
        subtitle: 'Stream from your favorite platforms',
        gradient: ['#f093fb', '#f5576c'],
        icon: 'logo-youtube',
    },
    {
        id: '3',
        title: 'IPTV Support',
        subtitle: 'M3U playlists and live TV',
        gradient: ['#4facfe', '#00f2fe'],
        icon: 'tv',
    },
    {
        id: '4',
        title: 'Background Play',
        subtitle: 'Listen while multitasking',
        gradient: ['#43e97b', '#38f9d7'],
        icon: 'headset',
    },
];

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
    slides = DEFAULT_SLIDES,
    autoPlayInterval = 4000,
    onSlidePress,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (slides.length <= 1) return;

        const interval = setInterval(() => {

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: -30,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.95,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => {

                setCurrentIndex((prev) => (prev + 1) % slides.length);
                slideAnim.setValue(30);


                Animated.parallel([
                    Animated.spring(fadeAnim, {
                        toValue: 1,
                        tension: 50,
                        friction: 7,
                        useNativeDriver: true,
                    }),
                    Animated.spring(slideAnim, {
                        toValue: 0,
                        tension: 50,
                        friction: 7,
                        useNativeDriver: true,
                    }),
                    Animated.spring(scaleAnim, {
                        toValue: 1,
                        tension: 50,
                        friction: 7,
                        useNativeDriver: true,
                    }),
                ]).start();
            });
        }, autoPlayInterval);

        return () => clearInterval(interval);
    }, [slides.length, autoPlayInterval, fadeAnim, slideAnim, scaleAnim]);

    const currentSlide = slides[currentIndex];
    const gradientColors = currentSlide.gradient || Gradients.primary;

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onSlidePress?.(currentSlide)}
        >
            <LinearGradient
                colors={gradientColors as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                <Animated.View
                    style={[
                        styles.contentContainer,
                        {
                            opacity: fadeAnim,
                            transform: [
                                { translateX: slideAnim },
                                { scale: scaleAnim },
                            ],
                        },
                    ]}
                >
                    {}
                    <View style={styles.backgroundIcon}>
                        <Ionicons
                            name={currentSlide.icon || 'musical-notes'}
                            size={140}
                            color="rgba(255,255,255,0.12)"
                        />
                    </View>

                    {}
                    <View style={styles.content}>
                        <View style={styles.iconBadge}>
                            <Ionicons
                                name={currentSlide.icon || 'play-circle'}
                                size={24}
                                color="#fff"
                            />
                        </View>
                        <Text style={styles.title}>{currentSlide.title}</Text>
                        <Text style={styles.subtitle}>{currentSlide.subtitle}</Text>

                        {currentSlide.action && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={currentSlide.action.onPress}
                            >
                                <Text style={styles.actionText}>{currentSlide.action.label}</Text>
                                <Ionicons name="arrow-forward" size={16} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {}
                    {currentSlide.image && (
                        <Image
                            source={{ uri: currentSlide.image }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    )}
                </Animated.View>

                {}
                {slides.length > 1 && (
                    <View style={styles.pagination}>
                        {slides.map((_, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => setCurrentIndex(index)}
                            >
                                <Animated.View
                                    style={[
                                        styles.dot,
                                        index === currentIndex && styles.dotActive,
                                    ]}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {}
                <View style={styles.shimmerOverlay} />
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: Spacing.md,
        marginTop: Spacing.md,
        marginBottom: Spacing.lg,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        height: 180,
        ...({ shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 }),
    },
    contentContainer: {
        flex: 1,
        padding: Spacing.lg,
    },
    backgroundIcon: {
        position: 'absolute',
        right: -20,
        bottom: -20,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    iconBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    title: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    subtitle: {
        fontSize: FontSizes.md,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    image: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.4,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        alignSelf: 'flex-start',
        marginTop: Spacing.md,
    },
    actionText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        color: '#fff',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        position: 'absolute',
        bottom: Spacing.md,
        left: 0,
        right: 0,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    dotActive: {
        width: 24,
        backgroundColor: '#fff',
    },
    shimmerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',

    },
});
