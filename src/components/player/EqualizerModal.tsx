
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../constants/theme';

interface EqualizerModalProps {
    visible: boolean;
    onClose: () => void;
    onPresetChange?: (preset: string) => void;
}

interface EQPreset {
    id: string;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
    bands: number[]; 
}

const EQ_PRESETS: EQPreset[] = [
    { id: 'flat', name: 'Flat', icon: 'remove-outline', bands: [0, 0, 0, 0, 0] },
    { id: 'bass', name: 'Bass Boost', icon: 'pulse', bands: [6, 4, 0, -2, -4] },
    { id: 'treble', name: 'Treble Boost', icon: 'musical-notes', bands: [-4, -2, 0, 4, 6] },
    { id: 'vocal', name: 'Vocal', icon: 'mic', bands: [-2, 0, 4, 2, 0] },
    { id: 'rock', name: 'Rock', icon: 'skull', bands: [4, 2, -2, 2, 4] },
    { id: 'pop', name: 'Pop', icon: 'happy', bands: [-1, 2, 4, 2, -1] },
    { id: 'jazz', name: 'Jazz', icon: 'cafe', bands: [3, 0, 2, 3, 4] },
    { id: 'classical', name: 'Classical', icon: 'book', bands: [4, 2, 0, 2, 4] },
];

const BAND_LABELS = ['60Hz', '250Hz', '1kHz', '4kHz', '16kHz'];

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
    visible,
    onClose,
    onPresetChange,
}) => {
    const [selectedPreset, setSelectedPreset] = useState<string>('flat');
    const [customBands, setCustomBands] = useState<number[]>([0, 0, 0, 0, 0]);
    const [isCustom, setIsCustom] = useState(false);

    const currentBands = isCustom ? customBands : (EQ_PRESETS.find(p => p.id === selectedPreset)?.bands || [0, 0, 0, 0, 0]);

    const handlePresetSelect = (presetId: string) => {
        setSelectedPreset(presetId);
        setIsCustom(false);
        onPresetChange?.(presetId);
    };

    const handleBandChange = (index: number, value: number) => {
        const newBands = [...customBands];
        newBands[index] = value;
        setCustomBands(newBands);
        setIsCustom(true);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                    style={styles.container}
                >
                    <View style={styles.header}>
                        <Ionicons name="options" size={24} color={Colors.primary} />
                        <Text style={styles.title}>Equalizer</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {}
                    <View style={styles.eqContainer}>
                        {currentBands.map((value, index) => (
                            <View key={index} style={styles.bandContainer}>
                                <Text style={styles.bandValue}>{value > 0 ? `+${value}` : value}dB</Text>
                                <View style={styles.sliderContainer}>
                                    <Slider
                                        style={styles.slider}
                                        minimumValue={-12}
                                        maximumValue={12}
                                        step={1}
                                        value={value}
                                        onValueChange={(v) => handleBandChange(index, v)}
                                        minimumTrackTintColor={Colors.primary}
                                        maximumTrackTintColor={Colors.border}
                                        thumbTintColor={Colors.primary}
                                        vertical={false}
                                    />
                                </View>
                                <Text style={styles.bandLabel}>{BAND_LABELS[index]}</Text>
                            </View>
                        ))}
                    </View>

                    {}
                    <Text style={styles.sectionTitle}>Presets</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsScroll}>
                        {EQ_PRESETS.map((preset) => (
                            <TouchableOpacity
                                key={preset.id}
                                style={[
                                    styles.presetBtn,
                                    selectedPreset === preset.id && !isCustom && styles.presetBtnActive,
                                ]}
                                onPress={() => handlePresetSelect(preset.id)}
                            >
                                <Ionicons
                                    name={preset.icon}
                                    size={20}
                                    color={selectedPreset === preset.id && !isCustom ? Colors.primary : Colors.textSecondary}
                                />
                                <Text style={[
                                    styles.presetText,
                                    selectedPreset === preset.id && !isCustom && styles.presetTextActive,
                                ]}>
                                    {preset.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={styles.note}>
                        Note: Equalizer requires native audio processing support
                    </Text>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '92%',
        maxWidth: 420,
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        gap: Spacing.sm,
    },
    title: {
        flex: 1,
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: Colors.text,
    },
    closeBtn: {
        padding: Spacing.xs,
    },
    eqContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.lg,
    },
    bandContainer: {
        flex: 1,
        alignItems: 'center',
    },
    bandValue: {
        fontSize: FontSizes.xs,
        color: Colors.primary,
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    sliderContainer: {
        height: 120,
        justifyContent: 'center',
    },
    slider: {
        width: 120,
        height: 40,
        transform: [{ rotate: '-90deg' }],
    },
    bandLabel: {
        fontSize: FontSizes.xs,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
    sectionTitle: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        color: Colors.textSecondary,
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.sm,
    },
    presetsScroll: {
        paddingHorizontal: Spacing.sm,
        marginBottom: Spacing.md,
    },
    presetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        marginHorizontal: Spacing.xs,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    presetBtnActive: {
        backgroundColor: 'rgba(118, 75, 162, 0.2)',
        borderColor: Colors.primary,
    },
    presetText: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    presetTextActive: {
        color: Colors.primary,
    },
    note: {
        fontSize: FontSizes.xs,
        color: Colors.textTertiary,
        textAlign: 'center',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
    },
});
