import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { GetReminders } from '@/application/reminder';
import type { GetHomeOverview } from '@/application/use-cases/get-home-overview';
import { Badge, Card, StateView } from '@/components';
import { type AppTheme, useTheme } from '@/core/theme';
import type { Reminder } from '@/domain/models/reminder';

import { useHomeOverview } from './use-home-overview';
import { useReminders } from './use-reminders';

interface HomeScreenProps {
  readonly getHomeOverview: GetHomeOverview;
  readonly getReminders?: GetReminders;
}

export function HomeScreen({ getHomeOverview, getReminders }: HomeScreenProps) {
  const { retry, state } = useHomeOverview(getHomeOverview);
  const reminders = useReminders(getReminders);
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              onRefresh={reminders.refresh}
              refreshing={reminders.refreshing}
              tintColor={theme.colors.accentStrong}
            />
          }
        >
          {state.status === 'loading' ? (
            <ActivityIndicator
              accessibilityLabel="Voia hazırlanıyor"
              color={theme.colors.accentStrong}
              size="large"
            />
          ) : null}

          {state.status === 'error' ? (
            <View style={styles.feedbackCard}>
              <Text style={styles.feedbackTitle}>Başlangıç bilgileri alınamadı</Text>
              <Text style={styles.feedbackDescription}>
                Lütfen bağlantıyı kontrol edip yeniden deneyin.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={retry}
                style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
              >
                <Text style={styles.retryButtonText}>Yeniden dene</Text>
              </Pressable>
            </View>
          ) : null}

          {state.status === 'ready' ? (
            <>
              <View style={styles.mark} accessibilityElementsHidden>
                <Text style={styles.markText}>V</Text>
              </View>
              <Text accessibilityRole="header" style={styles.title}>
                {state.data.applicationName}
              </Text>
              <Text style={styles.subtitle}>{state.data.assistantTagline}</Text>
              <View style={styles.statusCard}>
                <View
                  style={[
                    styles.statusDot,
                    state.data.readiness === 'degraded' && styles.statusDotDegraded,
                  ]}
                />
                <View style={styles.statusTextContainer}>
                  <Text style={styles.statusTitle}>
                    {state.data.mockDataSummary
                      ? `Merhaba, ${state.data.mockDataSummary.userDisplayName}`
                      : 'Hoş geldin'}
                  </Text>
                  <Text style={styles.statusDescription}>
                    Hatırlatmaların ve kişisel ayarların senin için hazır.
                  </Text>
                  {state.data.mockDataSummary ? (
                    <Text style={styles.fixtureDescription}>
                      {state.data.mockDataSummary.userDisplayName} •{' '}
                      {state.data.mockDataSummary.activeReminderCount} aktif hatırlatıcı •{' '}
                      {state.data.mockDataSummary.deviceCount} cihaz •{' '}
                      {state.data.mockDataSummary.historyCount} geçmiş kaydı
                    </Text>
                  ) : null}
                </View>
              </View>
              <View accessible style={styles.themeCard}>
                <View style={styles.themeTextContainer}>
                  <Text style={styles.themeTitle}>Gününü planlamaya başla</Text>
                  <Text style={styles.themeDescription}>
                    Hatırlatıcılarını oluştur, yaklaşan işlerini takip et.
                  </Text>
                </View>
              </View>
              <Card
                description="Yaklaşan işlerini ve önemli aramalarını tek yerde takip et."
                style={styles.reminderCard}
                title="Aktif hatırlatmalar"
                variant="outlined"
              >
                {reminders.state.status === 'loading' ? <StateView variant="loading" /> : null}
                {reminders.state.status === 'error' ? (
                  <StateView
                    actionLabel="Tekrar dene"
                    description="Hatırlatmalar yüklenemedi."
                    onAction={reminders.retry}
                    title="Hatırlatmalar alınamadı"
                    variant="error"
                  />
                ) : null}
                {reminders.state.status === 'ready' && reminders.state.data.length === 0 ? (
                  <StateView
                    description="İlk hatırlatıcını oluşturarak gününü planlamaya başlayabilirsin."
                    title="Henüz aktif hatırlatma yok"
                    variant="empty"
                  />
                ) : null}
                {reminders.state.status === 'ready' && reminders.state.data.length > 0
                  ? reminders.state.data.map((reminder) => (
                      <ReminderRow key={reminder.id} reminder={reminder} />
                    ))
                  : null}
              </Card>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    page: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    safeArea: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing['2xl'],
      paddingVertical: theme.spacing['2xl'],
    },
    mark: {
      width: 72,
      height: 72,
      borderRadius: theme.radii.xl,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.xl,
    },
    markText: {
      color: theme.colors.textOnPrimary,
      fontSize: 36,
      fontWeight: theme.typography.display.fontWeight,
    },
    title: {
      color: theme.colors.primary,
      ...theme.typography.display,
      textAlign: 'center',
    },
    subtitle: {
      color: theme.colors.textSecondary,
      ...theme.typography.body,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
    statusCard: {
      width: '100%',
      maxWidth: theme.sizes.contentMaxWidth,
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing['4xl'],
      padding: theme.spacing.lg,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      ...theme.shadows.card,
    },
    statusDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: theme.spacing.md,
      backgroundColor: theme.colors.accent,
    },
    statusDotDegraded: {
      backgroundColor: theme.colors.warningAccent,
    },
    statusTextContainer: {
      flex: 1,
    },
    statusTitle: {
      color: theme.colors.textPrimary,
      ...theme.typography.button,
    },
    statusDescription: {
      color: theme.colors.textMuted,
      ...theme.typography.caption,
      marginTop: theme.spacing.xs,
    },
    fixtureDescription: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
      marginTop: theme.spacing.sm,
    },
    feedbackCard: {
      width: '100%',
      maxWidth: theme.sizes.contentMaxWidth,
      alignItems: 'center',
      padding: theme.spacing['2xl'],
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: theme.colors.dangerAccent,
      backgroundColor: theme.colors.surface,
      ...theme.shadows.card,
    },
    feedbackTitle: {
      color: theme.colors.danger,
      ...theme.typography.cardTitle,
      textAlign: 'center',
    },
    feedbackDescription: {
      color: theme.colors.textSecondary,
      ...theme.typography.bodySmall,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
    retryButton: {
      minHeight: theme.sizes.touchTarget,
      justifyContent: 'center',
      marginTop: theme.spacing.xl,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.primary,
    },
    retryButtonPressed: {
      backgroundColor: theme.colors.primaryPressed,
    },
    retryButtonText: {
      color: theme.colors.textOnPrimary,
      ...theme.typography.button,
    },
    themeCard: {
      width: '100%',
      maxWidth: theme.sizes.contentMaxWidth,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.lg,
      marginTop: theme.spacing.md,
      padding: theme.spacing.lg,
      borderRadius: theme.radii.lg,
      backgroundColor: theme.colors.primarySoft,
    },
    reminderCard: {
      width: '100%',
      maxWidth: theme.sizes.contentMaxWidth,
      marginTop: theme.spacing.xl,
    },
    reminderRow: {
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    reminderRowLast: {
      borderBottomWidth: 0,
      paddingBottom: 0,
    },
    reminderTopLine: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    reminderTitle: {
      flex: 1,
      color: theme.colors.textPrimary,
      ...theme.typography.cardTitle,
    },
    reminderDescription: {
      color: theme.colors.textSecondary,
      ...theme.typography.bodySmall,
      marginTop: theme.spacing.xs,
    },
    reminderMeta: {
      color: theme.colors.textMuted,
      ...theme.typography.caption,
      marginTop: theme.spacing.sm,
    },
    reminderTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.sm,
    },
    themeTextContainer: {
      flex: 1,
    },
    themeTitle: {
      color: theme.colors.primary,
      ...theme.typography.label,
    },
    themeDescription: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
      marginTop: theme.spacing.xs,
    },
  });
}

