import { useMemo, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppIcon, Badge, Card } from '@/components';
import { type AppTheme, useTheme } from '@/core/theme';

interface AuthScreenCardProps extends PropsWithChildren {
  readonly badgeLabel?: string;
}

export function AuthScreenCard({ badgeLabel, children }: AuthScreenCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Card style={styles.card}>
      <View accessibilityElementsHidden style={styles.brandMark}>
        <AppIcon color={theme.colors.textOnPrimary} name="sparkles" size={theme.sizes.icon.xl} />
      </View>
      {badgeLabel ? <Badge label={badgeLabel} variant="accent" /> : null}
      <View style={styles.content}>{children}</View>
    </Card>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    card: {
      width: '100%',
      maxWidth: theme.sizes.contentMaxWidth,
      alignSelf: 'center',
    },
    brandMark: {
      width: 64,
      height: 64,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.lg,
      borderRadius: theme.radii.xl,
      backgroundColor: theme.colors.primary,
    },
    content: {
      gap: theme.spacing.lg,
      marginTop: theme.spacing.xl,
    },
  });
}
