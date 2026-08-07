import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { type AppTheme, useTheme } from '@/core/theme';

export type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  readonly label: string;
  readonly variant?: BadgeVariant;
}

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.base, styles[`${variant}Container`]]}>
      <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    base: {
      alignSelf: 'flex-start',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radii.full,
    },
    label: theme.typography.label,
    neutralContainer: { backgroundColor: theme.colors.surfaceMuted },
    neutralLabel: { color: theme.colors.textSecondary },
    accentContainer: { backgroundColor: theme.colors.accentSoft },
    accentLabel: { color: theme.colors.accentStrong },
    successContainer: { backgroundColor: theme.colors.successSoft },
    successLabel: { color: theme.colors.success },
    warningContainer: { backgroundColor: theme.colors.warningSoft },
    warningLabel: { color: theme.colors.warning },
    dangerContainer: { backgroundColor: theme.colors.dangerSoft },
    dangerLabel: { color: theme.colors.danger },
  });
}
