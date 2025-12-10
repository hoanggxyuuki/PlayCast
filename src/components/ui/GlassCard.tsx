
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { BorderRadius, Colors, Glass, Shadows, Spacing } from '../../constants/theme';

interface GlassCardProps {
    children: React.ReactNode;
    variant?: 'light' | 'medium' | 'dark' | 'purple';
    onPress?: () => void;
    style?: ViewStyle;
    padding?: 'none' | 'small' | 'medium' | 'large';
    glow?: boolean;
    disabled?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    variant = 'light',
    onPress,
    style,
    padding = 'medium',
    glow = false,
    disabled = false,
}) => {
    const getGlassStyle = () => {
        switch (variant) {
            case 'light': return Glass.light;
            case 'medium': return Glass.medium;
            case 'dark': return Glass.dark;
            case 'purple': return Glass.purple;
            default: return Glass.light;
        }
    };

    const getPadding = () => {
        switch (padding) {
            case 'none': return 0;
            case 'small': return Spacing.sm;
            case 'medium': return Spacing.md;
            case 'large': return Spacing.lg;
            default: return Spacing.md;
        }
    };

    const cardStyle = [
        styles.card,
        getGlassStyle(),
        { padding: getPadding() },
        glow && Shadows.glow,
        style,
    ];

    if (onPress) {
        return (
            <Pressable
                onPress={onPress}
                disabled={disabled}
                style={({ pressed }) => [cardStyle, pressed && styles.pressed, disabled && styles.disabled]}
            >
                {children}
            </Pressable>
        );
    }

    return <View style={cardStyle}>{children}</View>;
};


interface GradientGlassCardProps extends Omit<GlassCardProps, 'variant'> {
    colors?: string[];
}

export const GradientGlassCard: React.FC<GradientGlassCardProps> = ({
    children,
    onPress,
    style,
    padding = 'medium',
    colors = ['rgba(102, 126, 234, 0.15)', 'rgba(118, 75, 162, 0.15)'],
    disabled = false,
}) => {
    const getPadding = () => {
        switch (padding) {
            case 'none': return 0;
            case 'small': return Spacing.sm;
            case 'medium': return Spacing.md;
            case 'large': return Spacing.lg;
            default: return Spacing.md;
        }
    };

    const content = (
        <LinearGradient
            colors={colors as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradientCard, { padding: getPadding() }, style]}
        >
            {children}
        </LinearGradient>
    );

    if (onPress) {
        return (
            <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [pressed && styles.pressed]}>
                {content}
            </Pressable>
        );
    }

    return content;
};

const styles = StyleSheet.create({
    card: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
    gradientCard: { borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
    pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
    disabled: { opacity: 0.5 },
});

export default GlassCard;
