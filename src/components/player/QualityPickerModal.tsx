
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../constants/theme';
import { VideoQualityOption } from '../../services/OnlineSearchService';

interface QualityPickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectQuality: (option: VideoQualityOption) => void;
    options: VideoQualityOption[];
    currentQuality?: string;
    isLoading?: boolean;
}

export const QualityPickerModal: React.FC<QualityPickerModalProps> = ({
    visible,
    onClose,
    onSelectQuality,
    options,
    currentQuality,
    isLoading = false,
}) => {
    const formatBitrate = (bitrate: number): string => {
        if (bitrate >= 1000000) {
            return `${(bitrate / 1000000).toFixed(1)} Mbps`;
        }
        return `${Math.round(bitrate / 1000)} Kbps`;
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
                        <Ionicons name="settings-outline" size={24} color={Colors.primary} />
                        <Text style={styles.title}>Video Quality</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                            <Text style={styles.loadingText}>Loading quality options...</Text>
                        </View>
                    ) : options.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="alert-circle-outline" size={48} color={Colors.textTertiary} />
                            <Text style={styles.emptyText}>No quality options available</Text>
                        </View>
                    ) : (
                        <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                            {options.map((option) => {
                                const isSelected = currentQuality === option.quality;
                                return (
                                    <TouchableOpacity
                                        key={option.itag}
                                        style={[styles.optionItem, isSelected && styles.optionItemActive]}
                                        onPress={() => onSelectQuality(option)}
                                    >
                                        <View style={styles.optionInfo}>
                                            <Text style={[styles.optionQuality, isSelected && styles.optionTextActive]}>
                                                {option.quality}
                                            </Text>
                                            <Text style={styles.optionMeta}>
                                                {formatBitrate(option.bitrate)} • {option.hasAudio ? '🔊' : '🔇'}
                                            </Text>
                                        </View>
                                        {isSelected && (
                                            <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}

                            {}
                            <TouchableOpacity
                                style={[styles.optionItem, currentQuality === 'auto' && styles.optionItemActive]}
                                onPress={() => onSelectQuality({
                                    itag: 0,
                                    quality: 'auto',
                                    mimeType: '',
                                    bitrate: 0,
                                    url: '',
                                    hasAudio: true,
                                    hasVideo: true,
                                })}
                            >
                                <View style={styles.optionInfo}>
                                    <Text style={[styles.optionQuality, currentQuality === 'auto' && styles.optionTextActive]}>
                                        Auto
                                    </Text>
                                    <Text style={styles.optionMeta}>Recommended</Text>
                                </View>
                                {currentQuality === 'auto' && (
                                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    )}
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
        width: '85%',
        maxWidth: 360,
        maxHeight: '70%',
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
    loadingContainer: {
        padding: Spacing.xxl,
        alignItems: 'center',
        gap: Spacing.md,
    },
    loadingText: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
    },
    emptyContainer: {
        padding: Spacing.xxl,
        alignItems: 'center',
        gap: Spacing.md,
    },
    emptyText: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    optionsList: {
        padding: Spacing.sm,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        marginVertical: Spacing.xs,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.surface,
    },
    optionItemActive: {
        backgroundColor: 'rgba(118, 75, 162, 0.2)',
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    optionInfo: {
        flex: 1,
    },
    optionQuality: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.text,
    },
    optionTextActive: {
        color: Colors.primary,
    },
    optionMeta: {
        fontSize: FontSizes.xs,
        color: Colors.textSecondary,
        marginTop: 2,
    },
});
