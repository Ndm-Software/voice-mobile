import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppIcon, Badge, Card, Screen, StateView, type AppIconName } from '@/components';
import { type AppTheme, useTheme } from '@/core/theme';

interface FeatureShellScreenProps {
  readonly description: string;
  readonly icon: AppIconName;
  readonly title: string;
  readonly variant?: 'default' | 'create' | 'empty';
}

export function FeatureShellScreen({
  description,
  icon,
  title,
  variant = 'default',
}: FeatureShellScreenProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Screen description={description} title={title}>
      <Card variant="elevated">
        <View style={styles.heroIcon}>
          <AppIcon color={theme.colors.primary} name={icon} size={theme.sizes.icon.xl} />
        </View>
        <View style={styles.badgeRow}>
          <Badge label={variant === 'empty' ? 'Henüz kayıt yok' : 'Çok yakında'} variant="accent" />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </Card>

      <View style={styles.section}>
        {variant === 'create' ? (
          <StateView
            description="Hatırlatıcı oluşturma özelliği çok yakında burada olacak."
            title="İlk hatırlatıcını oluştur"
            variant="empty"
          />
        ) : (
          <StateView
            description={
              variant === 'empty'
                ? 'Gönderilen bildirimler ve sesli aramalar burada görünecek.'
                : 'Bu alan kullanıma açıldığında bilgilerini buradan yönetebileceksin.'
            }
            title={variant === 'empty' ? 'Henüz içerik yok' : 'Çok yakında'}
            variant="empty"
          />
        )}
      </View>
    </Screen>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    heroIcon: {
      width: 56,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radii.lg,
      backgroundColor: theme.colors.primarySoft,
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
    },
    cardTitle: {
      color: theme.colors.textPrimary,
      ...theme.typography.sectionTitle,
      marginTop: theme.spacing.lg,
    },
    cardDescription: {
      color: theme.colors.textSecondary,
      ...theme.typography.bodySmall,
      marginTop: theme.spacing.sm,
    },
    section: {
      marginTop: theme.spacing.lg,
    },
  });
}
