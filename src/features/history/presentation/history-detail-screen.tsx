import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { DeleteReminderHistory, GetReminderHistoryDetails } from '@/application/history';
import { AppModal, Badge, Button, Card, Screen, StateView, useToast } from '@/components';
import { routes } from '@/config/routes';
import { type AppTheme, useTheme } from '@/core/theme';
import type { ReminderHistory } from '@/domain/models/reminder';
import { ReminderHistoryRequestError } from '@/domain/repositories/reminder-history-repository';

interface HistoryDetailScreenProps {
  readonly deleteReminderHistory: DeleteReminderHistory;
  readonly getReminderHistoryDetails: GetReminderHistoryDetails;
  readonly historyId: string;
}

type DetailState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly entry: ReminderHistory }
  | { readonly status: 'error'; readonly message: string };

export function HistoryDetailScreen({
  deleteReminderHistory,
  getReminderHistoryDetails,
  historyId,
}: HistoryDetailScreenProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [requestKey, setRequestKey] = useState(0);
  const [state, setState] = useState<DetailState>({ status: 'loading' });
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    getReminderHistoryDetails.execute(historyId, controller.signal).then(
      (entry) => {
        if (!controller.signal.aborted) setState({ status: 'ready', entry });
      },
      (error: unknown) => {
        if (
          !controller.signal.aborted &&
          !(error instanceof Error && error.name === 'AbortError')
        ) {
          setState({
            status: 'error',
            message:
              error instanceof ReminderHistoryRequestError
                ? error.message
                : 'Geçmiş kaydı alınamadı.',
          });
        }
      },
    );
    return () => controller.abort();
  }, [getReminderHistoryDetails, historyId, requestKey]);

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(undefined);
    try {
      await deleteReminderHistory.execute(historyId);
      setDeleteVisible(false);
      showToast('Geçmiş kaydı silindi.', { variant: 'success' });
      router.replace(routes.history);
    } catch (error) {
      setDeleteError(
        error instanceof ReminderHistoryRequestError ? error.message : 'Geçmiş kaydı silinemedi.',
      );
    } finally {
      setDeleting(false);
    }
  }

  if (state.status === 'loading') {
    return (
      <Screen title="Geçmiş kaydı">
        <StateView variant="loading" />
      </Screen>
    );
  }

  if (state.status === 'error') {
    return (
      <Screen title="Geçmiş kaydı">
        <StateView
          actionLabel="Tekrar dene"
          description={state.message}
          onAction={() => {
            setState({ status: 'loading' });
            setRequestKey((current) => current + 1);
          }}
          title="Kayıt açılamadı"
          variant="error"
        />
      </Screen>
    );
  }

  const { entry } = state;

  return (
    <Screen description={formatDate(entry.sentAt)} title={formatType(entry.type)}>
      <View style={styles.content}>
        <Card variant="outlined">
          <View style={styles.badges}>
            <Badge label={formatStatus(entry.status)} variant={statusVariant(entry.status)} />
            <Badge label={`Deneme ${entry.attempt}`} variant="neutral" />
          </View>
          <InfoRow label="Gönderim zamanı" value={formatDate(entry.sentAt)} />
          <InfoRow label="Sağlayıcı" value={entry.provider || 'Belirtilmemiş'} />
          {entry.userMessage ? <InfoRow label="Sonuç" value={entry.userMessage} /> : null}
        </Card>

        <Card title="İşlemler" variant="soft">
          <View style={styles.actions}>
            <Button
              fullWidth
              label="Hatırlatıcıyı aç"
              onPress={() => router.push(routes.reminderDetails(entry.reminderId))}
              variant="secondary"
            />
            <Button
              fullWidth
              label="Geçmiş kaydını sil"
              onPress={() => {
                setDeleteError(undefined);
                setDeleteVisible(true);
              }}
              variant="destructive"
            />
          </View>
        </Card>
      </View>

      <AppModal
        onClose={() => !deleting && setDeleteVisible(false)}
        title="Geçmiş kaydını sil"
        visible={deleteVisible}
      >
        <Text style={styles.modalDescription}>
          Bu gönderim kaydı geçmiş listesinden kalıcı olarak silinecek.
        </Text>
        {deleteError ? <Badge label={deleteError} variant="danger" /> : null}
        <View style={styles.modalActions}>
          <Button
            disabled={deleting}
            fullWidth
            label="Vazgeç"
            onPress={() => setDeleteVisible(false)}
            variant="secondary"
          />
          <Button
            fullWidth
            label="Evet, sil"
            loading={deleting}
            onPress={() => void handleDelete()}
            variant="destructive"
          />
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

function formatType(type: ReminderHistory['type']): string {
  return type === 'push' ? 'Push bildirimi' : 'Sesli arama';
}

function formatStatus(status: ReminderHistory['status']): string {
  if (status === 'success' || status === 'delivered' || status === 'answered') return 'Başarılı';
  if (status === 'failed' || status === 'missed') return 'Başarısız';
  if (status === 'sent') return 'Gönderildi';
  return 'Bekliyor';
}

function statusVariant(status: ReminderHistory['status']) {
  if (status === 'success' || status === 'delivered' || status === 'answered') {
    return 'success' as const;
  }
  if (status === 'failed' || status === 'missed') return 'danger' as const;
  return 'warning' as const;
}

function formatDate(value?: string): string {
  if (!value) return 'Henüz gönderilmedi';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Tarih bilgisi bulunamadı';
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date);
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    content: {
      gap: theme.spacing.lg,
    },
    badges: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    actions: {
      gap: theme.spacing.sm,
    },
    infoRow: {
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    infoLabel: {
      color: theme.colors.textMuted,
      ...theme.typography.caption,
    },
    infoValue: {
      color: theme.colors.textPrimary,
      ...theme.typography.body,
    },
    modalDescription: {
      color: theme.colors.textSecondary,
      ...theme.typography.body,
      marginBottom: theme.spacing.lg,
    },
    modalActions: {
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
    },
  });
}
