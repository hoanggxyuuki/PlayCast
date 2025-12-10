
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Gradients } from '../../constants/theme';

interface GradientBackgroundProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'dark' | 'card' | 'accent';
    style?: ViewStyle;
    start?: { x: number; y: number };
    end?: { x: number; y: number };
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
    children,
    variant = 'primary',
    style,
    start = { x: 0, y: 0 },
    end = { x: 1, y: 1 },
}) => {
    const getColors = () => {
        switch (variant) {
            case 'primary':
                return Gradients.primary;
            case 'secondary':
                return Gradients.secondary;
            case 'dark':
                return Gradients.dark;
            case 'card':
                return Gradients.card;
            case 'accent':
                return Gradients.accent;
            default:
                return Gradients.primary;
        }
    };

    return (
        <LinearGradient
            colors={getColors() as [string, string, ...string[]]}
            start={start}
            end={end}
            style={[styles.container, style]}
        >
            {children}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default GradientBackground;
