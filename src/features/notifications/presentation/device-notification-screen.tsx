import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Card, Screen, StateView } from '@/components';
import { type AppTheme, useTheme } from '@/core/theme';

import { usePushNotifications } from './push-notification-provider';

export function DeviceNotificationScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {
    error,
    loading,
    openSystemSettings,
    permission,
    requestPermission,
    synchronize,
    tokenRegistered,
  } = usePushNotifications();
  const status = getStatus(permission, tokenRegistered);

  return (
    <Screen
      description="Bu cihazın bildirim iznini ve VOIA bağlantısını yönet."
      title="Cihaz ve bildirimler"
    >
      <Card title="Push bildirimleri" variant="elevated">
        <View style={styles.statusRow}>
          <Badge label={status.label} variant={status.variant} />
        </View>
        <Text style={styles.description}>{status.description}</Text>
        <View style={styles.actions}>
          {permission === 'granted' ? (
            <Button
              fullWidth
              label="Bağlantıyı yenile"
              loading={loading}
              onPress={() => void synchronize()}
              variant="secondary"
            />
          ) : (
            <Button
              fullWidth
              label="Bildirimlere izin ver"
              loading={loading}
              onPress={() => void requestPermission()}
            />
          )}
          {permission === 'denied' ? (
            <Button
              fullWidth
              label="Cihaz ayarlarını aç"
              onPress={() => void openSystemSettings()}
              variant="ghost"
            />
          ) : null}
        </View>
      </Card>

      {error ? (
        <View style={styles.errorSection}>
          <StateView
            actionLabel="Yeniden dene"
            description="İnternet bağlantını kontrol edip tekrar deneyebilirsin."
            onAction={() => void synchronize()}
            title={error.message}
            variant="error"
          />
        </View>
      ) : null}

      <Card
        description="Bildirim anahtarı cihazda Firebase tarafından üretilir ve güvenli şekilde hesabındaki cihaz kaydıyla eşleştirilir. Anahtarın kendisi ekranda gösterilmez."
        style={styles.infoCard}
        title="Bu cihaz"
        variant="soft"
      />
    </Screen>
  );
}

function getStatus(permission: string, tokenRegistered: boolean) {
  if (permission === 'granted' && tokenRegistered) {
    return {
      description: 'Bu cihaz push bildirimlerini almaya hazır.',
      label: 'Bağlı',
      variant: 'success' as const,
    };
  }
  if (permission === 'granted') {
    return {
      description: 'İzin verildi ancak cihaz anahtarı henüz backend ile eşleştirilemedi.',
      label: 'Bağlantı bekleniyor',
      variant: 'warning' as const,
    };
  }
  if (permission === 'denied') {
    return {
      description: 'Bildirim izni kapalı. İzin vermeden bu cihaza push gönderilemez.',
      label: 'İzin kapalı',
      variant: 'danger' as const,
    };
  }
  return {
    description: 'Bildirim almak için önce cihaz izni verilmelidir.',
    label: 'İzin bekleniyor',
    variant: 'neutral' as const,
  };
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    statusRow: {
      flexDirection: 'row',
      marginTop: theme.spacing.md,
    },
    description: {
      color: theme.colors.textSecondary,
      ...theme.typography.bodySmall,
      marginTop: theme.spacing.md,
    },
    actions: {
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xl,
    },
    errorSection: {
      marginTop: theme.spacing.lg,
    },
    infoCard: {
      marginTop: theme.spacing.lg,
    },
  });
}
