import React, { useEffect } from 'react';
import { Pressable, PressableProps, ViewProps, ViewStyle } from 'react-native';
import Animated, {
    BounceIn,
    Easing,
    FadeIn,
    FadeInDown,
    FadeInLeft,
    FadeInRight,
    FadeInUp,
    interpolate,
    SlideInDown,
    SlideInLeft,
    SlideInRight,
    SlideInUp,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
    ZoomIn,
} from 'react-native-reanimated';

interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
    children: React.ReactNode;
    style?: ViewStyle;
    scaleValue?: number;
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
    children,
    onPress,
    style,
    scaleValue = 0.96,
    disabled,
    ...props
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Pressable
            onPressIn={() => {
                if (!disabled) {
                    scale.value = withSpring(scaleValue, { damping: 15, stiffness: 300 });
                }
            }}
            onPressOut={() => {
                scale.value = withSpring(1, { damping: 15, stiffness: 300 });
            }}
            onPress={onPress}
            disabled={disabled}
            {...props}
        >
            <Animated.View style={[style, animatedStyle]}>
                {children}
            </Animated.View>
        </Pressable>
    );
};

interface FadeInViewProps extends ViewProps {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export const FadeInView: React.FC<FadeInViewProps> = ({
    children,
    delay = 0,
    duration = 400,
    direction = 'none',
    style,
    ...props
}) => {
    const getEnteringAnimation = () => {
        const baseAnimation = (() => {
            switch (direction) {
                case 'up': return FadeInUp;
                case 'down': return FadeInDown;
                case 'left': return FadeInLeft;
                case 'right': return FadeInRight;
                default: return FadeIn;
            }
        })();

        return baseAnimation.delay(delay).duration(duration);
    };

    return (
        <Animated.View entering={getEnteringAnimation()} style={style} {...props}>
            {children}
        </Animated.View>
    );
};

interface SlideInViewProps extends ViewProps {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
}

export const SlideInView: React.FC<SlideInViewProps> = ({
    children,
    delay = 0,
    duration = 400,
    direction = 'up',
    style,
    ...props
}) => {
    const getEnteringAnimation = () => {
        const baseAnimation = (() => {
            switch (direction) {
                case 'up': return SlideInUp;
                case 'down': return SlideInDown;
                case 'left': return SlideInLeft;
                case 'right': return SlideInRight;
                default: return SlideInUp;
            }
        })();

        return baseAnimation.delay(delay).duration(duration);
    };

    return (
        <Animated.View entering={getEnteringAnimation()} style={style} {...props}>
            {children}
        </Animated.View>
    );
};

interface ZoomInViewProps extends ViewProps {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
}

export const ZoomInView: React.FC<ZoomInViewProps> = ({
    children,
    delay = 0,
    duration = 400,
    style,
    ...props
}) => {
    return (
        <Animated.View
            entering={ZoomIn.delay(delay).duration(duration)}
            style={style}
            {...props}
        >
            {children}
        </Animated.View>
    );
};

interface BounceInViewProps extends ViewProps {
    children: React.ReactNode;
    delay?: number;
}

export const BounceInView: React.FC<BounceInViewProps> = ({
    children,
    delay = 0,
    style,
    ...props
}) => {
    return (
        <Animated.View
            entering={BounceIn.delay(delay)}
            style={style}
            {...props}
        >
            {children}
        </Animated.View>
    );
};

interface AnimatedTabIconProps {
    focused: boolean;
    children: React.ReactNode;
    activeBackgroundColor?: string;
}

export const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({
    focused,
    children,
    activeBackgroundColor = 'rgba(118, 75, 162, 0.15)',
}) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (focused) {
            scale.value = withSpring(1.15, { damping: 12, stiffness: 200 });
            opacity.value = withTiming(1, { duration: 200 });
        } else {
            scale.value = withSpring(1, { damping: 12, stiffness: 200 });
            opacity.value = withTiming(0, { duration: 200 });
        }
    }, [focused]);

    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const backgroundStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        backgroundColor: activeBackgroundColor,
        borderRadius: 12,
        padding: 6,
        position: 'absolute' as const,
        top: -6,
        left: -6,
        right: -6,
        bottom: -6,
    }));

    return (
        <Animated.View style={[{ position: 'relative' }, iconStyle]}>
            <Animated.View style={backgroundStyle} />
            {children}
        </Animated.View>
    );
};

interface StaggeredListProps {
    children: React.ReactNode[];
    staggerDelay?: number;
    initialDelay?: number;
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
    children,
    staggerDelay = 50,
    initialDelay = 0,
}) => {
    return (
        <>
            {React.Children.map(children, (child, index) => (
                <FadeInView
                    key={index}
                    delay={initialDelay + (index * staggerDelay)}
                    direction="up"
                >
                    {child}
                </FadeInView>
            ))}
        </>
    );
};

interface PulseViewProps extends ViewProps {
    children: React.ReactNode;
    isActive?: boolean;
}

export const PulseView: React.FC<PulseViewProps> = ({
    children,
    isActive = false,
    style,
    ...props
}) => {
    const scale = useSharedValue(1);

    useEffect(() => {
        if (isActive) {
            scale.value = withSpring(1.05, { damping: 10 });
            setTimeout(() => {
                scale.value = withSpring(1, { damping: 10 });
            }, 150);
        }
    }, [isActive]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={[style, animatedStyle]} {...props}>
            {children}
        </Animated.View>
    );
};

// Skeleton loading component
interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style,
}) => {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withDelay(0,
            withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }, () => {
                opacity.value = withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) });
            })
        );

        // Create infinite loop
        const interval = setInterval(() => {
            opacity.value = withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }, () => {
                opacity.value = withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) });
            });
        }, 1600);

        return () => clearInterval(interval);
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
                style,
                animatedStyle,
            ]}
        />
    );
};

// Skeleton card placeholder
interface SkeletonCardProps {
    style?: ViewStyle;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ style }) => {
    return (
        <Animated.View
            entering={FadeIn.duration(300)}
            style={[
                {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 16,
                    padding: 16,
                    gap: 12,
                },
                style,
            ]}
        >
            <Skeleton width={60} height={60} borderRadius={12} />
            <Skeleton width="80%" height={16} />
            <Skeleton width="60%" height={12} />
        </Animated.View>
    );
};

export {
    Animated, BounceIn,
    Easing, FadeIn,
    FadeInDown,
    FadeInUp, interpolate, SlideInDown,
    SlideInUp, useAnimatedStyle, useSharedValue, withDelay, withSpring,
    withTiming, ZoomIn
};

