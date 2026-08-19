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
import { useRouter } from 'expo-router';

import type { GetReminders } from '@/application/reminder';
import type { GetHomeOverview } from '@/application/use-cases/get-home-overview';
import { Badge, Card, StateView } from '@/components';
import { type AppTheme, useTheme } from '@/core/theme';
import { routes } from '@/config/routes';
import type { Reminder } from '@/domain/models/reminder';

import { useHomeOverview } from './use-home-overview';
import { useReminders } from './use-reminders';

import { Ionicons } from '@expo/vector-icons';

interface HomeScreenProps {
  readonly getHomeOverview: GetHomeOverview;
  readonly getReminders?: GetReminders;
  readonly userId?: string;
}

export function HomeScreen({ getHomeOverview, getReminders, userId }: HomeScreenProps) {
  const { retry, state } = useHomeOverview(getHomeOverview);
  const reminders = useReminders(getReminders, userId);
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

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
    <View style={styles.hero}>
      <Text accessibilityRole="header" style={styles.title}>
        {state.data.mockDataSummary
          ? `Merhaba, ${state.data.mockDataSummary.userDisplayName}!`
          : 'Merhaba!'}
      </Text>

      <Text style={styles.subtitle}>
        İşte bugün için planladıkların ve asistanının notları.
      </Text>
    </View>

    {state.data.mockDataSummary ? (
      <ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.summaryRow}
>
  <Pressable
    onPress={() => router.push('/(app)/(tabs)/calendar')}
    style={({ pressed }) => [
      styles.summaryCard,
      pressed && styles.summaryCardPressed,
    ]}
  >
    <View style={styles.summaryIcon}>
      <Ionicons
        name="clipboard-outline"
        size={21}
        color={theme.colors.primary}
      />
    </View>

    <View style={styles.summaryText}>
      <Text style={styles.summaryLabel}>
        AKTİF HATIRLATICILAR
      </Text>

      <Text style={styles.summaryValue}>
        {state.data.mockDataSummary?.activeReminderCount ?? 0}
      </Text>
    </View>
  </Pressable>

  <Pressable
    onPress={() => router.push('/(app)/(tabs)/history')}
    style={({ pressed }) => [
      styles.summaryCard,
      pressed && styles.summaryCardPressed,
    ]}
  >
    <View style={styles.summaryIcon}>
      <Ionicons
        name="call-outline"
        size={21}
        color={theme.colors.primary}
      />
    </View>

    <View style={styles.summaryText}>
      <Text style={styles.summaryLabel}>
        BUGÜNKÜ ARAMALAR
      </Text>

      <Text style={styles.summaryValue}>
        {state.data.mockDataSummary?.historyCount ?? 0}
      </Text>
    </View>
  </Pressable>

  <Pressable
    onPress={() => router.push('/(app)/quiet-hours')}
    style={({ pressed }) => [
      styles.summaryCard,
      pressed && styles.summaryCardPressed,
    ]}
  >
    <View style={styles.summaryIcon}>
      <Ionicons
        name="volume-mute-outline"
        size={21}
        color={theme.colors.primary}
      />
    </View>

    <View style={styles.summaryText}>
      <Text style={styles.summaryLabel}>
        SESSİZ SAAT DURUMU
      </Text>

      <Text style={styles.summaryValue}>
        Kapalı
      </Text>
    </View>
  </Pressable>
</ScrollView>
    ) : null}

    <View style={styles.sectionHeader}>
  <Text style={styles.sectionTitle}>
    Yaklaşan Hatırlatıcılar
  </Text>

  <Pressable
    onPress={() => router.push('/(app)/(tabs)/calendar')}
    style={({ pressed }) => [
      styles.seeAllButton,
      pressed && styles.pressed,
    ]}
  >
    <Text style={styles.seeAllText}>
      Tümünü Gör
    </Text>

    <Ionicons
      name="chevron-forward"
      size={16}
      color={theme.colors.primary}
    />
  </Pressable>
</View>