function ReminderRow({ reminder }: { readonly reminder: Reminder }) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const tags = [
    reminder.urgent ? <Badge key="urgent" label="Önemli" variant="warning" /> : null,
    reminder.pushSettings.some((setting) => setting.enabled) ? (
      <Badge key="push" label="Bildirim" variant="accent" />
    ) : null,
    reminder.voiceCallSetting?.enabled ? (
      <Badge key="voice" label="Arama" variant="neutral" />
    ) : null,
  ].filter(Boolean);

  return (
    <View style={[styles.reminderRow, reminder.status !== 'active' && styles.reminderRowLast]}>
      <View style={styles.reminderTopLine}>
        <Text style={styles.reminderTitle}>{reminder.title}</Text>
        {reminder.repeatType !== 'none' ? <Badge label="Tekrarlı" variant="neutral" /> : null}
      </View>
      {reminder.description ? (
        <Text numberOfLines={2} style={styles.reminderDescription}>
          {reminder.description}
        </Text>
      ) : null}
      <Text style={styles.reminderMeta}>{formatReminderDate(reminder.eventDateTime)}</Text>
      {tags.length > 0 ? <View style={styles.reminderTags}>{tags}</View> : null}
    </View>
  );
}

function formatReminderDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Tarih bilgisi bekleniyor';

  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'long',
    weekday: 'long',
  }).format(date);
}
