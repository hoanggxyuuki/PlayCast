
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../constants/theme';
import { SleepTimerService } from '../../services/sleepTimerService';

interface SleepTimerModalProps {
    visible: boolean;
    onClose: () => void;
    onTimerSet?: (minutes: number) => void;
}

const PRESET_OPTIONS = [
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '1 hour', value: 60 },
    { label: '1.5 hours', value: 90 },
    { label: '2 hours', value: 120 },
];

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
    visible,
    onClose,
    onTimerSet,
}) => {
    const [customMinutes, setCustomMinutes] = useState('');
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [remainingTime, setRemainingTime] = useState('');

    useEffect(() => {
        if (visible) {
            setIsTimerActive(SleepTimerService.isActive());
            setRemainingTime(SleepTimerService.getRemainingFormatted());
        }
    }, [visible]);

    useEffect(() => {
        if (!visible) return;

        const interval = setInterval(() => {
            setIsTimerActive(SleepTimerService.isActive());
            setRemainingTime(SleepTimerService.getRemainingFormatted());
        }, 1000);

        return () => clearInterval(interval);
    }, [visible]);

    const handleSetTimer = (minutes: number) => {
        SleepTimerService.start(minutes);
        setIsTimerActive(true);
        onTimerSet?.(minutes);
        onClose();
    };

    const handleSetCustomTimer = () => {
        const minutes = parseInt(customMinutes, 10);
        if (minutes > 0 && minutes <= 480) {
            handleSetTimer(minutes);
            setCustomMinutes('');
        }
    };

    const handleCancelTimer = () => {
        SleepTimerService.cancel();
        setIsTimerActive(false);
        setRemainingTime('');
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
                        <Ionicons name="moon" size={24} color={Colors.primary} />
                        <Text style={styles.title}>Sleep Timer</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {isTimerActive && (
                        <View style={styles.activeTimer}>
                            <View style={styles.activeTimerInfo}>
                                <Ionicons name="time" size={20} color={Colors.accent} />
                                <Text style={styles.activeTimerText}>
                                    Timer active: {remainingTime}
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelTimer}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <Text style={styles.sectionTitle}>Set timer</Text>

                    <View style={styles.presetGrid}>
                        {PRESET_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={styles.presetBtn}
                                onPress={() => handleSetTimer(option.value)}
                            >
                                <Text style={styles.presetBtnText}>{option.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.sectionTitle}>Custom time</Text>

                    <View style={styles.customRow}>
                        <TextInput
                            style={styles.customInput}
                            placeholder="Minutes"
                            placeholderTextColor={Colors.textTertiary}
                            keyboardType="number-pad"
                            value={customMinutes}
                            onChangeText={setCustomMinutes}
                            maxLength={3}
                        />
                        <TouchableOpacity
                            style={[styles.customBtn, !customMinutes && styles.customBtnDisabled]}
                            onPress={handleSetCustomTimer}
                            disabled={!customMinutes}
                        >
                            <Text style={styles.customBtnText}>Set</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.hint}>
                        Playback will stop after the selected time
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
        width: '90%',
        maxWidth: 380,
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
    activeTimer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(118, 75, 162, 0.15)',
        padding: Spacing.md,
        margin: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    activeTimerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    activeTimerText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.accent,
    },
    cancelBtn: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.error,
        borderRadius: BorderRadius.sm,
    },
    cancelBtnText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        color: '#fff',
    },
    sectionTitle: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        color: Colors.textSecondary,
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    presetGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: Spacing.sm,
        gap: Spacing.sm,
    },
    presetBtn: {
        width: '30%',
        paddingVertical: Spacing.md,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        marginHorizontal: '1.5%',
    },
    presetBtnText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        color: Colors.text,
    },
    customRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
    },
    customInput: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontSize: FontSizes.md,
        color: Colors.text,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    customBtn: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
    },
    customBtnDisabled: {
        opacity: 0.5,
    },
    customBtnText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: '#fff',
    },
    hint: {
        fontSize: FontSizes.xs,
        color: Colors.textTertiary,
        textAlign: 'center',
        padding: Spacing.md,
    },
});
