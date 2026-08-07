import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { type AppTheme, useTheme } from '@/core/theme';

import { AppIcon, type AppIconName } from './app-icon';
import { Button } from './button';

export type StateViewVariant = 'loading' | 'empty' | 'error' | 'offline';

interface StateViewProps {
  readonly actionLabel?: string;
  readonly description?: string;
  readonly onAction?: () => void;
  readonly title?: string;
  readonly variant: StateViewVariant;
}

const defaults: Record<
  StateViewVariant,
  { readonly description: string; readonly icon: AppIconName; readonly title: string }
> = {
  loading: { title: 'Yükleniyor', description: 'Bilgiler hazırlanıyor.', icon: 'refresh' },
  empty: {
    title: 'Henüz kayıt yok',
    description: 'İlk kaydını oluşturarak başlayabilirsin.',
    icon: 'empty',
  },
  error: { title: 'Bir sorun oluştu', description: 'Lütfen yeniden deneyin.', icon: 'warning' },
  offline: {
    title: 'Bağlantı yok',
    description: 'İnternet bağlantını kontrol et.',
    icon: 'offline',
  },
};

export function StateView({
  actionLabel = 'Yeniden dene',
  description,
  onAction,
  title,
  variant,
}: StateViewProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const copy = defaults[variant];

  return (
    <View accessibilityLiveRegion="polite" style={styles.container}>
      <View style={styles.iconContainer}>
        {variant === 'loading' ? (
          <ActivityIndicator color={theme.colors.accentStrong} />
        ) : (
          <AppIcon color={theme.colors.primary} name={copy.icon} size={theme.sizes.icon.lg} />
        )}
      </View>
      <Text style={styles.title}>{title ?? copy.title}</Text>
      <Text style={styles.description}>{description ?? copy.description}</Text>
      {onAction && variant !== 'loading' ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      padding: theme.spacing['2xl'],
    },
    iconContainer: {
      width: theme.sizes.touchTarget,
      height: theme.sizes.touchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radii.full,
      backgroundColor: theme.colors.primarySoft,
    },
    title: {
      color: theme.colors.textPrimary,
      ...theme.typography.cardTitle,
      marginTop: theme.spacing.md,
      textAlign: 'center',
    },
    description: {
      color: theme.colors.textSecondary,
      ...theme.typography.bodySmall,
      marginTop: theme.spacing.xs,
      textAlign: 'center',
    },
    action: {
      marginTop: theme.spacing.lg,
    },
  });
}
