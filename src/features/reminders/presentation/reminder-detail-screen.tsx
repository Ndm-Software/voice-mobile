import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type {
  ChangeReminderStatus,
  DeleteReminder,
  GetReminderDetails,
} from '@/application/reminder';
import { AppModal, Badge, Button, Card, Screen, StateView, useToast } from '@/components';
import { routes } from '@/config/routes';
import { type AppTheme, useTheme } from '@/core/theme';
import type { Reminder } from '@/domain/models/reminder';
import { ReminderRequestError } from '@/domain/repositories/reminder-repository';

interface ReminderDetailScreenProps {
  readonly changeReminderStatus: ChangeReminderStatus;
  readonly deleteReminder: DeleteReminder;
  readonly getReminderDetails: GetReminderDetails;
  readonly reminderId: string;
  readonly userId: string;
}

type DetailState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly reminder: Reminder }
  | { readonly status: 'error'; readonly message: string };

type Confirmation = 'delete' | 'status' | null;

export function ReminderDetailScreen({
  changeReminderStatus,
  deleteReminder,
  getReminderDetails,
  reminderId,
  userId,
}: ReminderDetailScreenProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [requestKey, setRequestKey] = useState(0);
  const [state, setState] = useState<DetailState>({ status: 'loading' });
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    getReminderDetails.execute(userId, reminderId, controller.signal).then(
      (reminder) => {
        if (!controller.signal.aborted) setState({ status: 'ready', reminder });
      },
      (error: unknown) => {
        if (
          !controller.signal.aborted &&
          !(error instanceof Error && error.name === 'AbortError')
        ) {
          setState({
            status: 'error',
            message:
              error instanceof ReminderRequestError
                ? error.message
                : 'Hatırlatıcı ayrıntıları alınamadı.',
          });
        }
      },
    );
    return () => controller.abort();
  }, [getReminderDetails, reminderId, requestKey, userId]);

  async function handleDelete() {
    if (actionLoading) return;
    setActionLoading(true);
    setActionError(undefined);
    try {
      await deleteReminder.execute(userId, reminderId);
      setConfirmation(null);
      showToast('Hatırlatıcı silindi.', { variant: 'success' });
      router.replace(routes.home);
    } catch (error) {
      setActionError(getActionError(error, 'Hatırlatıcı silinemedi.'));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStatusChange(reminder: Reminder) {
    if (actionLoading) return;
    const nextStatus = reminder.status === 'active' ? 'completed' : 'active';
    setActionLoading(true);
    setActionError(undefined);
    try {
      const updated = await changeReminderStatus.execute({
        id: reminder.id,
        userId,
        status: nextStatus,
      });
      setState({ status: 'ready', reminder: updated });
      setConfirmation(null);
      showToast(
        nextStatus === 'completed' ? 'Hatırlatıcı tamamlandı.' : 'Hatırlatıcı yeniden açıldı.',
        { variant: 'success' },
      );
    } catch (error) {
      setActionError(getActionError(error, 'Durum değiştirilemedi.'));
    } finally {
      setActionLoading(false);
    }
  }

  if (state.status === 'loading') {
    return (
      <Screen title="Hatırlatıcı ayrıntısı">
        <StateView variant="loading" />
      </Screen>
    );
  }

  if (state.status === 'error') {
    return (
      <Screen title="Hatırlatıcı ayrıntısı">
        <StateView
          actionLabel="Tekrar dene"
          description={state.message}
          onAction={() => {
            setState({ status: 'loading' });
            setRequestKey((current) => current + 1);
          }}
          title="Hatırlatıcı açılamadı"
          variant="error"
        />
      </Screen>
    );
  }

  const { reminder } = state;
  const completing = reminder.status === 'active';

  return (
    <Screen description={formatDateTime(reminder.eventDateTime)} title={reminder.title}>
      <View style={styles.content}>
        {actionError ? <Badge label={actionError} variant="danger" /> : null}
        <Card variant="outlined">
          <View style={styles.badges}>
            <Badge label={formatStatus(reminder.status)} variant={getStatusVariant(reminder)} />
            {reminder.urgent ? <Badge label="Önemli" variant="warning" /> : null}
            {reminder.repeatType !== 'none' ? <Badge label="Tekrarlı" variant="neutral" /> : null}
          </View>
          <InfoRow label="Açıklama" value={reminder.description || 'Açıklama eklenmemiş.'} />
          <InfoRow label="Tarih ve saat" value={formatDateTime(reminder.eventDateTime)} />
          <InfoRow label="Tekrar" value={formatRepeatType(reminder.repeatType)} />
        </Card>

        <Card title="Bildirimler" variant="soft">
          <InfoRow label="Push" value={formatPushSettings(reminder)} />
          <InfoRow label="Sesli arama" value={formatVoiceSetting(reminder)} />
        </Card>

        <Card title="İşlemler" variant="outlined">
          <View style={styles.actions}>
            <Button
              fullWidth
              label="Düzenle"
              onPress={() => router.push(routes.reminderEdit(reminder.id))}
              variant="secondary"
            />
            <Button
              fullWidth
              label={completing ? 'Tamamlandı olarak işaretle' : 'Yeniden aç'}
              onPress={() => {
                setActionError(undefined);
                setConfirmation('status');
              }}
            />
            <Button
              fullWidth
              label="Hatırlatıcıyı sil"
              onPress={() => {
                setActionError(undefined);
                setConfirmation('delete');
              }}
              variant="destructive"
            />
          </View>
        </Card>
      </View>

      <AppModal
        onClose={() => !actionLoading && setConfirmation(null)}
        title={
          confirmation === 'delete'
            ? 'Hatırlatıcıyı sil'
            : completing
              ? 'Tamamlandı mı?'
              : 'Yeniden açılsın mı?'
        }
        visible={confirmation !== null}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalDescription}>
            {confirmation === 'delete'
              ? 'Bu işlem geri alınamaz. Hatırlatıcı ve ona bağlı bildirim ayarları silinecek.'
              : completing
                ? 'Hatırlatıcı aktif listeden geçmiş listesine taşınacak.'
                : 'Hatırlatıcı yeniden aktif listeye taşınacak.'}
          </Text>
          {actionError ? <Badge label={actionError} variant="danger" /> : null}
          <View style={styles.modalActions}>
            <Button
              disabled={actionLoading}
              fullWidth
              label="Vazgeç"
              onPress={() => setConfirmation(null)}
              variant="secondary"
            />
            <Button
              fullWidth
              label={confirmation === 'delete' ? 'Evet, sil' : 'Onayla'}
              loading={actionLoading}
              onPress={() =>
                confirmation === 'delete' ? void handleDelete() : void handleStatusChange(reminder)
              }
              variant={confirmation === 'delete' ? 'destructive' : 'primary'}
            />
          </View>
        </View>
      </AppModal>
    </Screen>
  );
}

