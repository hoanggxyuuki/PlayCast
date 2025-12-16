
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';

export type AspectRatio = 'default' | '16:9' | '4:3' | '21:9' | 'fill' | 'fit';

interface AspectRatioControlProps {
  visible: boolean;
  currentRatio: AspectRatio;
  onClose: () => void;
  onSelect: (ratio: AspectRatio) => void;
}

const ASPECT_RATIOS: { value: AspectRatio; label: string; icon: string; description: string }[] = [
  { value: 'default', label: 'Default', icon: 'square-outline', description: 'Original video size' },
  { value: '16:9', label: '16:9', icon: 'rectangle-outline', description: 'Widescreen' },
  { value: '4:3', label: '4:3', icon: 'tablet-portrait-outline', description: 'Standard' },
  { value: '21:9', label: '21:9', icon: 'tablet-landscape-outline', description: 'Ultra-wide' },
  { value: 'fill', label: 'Fill', icon: 'expand-outline', description: 'Fill entire screen' },
  { value: 'fit', label: 'Fit', icon: 'contract-outline', description: 'Fit to screen' },
];

export const AspectRatioControl: React.FC<AspectRatioControlProps> = ({
  visible,
  currentRatio,
  onClose,
  onSelect,
}) => {
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
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Aspect Ratio</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.options}>
            {ASPECT_RATIOS.map(ratio => (
              <TouchableOpacity
                key={ratio.value}
                style={[
                  styles.option,
                  currentRatio === ratio.value && styles.optionActive,
                ]}
                onPress={() => {
                  onSelect(ratio.value);
                  onClose();
                }}
              >
                <View style={styles.optionIcon}>
                  <Ionicons
                    name={ratio.icon as any}
                    size={28}
                    color={currentRatio === ratio.value ? Colors.primary : Colors.text}
                  />
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionLabel}>{ratio.label}</Text>
                  <Text style={styles.optionDescription}>{ratio.description}</Text>
                </View>
                {currentRatio === ratio.value && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  options: {
    padding: Spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },
  optionActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  optionDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
