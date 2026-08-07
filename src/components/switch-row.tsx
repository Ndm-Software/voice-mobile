import { useMemo } from 'react';
import { StyleSheet, Switch, Text, View, type SwitchProps } from 'react-native';

import { type AppTheme, useTheme } from '@/core/theme';

interface SwitchRowProps extends Omit<SwitchProps, 'accessibilityLabel'> {
  readonly description?: string;
  readonly label: string;
}

export function SwitchRow({ description, disabled, label, ...switchProps }: SwitchRowProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.row, disabled && styles.disabled]}>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Switch
        accessibilityLabel={label}
        disabled={disabled}
        ios_backgroundColor={theme.colors.surfaceMuted}
        thumbColor={theme.colors.surface}
        trackColor={{ false: theme.colors.surfaceMuted, true: theme.colors.primary }}
        {...switchProps}
      />
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    row: {
      minHeight: theme.sizes.touchTarget,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.lg,
    },
    copy: {
      flex: 1,
    },
    label: {
      color: theme.colors.textPrimary,
      ...theme.typography.cardTitle,
    },
    description: {
      color: theme.colors.textSecondary,
      ...theme.typography.bodySmall,
      marginTop: theme.spacing.xs,
    },
    disabled: {
      opacity: 0.5,
    },
  });
}