function InfoRow({ label, value }: { readonly label: string; readonly value: string }) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function getActionError(error: unknown, fallback: string): string {
  return error instanceof ReminderRequestError ? error.message : fallback;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Tarih bilgisi bulunamadı';
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date);
}

function formatStatus(status: Reminder['status']): string {
  if (status === 'active') return 'Aktif';
  if (status === 'completed') return 'Tamamlandı';
  if (status === 'past') return 'Geçmiş';
  return 'İptal edildi';
}

function getStatusVariant(reminder: Reminder): 'accent' | 'neutral' {
  return reminder.status === 'active' ? 'accent' : 'neutral';
}

function formatRepeatType(repeatType: Reminder['repeatType']): string {
  const labels: Record<Reminder['repeatType'], string> = {
    none: 'Tekrarlanmaz',
    daily: 'Her gün',
    weekly: 'Her hafta',
    monthly: 'Her ay',
    yearly: 'Her yıl',
    custom: 'Özel tekrar',
  };
  return labels[repeatType];
}

function formatPushSettings(reminder: Reminder): string {
  const minutes = reminder.pushSettings
    .filter((setting) => setting.enabled)
    .map((setting) => formatMinutes(setting.minutesBefore));
  return minutes.length > 0 ? minutes.join(', ') : 'Kapalı';
}

function formatVoiceSetting(reminder: Reminder): string {
  const setting = reminder.voiceCallSetting;
  return setting?.enabled ? `${formatMinutes(setting.minutesBefore)} önce` : 'Kapalı';
}

function formatMinutes(minutes: number): string {
  if (minutes % 1440 === 0) return `${minutes / 1440} gün önce`;
  if (minutes % 60 === 0) return `${minutes / 60} saat önce`;
  return `${minutes} dk önce`;
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg },
    badges: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    infoRow: {
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    infoLabel: { color: theme.colors.textMuted, ...theme.typography.caption },
    infoValue: { color: theme.colors.textPrimary, ...theme.typography.body },
    actions: { gap: theme.spacing.md },
    modalContent: { gap: theme.spacing.lg },
    modalDescription: { color: theme.colors.textSecondary, ...theme.typography.bodySmall },
    modalActions: { gap: theme.spacing.sm },
  });
}
