import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { GetReminderHistory } from '@/application/history';
import { Badge, Button, Chip, Screen, StateView } from '@/components';
import { routes } from '@/config/routes';
import { type AppTheme, useTheme } from '@/core/theme';
import type {
  ReminderHistory,
  ReminderHistoryType,
} from '@/domain/models/reminder';

type HistoryFilter = 'all' | ReminderHistoryType;

type HistoryState =
  | { readonly status: 'loading' }
  | {
      readonly status: 'ready';
      readonly entries: readonly ReminderHistory[];
    }
  | { readonly status: 'error' };

interface HistoryScreenProps {
  readonly getReminderHistory: GetReminderHistory;
}

const filters: readonly {
  readonly label: string;
  readonly value: HistoryFilter;
}[] = [
  { label: 'Tümü', value: 'all' },
  { label: 'Push', value: 'push' },
  { label: 'Sesli arama', value: 'voice-call' },
];

export function HistoryScreen({
  getReminderHistory,
}: HistoryScreenProps) {
  const router = useRouter();
  const theme = useTheme();

  const styles = useMemo(
    () => createStyles(theme),
    [theme],
  );

  const [filter, setFilter] =
    useState<HistoryFilter>('all');

  const [state, setState] =
    useState<HistoryState>({
      status: 'loading',
    });

  const loadHistory = useCallback(
    (signal?: AbortSignal) => {
      setState({ status: 'loading' });

      getReminderHistory.execute(undefined, signal).then(
        (entries) => {
          if (!signal?.aborted) {
            setState({
              status: 'ready',
              entries,
            });
          }
        },
        (error: unknown) => {
          if (
            !signal?.aborted &&
            !(
              error instanceof Error &&
              error.name === 'AbortError'
            )
          ) {
            setState({
              status: 'error',
            });
          }
        },
      );
    },
    [getReminderHistory],
  );

  useFocusEffect(
    useCallback(() => {
      const controller =
        new AbortController();

      loadHistory(controller.signal);

      return () =>
        controller.abort();
    }, [loadHistory]),
  );

  const visibleEntries =
    state.status === 'ready'
      ? state.entries.filter(
          (entry) =>
            filter === 'all' ||
            entry.type === filter,
        )
      : [];

  function reload() {
    loadHistory();
  }

  return (
    <Screen
      description="Gönderilen bildirimleri ve sesli arama kayıtlarını takip et."
      title="Geçmiş"
    >
      <View style={styles.filters}>
        {filters.map((item) => (
          <Chip
            key={item.value}
            label={item.label}
            onPress={() =>
              setFilter(item.value)
            }
            selected={
              filter === item.value
            }
          />
        ))}
      </View>

      {state.status === 'loading' ? (
        <StateView variant="loading" />
      ) : null}

      {state.status === 'error' ? (
        <StateView
          actionLabel="Tekrar dene"
          description="Geçmiş kayıtları şu anda alınamadı."
          onAction={reload}
          title="Geçmiş yüklenemedi"
          variant="error"
        />
      ) : null}

      {state.status === 'ready' &&
      visibleEntries.length === 0 ? (
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

      {state.status === 'ready' &&
      visibleEntries.length > 0 ? (
        <View style={styles.list}>
          {visibleEntries.map(
            (entry) => (
              <Pressable
                accessibilityRole="button"
                key={entry.id}
                onPress={() =>
                  router.push(
                    routes.historyDetails(
                      entry.id,
                    ),
                  )
                }
                style={({ pressed }) => [
                  styles.historyCard,
                  pressed &&
                    styles.historyCardPressed,
                ]}
              >
                <View
                  style={
                    styles.historyAccent
                  }
                />

                <View
                  style={
                    styles.historyContent
                  }
                >
                  <View
                    style={
                      styles.historyTopRow
                    }
                  >
                    <View
                      style={
                        styles.iconContainer
                      }
                    >
                      <Ionicons
                        name={
                          entry.type === 'push'
                            ? 'notifications-outline'
                            : 'call-outline'
                        }
                        size={20}
                        color={
                          theme.colors.primary
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.historyTitleArea
                      }
                    >
                      <Text
                        style={
                          styles.entryTitle
                        }
                      >
                        {formatType(
                          entry.type,
                        )}
                      </Text>

                      <Text
                        style={
                          styles.entryDate
                        }
                      >
                        {formatDate(
                          entry.sentAt,
                        )}
                      </Text>
                    </View>

                    <Badge
                      label={formatStatus(
                        entry.status,
                      )}
                      variant={getStatusVariant(
                        entry.status,
                      )}
                    />
                  </View>

                  <View
                    style={
                      styles.entryFooter
                    }
                  >
                    <Text
                      style={
                        styles.entryMeta
                      }
                    >
                      Deneme {entry.attempt}
                    </Text>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={
                        theme.colors.textMuted
                      }
                    />
                  </View>
                </View>
              </Pressable>
            ),
          )}

          <Button
            fullWidth
            label="Listeyi yenile"
            onPress={reload}
            variant="ghost"
          />
        </View>
      ) : null}
    </Screen>
  );
}

export function formatType(
  type: ReminderHistoryType,
): string {
  return type === 'push'
    ? 'Push bildirimi'
    : 'Sesli arama';
}

export function formatStatus(
  status: ReminderHistory['status'],
): string {
  if (
    status === 'success' ||
    status === 'delivered' ||
    status === 'answered'
  ) {
    return 'Başarılı';
  }

  if (
    status === 'failed' ||
    status === 'missed'
  ) {
    return 'Başarısız';
  }

  if (status === 'sent') {
    return 'Gönderildi';
  }

  return 'Bekliyor';
}

function getStatusVariant(
  status: ReminderHistory['status'],
) {
  if (
    status === 'success' ||
    status === 'delivered' ||
    status === 'answered'
  ) {
    return 'success' as const;
  }

  if (
    status === 'failed' ||
    status === 'missed'
  ) {
    return 'danger' as const;
  }

  return 'warning' as const;
}

export function formatDate(
  value?: string,
): string {
  if (!value) {
    return 'Henüz gönderilmedi';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Tarih bilgisi bulunamadı';
  }

  return new Intl.DateTimeFormat(
    'tr-TR',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(date);
}

function createStyles(
  theme: AppTheme,
) {
  return StyleSheet.create({
    filters: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: 22,
    },

    list: {
      gap: 10,
    },

    historyCard: {
      width: '100%',
      minHeight: 88,
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 16,
      backgroundColor:
        theme.colors.surface,
      overflow: 'hidden',
      ...theme.shadows.card,
    },

    historyCardPressed: {
      opacity: 0.78,
    },

    historyAccent: {
      width: 4,
      backgroundColor:
        theme.colors.primary,
    },

    historyContent: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },

    historyTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    iconContainer: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        theme.colors.primarySoft,
    },

    historyTitleArea: {
      flex: 1,
    },

    entryTitle: {
      color:
        theme.colors.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },

    entryDate: {
      color:
        theme.colors.textSecondary,
      fontSize: 11,
      marginTop: 3,
    },

    entryFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor:
        theme.colors.divider,
    },

    entryMeta: {
      color:
        theme.colors.textMuted,
      fontSize: 10,
      fontWeight: '500',
    },
  });
}