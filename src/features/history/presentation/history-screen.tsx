import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { GetReminderHistory } from '@/application/history';
import { AppIcon, Badge, Button, Card, Chip, Screen, StateView } from '@/components';
import { routes } from '@/config/routes';
import { type AppTheme, useTheme } from '@/core/theme';
import type { ReminderHistory, ReminderHistoryType } from '@/domain/models/reminder';

type HistoryFilter = 'all' | ReminderHistoryType;
type HistoryState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly entries: readonly ReminderHistory[] }
  | { readonly status: 'error' };

interface HistoryScreenProps {
  readonly getReminderHistory: GetReminderHistory;
}

const filters: readonly { readonly label: string; readonly value: HistoryFilter }[] = [
  { label: 'Tümü', value: 'all' },
  { label: 'Push', value: 'push' },
  { label: 'Sesli arama', value: 'voice-call' },
];

export function HistoryScreen({ getReminderHistory }: HistoryScreenProps) {
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [requestKey, setRequestKey] = useState(0);
  const [state, setState] = useState<HistoryState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    getReminderHistory.execute(undefined, controller.signal).then(
      (entries) => {
        if (!controller.signal.aborted) setState({ status: 'ready', entries });
      },
      (error: unknown) => {
        if (
          !controller.signal.aborted &&
          !(error instanceof Error && error.name === 'AbortError')
        ) {
          setState({ status: 'error' });
        }
      },
    );
    return () => controller.abort();
  }, [getReminderHistory, requestKey]);

  const visibleEntries =
    state.status === 'ready'
      ? state.entries.filter((entry) => filter === 'all' || entry.type === filter)
      : [];

  function reload() {
    setState({ status: 'loading' });
    setRequestKey((current) => current + 1);
  }

  return (
    <Screen
      description="Gönderilen push bildirimlerini ve sesli arama kayıtlarını görüntüle."
      title="Geçmiş"
    >
      <View style={styles.filters}>
        {filters.map((item) => (
          <Chip
            key={item.value}
            label={item.label}
            onPress={() => setFilter(item.value)}
            selected={filter === item.value}
          />
        ))}
      </View>

      {state.status === 'loading' ? <StateView variant="loading" /> : null}
      {state.status === 'error' ? (
        <StateView
          actionLabel="Tekrar dene"
          description="Geçmiş kayıtları şu anda alınamadı."
          onAction={reload}
          title="Geçmiş yüklenemedi"
          variant="error"
        />
      ) : null}
      {state.status === 'ready' && visibleEntries.length === 0 ? (
        <StateView
          description={
            filter === 'all'
              ? 'Henüz bir gönderim kaydı bulunmuyor.'
              : 'Bu filtreye ait bir gönderim kaydı bulunmuyor.'
          }
          title="Kayıt bulunamadı"
          variant="empty"
        />
      ) : null}
      {state.status === 'ready' && visibleEntries.length > 0 ? (
        <View style={styles.list}>
          {visibleEntries.map((entry) => (
            <Pressable
              accessibilityRole="button"
              key={entry.id}
              onPress={() => router.push(routes.historyDetails(entry.id))}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Card variant="outlined">
                <View style={styles.entryHeader}>
                  <View style={styles.iconContainer}>
                    <AppIcon
                      color={theme.colors.primary}
                      name={entry.type === 'push' ? 'bell' : 'clock'}
                    />
                  </View>
                  <View style={styles.entryCopy}>
                    <Text style={styles.entryTitle}>{formatType(entry.type)}</Text>
                    <Text style={styles.entryDate}>{formatDate(entry.sentAt)}</Text>
                  </View>
                  <Badge
                    label={formatStatus(entry.status)}
                    variant={getStatusVariant(entry.status)}
                  />
                </View>
                <View style={styles.entryFooter}>
                  <Text style={styles.entryMeta}>Deneme {entry.attempt}</Text>
                  <AppIcon name="chevron-right" size={theme.sizes.icon.sm} />
                </View>
              </Card>
            </Pressable>
          ))}
          <Button fullWidth label="Listeyi yenile" onPress={reload} variant="ghost" />
        </View>
      ) : null}
    </Screen>
  );
}

export function formatType(type: ReminderHistoryType): string {
  return type === 'push' ? 'Push bildirimi' : 'Sesli arama';
}

export function formatStatus(status: ReminderHistory['status']): string {
  if (status === 'success' || status === 'delivered' || status === 'answered') return 'Başarılı';
  if (status === 'failed' || status === 'missed') return 'Başarısız';
  if (status === 'sent') return 'Gönderildi';
  return 'Bekliyor';
}

function getStatusVariant(status: ReminderHistory['status']) {
  if (status === 'success' || status === 'delivered' || status === 'answered') {
    return 'success' as const;
  }
  if (status === 'failed' || status === 'missed') return 'danger' as const;
  return 'warning' as const;
}

export function formatDate(value?: string): string {
  if (!value) return 'Henüz gönderilmedi';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Tarih bilgisi bulunamadı';
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    filters: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.xl,
    },
    list: {
      gap: theme.spacing.md,
    },
    pressed: {
      opacity: 0.82,
    },
    entryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    iconContainer: {
      width: theme.sizes.touchTarget,
      height: theme.sizes.touchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.primarySoft,
    },
    entryCopy: {
      flex: 1,
    },
    entryTitle: {
      color: theme.colors.textPrimary,
      ...theme.typography.cardTitle,
    },
    entryDate: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
      marginTop: theme.spacing.xs,
    },
    entryFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.divider,
    },
    entryMeta: {
      color: theme.colors.textMuted,
      ...theme.typography.caption,
    },
  });
}
