import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableProps } from 'react-native';

import { type AppTheme, useTheme } from '@/core/theme';

import { AppIcon, type AppIconName } from './app-icon';

interface NavigationRowProps extends Omit<PressableProps, 'children' | 'style'> {
  readonly description?: string;
  readonly icon: AppIconName;
  readonly label: string;
}

export function NavigationRow({ description, icon, label, ...pressableProps }: NavigationRowProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      {...pressableProps}
    >
      <View style={styles.iconContainer}>
        <AppIcon color={theme.colors.primary} name={icon} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <AppIcon name="chevron-right" size={theme.sizes.icon.sm} />
    </Pressable>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    row: {
      minHeight: 68,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    pressed: {
      backgroundColor: theme.colors.surfaceSoft,
    },
    iconContainer: {
      width: theme.sizes.touchTarget,
      height: theme.sizes.touchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.primarySoft,
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
      ...theme.typography.caption,
      marginTop: theme.spacing.xs,
    },
  });
}
