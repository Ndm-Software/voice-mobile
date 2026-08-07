import { useMemo, type PropsWithChildren, type ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { type AppTheme, useTheme } from '@/core/theme';

type CardVariant = 'elevated' | 'outlined' | 'soft';

interface CardProps extends PropsWithChildren, ViewProps {
  readonly description?: string;
  readonly footer?: ReactNode;
  readonly title?: string;
  readonly variant?: CardVariant;
}

export function Card({
  children,
  description,
  footer,
  style,
  title,
  variant = 'elevated',
  ...viewProps
}: CardProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.base, styles[variant], style]} {...viewProps}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {children ? (
        <View style={title || description ? styles.content : undefined}>{children}</View>
      ) : null}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    base: {
      padding: theme.spacing.lg,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
    },
    elevated: {
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      ...theme.shadows.card,
    },
    outlined: {
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    soft: {
      borderColor: theme.colors.primarySoft,
      backgroundColor: theme.colors.primarySoft,
    },
    title: {
      color: theme.colors.textPrimary,
      ...theme.typography.cardTitle,
    },
    description: {
      color: theme.colors.textSecondary,
      ...theme.typography.bodySmall,
      marginTop: theme.spacing.xs,
    },
    content: {
      marginTop: theme.spacing.lg,
    },
    footer: {
      marginTop: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.divider,
    },
  });
}