<View style={styles.reminderPanel}>
  {reminders.state.status === 'loading' ? (
    <StateView variant="loading" />
  ) : null}

  {reminders.state.status === 'error' ? (
    <StateView
      actionLabel="Tekrar dene"
      description="Hatırlatmalar yüklenemedi."
      onAction={reminders.retry}
      title="Hatırlatmalar alınamadı"
      variant="error"
    />
  ) : null}

  {reminders.state.status === 'ready' &&
  reminders.state.data.length === 0 ? (
    <StateView
      description="İlk hatırlatıcını oluşturarak gününü planlamaya başlayabilirsin."
      title="Henüz aktif hatırlatma yok"
      variant="empty"
    />
  ) : null}

  {reminders.state.status === 'ready' &&
  reminders.state.data.length > 0
    ? reminders.state.data.map((reminder) => (
        <ReminderRow
          key={reminder.id}
          reminder={reminder}
        />
      ))
    : null}
</View>

<Pressable
  onPress={() => router.push('/(app)/(tabs)/calendar')}
  style={({ pressed }) => [
    styles.calendarCard,
    pressed && styles.calendarCardPressed,
  ]}
>
  <View style={styles.calendarIcon}>
    <Ionicons
      name="calendar-outline"
      size={22}
      color={theme.colors.primary}
    />
  </View>

  <View style={styles.calendarTextContainer}>
    <Text style={styles.calendarTitle}>
      Takvim
    </Text>

    <Text style={styles.calendarDescription}>
      Yaklaşan hatırlatıcılarını ve planlarını görüntüle.
    </Text>
  </View>

  <Ionicons
    name="chevron-forward"
    size={20}
    color={theme.colors.textMuted}
  />
</Pressable>

    <View style={styles.assistantCard}>
      <View style={styles.assistantIcon}>
        <Ionicons
          name="mic-outline"
          size={25}
          color={theme.colors.textOnPrimary}
        />
      </View>

      <Text style={styles.assistantTitle}>
        Voia Dinliyor...
      </Text>

      <Text style={styles.assistantDescription}>
        Hatırlatıcıların ve günlük planların için yanındayım.
      </Text>
    </View>
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
  paddingHorizontal: 20,
  paddingTop: 28,
  paddingBottom: 40,
},
summaryCardPressed: {
  opacity: 0.75,
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
  fontSize: 30,
  fontWeight: '800',
},
    subtitle: {
  color: theme.colors.textSecondary,
  fontSize: 15,
  lineHeight: 22,
  marginTop: 6,
},
hero: {
  marginBottom: 22,
},

summaryRow: {
  gap: 12,
  paddingBottom: 28,
},

summaryCard: {
  width: 215,
  minHeight: 102,
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 18,
  paddingVertical: 16,
  borderRadius: 18,
  borderWidth: 1,
  borderColor: theme.colors.border,
  backgroundColor: theme.colors.surface,
  ...theme.shadows.card,
},

summaryIcon: {
  width: 46,
  height: 46,
  borderRadius: 23,
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 14,
  backgroundColor: theme.colors.primarySoft,
},

summaryText: {
  flex: 1,
},

summaryLabel: {
  color: theme.colors.textMuted,
  fontSize: 11,
  fontWeight: '700',
  letterSpacing: 0.35,
},

summaryValue: {
  color: theme.colors.textPrimary,
  fontSize: 23,
  fontWeight: '800',
  marginTop: 4,
},

sectionHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
},

sectionTitle: {
  color: theme.colors.textPrimary,
  fontSize: 17,
  fontWeight: '700',
},

seeAllButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 3,
},

seeAllText: {
  color: theme.colors.primary,
  fontSize: 13,
  fontWeight: '700',
},

pressed: {
  opacity: 0.7,
},

reminderPanel: {
  width: '100%',
  backgroundColor: 'transparent',
},

reminderItemCard: {
  width: '100%',
  flexDirection: 'row',
  alignItems: 'stretch',
  minHeight: 86,
  marginBottom: 12,
  paddingVertical: 14,
  paddingHorizontal: 16,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: theme.colors.border,
  backgroundColor: theme.colors.surface,
  ...theme.shadows.card,
},

reminderAccent: {
  width: 5,
  borderRadius: 999,
  backgroundColor: theme.colors.primary,
  marginRight: 14,
},

reminderAccentMuted: {
  backgroundColor: theme.colors.divider,
},

reminderItemContent: {
  flex: 1,
},

reminderRowPressed: {
  opacity: 0.72,
},

