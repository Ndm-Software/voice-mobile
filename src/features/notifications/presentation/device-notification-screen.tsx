import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { DeviceSessionManager } from '@/application/session';
import { AppIcon, Badge, Button, Card, Screen, StateView } from '@/components';
import { type AppTheme, useTheme } from '@/core/theme';
import type { AccountDevice } from '@/domain/models/account';

import { usePushNotifications } from './push-notification-provider';

interface DeviceNotificationScreenProps {
  readonly deviceSessionManager: DeviceSessionManager;
}

type DeviceListState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly devices: readonly AccountDevice[] }
  | { readonly status: 'error' };

export function DeviceNotificationScreen({ deviceSessionManager }: DeviceNotificationScreenProps) {
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
  const [requestKey, setRequestKey] = useState(0);
  const [deviceState, setDeviceState] = useState<DeviceListState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    deviceSessionManager.listDevices(controller.signal).then(
      (devices) => {
        if (!controller.signal.aborted) setDeviceState({ status: 'ready', devices });
      },
      (listError: unknown) => {
        if (
          !controller.signal.aborted &&
          !(listError instanceof Error && listError.name === 'AbortError')
        ) {
          setDeviceState({ status: 'error' });
        }
      },
    );
    return () => controller.abort();
  }, [deviceSessionManager, requestKey]);

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

      <Card
        description="Hesabınla daha önce oturum açılan cihazlar. Aktif kayıtlar önce gösterilir."
        style={styles.deviceListCard}
        title="Bağlı cihazlar"
        variant="outlined"
      >
        {deviceState.status === 'loading' ? <StateView variant="loading" /> : null}
        {deviceState.status === 'error' ? (
          <StateView
            actionLabel="Tekrar dene"
            description="Cihaz listesi şu anda alınamadı."
            onAction={() => {
              setDeviceState({ status: 'loading' });
              setRequestKey((current) => current + 1);
            }}
            title="Cihazlar yüklenemedi"
            variant="error"
          />
        ) : null}
        {deviceState.status === 'ready' && deviceState.devices.length === 0 ? (
          <StateView
            description="Bu hesaba bağlı bir cihaz kaydı bulunmuyor."
            title="Cihaz bulunamadı"
            variant="empty"
          />
        ) : null}
        {deviceState.status === 'ready' && deviceState.devices.length > 0 ? (
          <View style={styles.deviceList}>
            {deviceState.devices.map((device) => (
              <View key={device.id} style={styles.deviceRow}>
                <View style={styles.deviceIcon}>
                  <AppIcon color={theme.colors.primary} name="device" />
                </View>
                <View style={styles.deviceCopy}>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <Text style={styles.deviceMeta}>
                    {formatPlatform(device.platform)} · Son etkinlik{' '}
                    {formatDate(device.lastActiveAt)}
                  </Text>
                </View>
                <Badge
                  label={device.active ? 'Aktif' : 'Kapalı'}
                  variant={device.active ? 'success' : 'neutral'}
                />
              </View>
            ))}
            <Button
              fullWidth
              label="Listeyi yenile"
              onPress={() => {
                setDeviceState({ status: 'loading' });
                setRequestKey((current) => current + 1);
              }}
              variant="ghost"
            />
          </View>
        ) : null}
      </Card>
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
    deviceListCard: {
      marginTop: theme.spacing.lg,
    },
    deviceList: {
      gap: theme.spacing.md,
    },
    deviceRow: {
      minHeight: theme.sizes.touchTarget,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    deviceIcon: {
      width: theme.sizes.touchTarget,
      height: theme.sizes.touchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.primarySoft,
    },
    deviceCopy: {
      flex: 1,
    },
    deviceName: {
      color: theme.colors.textPrimary,
      ...theme.typography.cardTitle,
    },
    deviceMeta: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
      marginTop: theme.spacing.xs,
    },
  });
}

function formatPlatform(platform: AccountDevice['platform']): string {
  if (platform === 'android') return 'Android';
  if (platform === 'ios') return 'iOS';
  if (platform === 'web') return 'Web';
  if (platform === 'windows') return 'Windows';
  return 'Bilinmeyen platform';
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'bilinmiyor';
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
