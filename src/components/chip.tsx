import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { type AppTheme, useTheme } from '@/core/theme';

interface ChipProps extends Omit<PressableProps, 'children' | 'style'> {
  readonly label: string;
  readonly selected?: boolean;
}

export function Chip({ disabled, label, selected = false, ...pressableProps }: ChipProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled), selected }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        selected && styles.selected,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      {...pressableProps}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    base: {
      minHeight: theme.sizes.touchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radii.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    selected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    pressed: {
      opacity: 0.85,
    },
    disabled: {
      opacity: 0.5,
    },
    label: {
      color: theme.colors.textSecondary,
      ...theme.typography.label,
    },
    selectedLabel: {
      color: theme.colors.textOnPrimary,
    },
  });
}
