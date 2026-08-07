import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

import { type AppTheme, useTheme } from '@/core/theme';

import { AppIcon, type AppIconName } from './app-icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  readonly fullWidth?: boolean;
  readonly icon?: AppIconName;
  readonly label: string;
  readonly loading?: boolean;
  readonly variant?: ButtonVariant;
}

export function Button({
  disabled,
  fullWidth = false,
  icon,
  label,
  loading = false,
  variant = 'primary',
  ...pressableProps
}: ButtonProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const unavailable = disabled || loading;
  const contentColor = getContentColor(theme, variant, unavailable);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: unavailable }}
      disabled={unavailable}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        pressed && !unavailable && styles[`${variant}Pressed`],
        unavailable && styles.disabled,
      ]}
      {...pressableProps}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={contentColor} size="small" />
        ) : icon ? (
          <AppIcon color={contentColor} name={icon} size={theme.sizes.icon.sm} />
        ) : null}
        <Text style={[styles.label, { color: contentColor }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

function getContentColor(theme: AppTheme, variant: ButtonVariant, disabled: boolean) {
  if (disabled) {
    return theme.colors.textMuted;
  }

  if (variant === 'primary' || variant === 'destructive') {
    return theme.colors.textOnPrimary;
  }

  return variant === 'secondary' ? theme.colors.primary : theme.colors.textSecondary;
}

function createStyles(theme: AppTheme) {
  const basePressed: ViewStyle = { transform: [{ scale: 0.99 }] };

  return StyleSheet.create({
    base: {
      minHeight: theme.sizes.buttonHeight,
      minWidth: theme.sizes.touchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radii.md,
      borderWidth: 1,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    },
    label: theme.typography.button,
    fullWidth: {
      alignSelf: 'stretch',
    },
    primary: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    primaryPressed: {
      ...basePressed,
      borderColor: theme.colors.primaryPressed,
      backgroundColor: theme.colors.primaryPressed,
    },
    secondary: {
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    secondaryPressed: {
      ...basePressed,
      backgroundColor: theme.colors.primarySoft,
    },
    ghost: {
      borderColor: 'transparent',
      backgroundColor: 'transparent',
    },
    ghostPressed: {
      ...basePressed,
      backgroundColor: theme.colors.surfaceSoft,
    },
    destructive: {
      borderColor: theme.colors.danger,
      backgroundColor: theme.colors.danger,
    },
    destructivePressed: {
      ...basePressed,
      borderColor: theme.colors.danger,
      backgroundColor: theme.colors.dangerAccent,
    },
    disabled: {
      borderColor: theme.colors.divider,
      backgroundColor: theme.colors.surfaceMuted,
      opacity: 0.8,
    },
  });
}
