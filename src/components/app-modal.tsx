import { useMemo, type PropsWithChildren } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type AppTheme, useTheme } from '@/core/theme';

interface AppModalProps extends PropsWithChildren {
  readonly onClose: () => void;
  readonly title: string;
  readonly visible: boolean;
}

export function AppModal({ children, onClose, title, visible }: AppModalProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      transparent
      visible={visible}
    >
      <SafeAreaView style={styles.overlay}>
        <Pressable accessible={false} onPress={onClose} style={styles.backdrop} />
        <View accessibilityViewIsModal style={styles.sheet}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <Pressable
              accessibilityLabel="Modalı kapat"
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
            >
              <Text style={styles.closeLabel}>×</Text>
            </Pressable>
          </View>
          <View style={styles.content}>{children}</View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing['2xl'],
      backgroundColor: theme.colors.overlay,
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    sheet: {
      width: '100%',
      maxWidth: theme.sizes.contentMaxWidth,
      padding: theme.spacing['2xl'],
      borderRadius: theme.radii.xl,
      backgroundColor: theme.colors.surface,
      ...theme.shadows.floating,
    },
    title: {
      flex: 1,
      color: theme.colors.textPrimary,
      ...theme.typography.sectionTitle,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    closeButton: {
      width: theme.sizes.touchTarget,
      height: theme.sizes.touchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -theme.spacing.sm,
      marginRight: -theme.spacing.sm,
      borderRadius: theme.radii.full,
    },
    closeButtonPressed: {
      backgroundColor: theme.colors.surfaceSoft,
    },
    closeLabel: {
      color: theme.colors.textSecondary,
      fontSize: 28,
      lineHeight: 30,
    },
    content: {
      marginTop: theme.spacing.lg,
    },
  });
}