reminderTitle: {
  flex: 1,
  color: theme.colors.textPrimary,
  fontSize: 15,
  fontWeight: '700',
},

reminderDescription: {
  color: theme.colors.textSecondary,
  fontSize: 13,
  lineHeight: 18,
  marginTop: 4,
},

reminderMeta: {
  color: theme.colors.textMuted,
  fontSize: 12,
  marginTop: 6,
},

reminderTags: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 6,
  marginTop: 8,
},

calendarCard: {
  width: '100%',
  minHeight: 82,
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 22,
  paddingHorizontal: 16,
  paddingVertical: 14,
  borderRadius: 18,
  borderWidth: 1,
  borderColor: theme.colors.border,
  backgroundColor: theme.colors.surface,
  ...theme.shadows.card,
},

calendarCardPressed: {
  opacity: 0.75,
},

calendarIcon: {
  width: 44,
  height: 44,
  borderRadius: 22,
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 14,
  backgroundColor: theme.colors.primarySoft,
},

calendarTextContainer: {
  flex: 1,
},

calendarTitle: {
  color: theme.colors.textPrimary,
  fontSize: 16,
  fontWeight: '700',
},

calendarDescription: {
  color: theme.colors.textSecondary,
  fontSize: 13,
  lineHeight: 18,
  marginTop: 4,
},

assistantCard: {
  width: '100%',
  alignItems: 'center',
  marginTop: 24,
  paddingHorizontal: 20,
  paddingVertical: 24,
  borderRadius: 18,
  backgroundColor: theme.colors.primary,
},

assistantIcon: {
  width: 56,
  height: 56,
  borderRadius: 28,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 14,
  backgroundColor: 'rgba(255,255,255,0.12)',
},

assistantTitle: {
  color: theme.colors.textOnPrimary,
  fontSize: 18,
  fontWeight: '700',
},

assistantDescription: {
  color: theme.colors.textOnPrimary,
  fontSize: 13,
  lineHeight: 19,
  textAlign: 'center',
  marginTop: 6,
  opacity: 0.8,
},
    statusCard: {
  width: '100%',
  maxWidth: theme.sizes.contentMaxWidth,
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 22,
  paddingHorizontal: 16,
  paddingVertical: 14,
  borderRadius: 18,
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
  marginTop: 16,
  paddingHorizontal: 16,
  paddingVertical: 14,
  borderRadius: 18,
  borderWidth: 1,
  borderColor: theme.colors.border,
  backgroundColor: theme.colors.primarySoft,
},
    reminderCard: {
  width: '100%',
  maxWidth: theme.sizes.contentMaxWidth,
  marginTop: 22,
  paddingHorizontal: 16,
  paddingVertical: 6,
  borderRadius: 18,
  borderWidth: 1,
  borderColor: theme.colors.border,
  backgroundColor: theme.colors.surface,
  ...theme.shadows.card,
},
    reminderRow: {
  minHeight: 82,
  justifyContent: 'center',
  paddingVertical: 14,
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
  const router = useRouter();
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
  <Pressable
    accessibilityRole="button"
    onPress={() => router.push(routes.reminderDetails(reminder.id))}
    style={({ pressed }) => [
      styles.reminderItemCard,
      pressed && styles.reminderRowPressed,
    ]}
  >
    <View
      style={[
        styles.reminderAccent,
        reminder.status !== 'active' && styles.reminderAccentMuted,
      ]}
    />

    <View style={styles.reminderItemContent}>
      <View style={styles.reminderTopLine}>
        <Text
          numberOfLines={1}
          style={styles.reminderTitle}
        >
          {reminder.title}
        </Text>

        {reminder.repeatType !== 'none' ? (
          <Badge
            label="Tekrarlı"
            variant="neutral"
          />
        ) : null}
      </View>

      {reminder.description ? (
        <Text
          numberOfLines={1}
          style={styles.reminderDescription}
        >
          {reminder.description}
        </Text>
      ) : null}

      <Text style={styles.reminderMeta}>
        {formatReminderDate(reminder.eventDateTime)}
      </Text>

      {tags.length > 0 ? (
        <View style={styles.reminderTags}>
          {tags}
        </View>
      ) : null}
    </View>
  </Pressable>
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
