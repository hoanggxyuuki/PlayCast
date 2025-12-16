
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
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
    autoPlayInterval = 0,
    onSlidePress,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<FlatList>(null);

    const ITEM_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;
    const ITEM_SPACING = Spacing.sm;

    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        {
            useNativeDriver: true,
            listener: (event: any) => {
                const offsetX = event.nativeEvent.contentOffset.x;
                const index = Math.round(offsetX / (ITEM_WIDTH + ITEM_SPACING));
                if (index >= 0 && index < slides.length && index !== currentIndex) {
                    setCurrentIndex(index);
                }
            }
        }
    );

    const renderSlide = ({ item, index }: { item: CarouselSlide; index: number }) => {
        const gradientColors = item.gradient || Gradients.primary;

        const inputRange = [
            (index - 1) * (ITEM_WIDTH + ITEM_SPACING),
            index * (ITEM_WIDTH + ITEM_SPACING),
            (index + 1) * (ITEM_WIDTH + ITEM_SPACING),
        ];

        const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.92, 1, 0.92],
            extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.7, 1, 0.7],
            extrapolate: 'clamp',
        });

        return (
            <Animated.View style={[
                { width: ITEM_WIDTH, marginRight: ITEM_SPACING },
                { transform: [{ scale }], opacity }
            ]}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => onSlidePress?.(item)}
                >
                    <LinearGradient
                        colors={gradientColors as [string, string, ...string[]]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.slideContainer}
                    >
                        {/* Background Icon */}
                        <View style={styles.backgroundIcon}>
                            <Ionicons
                                name={item.icon || 'musical-notes'}
                                size={140}
                                color="rgba(255,255,255,0.12)"
                            />
                        </View>

                        {/* Content */}
                        <View style={styles.content}>
                            <View style={styles.iconBadge}>
                                <Ionicons
                                    name={item.icon || 'play-circle'}
                                    size={24}
                                    color="#fff"
                                />
                            </View>
                            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                            <Text style={styles.subtitle} numberOfLines={1}>{item.subtitle}</Text>

                            {/* Play hint */}
                            <View style={styles.playHint}>
                                <Ionicons name="play-circle" size={18} color="rgba(255,255,255,0.9)" />
                                <Text style={styles.playHintText}>Nhấn để phát</Text>
                            </View>
                        </View>

                        {/* Background Image */}
                        {item.image && (
                            <Image
                                source={{ uri: item.image }}
                                style={styles.image}
                                resizeMode="cover"
                            />
                        )}

                        {/* Shimmer */}
                        <View style={styles.shimmerOverlay} />
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <Animated.FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderSlide}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                snapToInterval={ITEM_WIDTH + ITEM_SPACING}
                decelerationRate="fast"
                contentContainerStyle={{
                    paddingHorizontal: Spacing.lg,
                }}
            />

            {/* Pagination dots */}
            {slides.length > 1 && (
                <View style={styles.pagination}>
                    {slides.map((_, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => {
                                setCurrentIndex(index);
                                flatListRef.current?.scrollToIndex({ index, animated: true });
                            }}
                        >
                            <View
                                style={[
                                    styles.dot,
                                    index === currentIndex && styles.dotActive,
                                ]}
                            />
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: Spacing.md,
        marginBottom: Spacing.lg,
    },
    slideContainer: {
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        height: 180,
        padding: Spacing.lg,
        ...({ shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 }),
    },
    backgroundIcon: {
        position: 'absolute',
        right: -20,
        bottom: -20,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        zIndex: 1,
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
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: FontSizes.md,
        color: 'rgba(255,255,255,0.95)',
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    playHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.md,
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        alignSelf: 'flex-start',
    },
    playHintText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
    },
    image: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.25,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: Spacing.sm,
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
