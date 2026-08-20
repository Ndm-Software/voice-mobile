import { useMemo, useState } from 'react';
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
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  const calendarDays = useMemo(
  () => buildCalendarDays(calendarDate),
  [calendarDate],
);

const reminderDateKeys = useMemo(() => {
  if (reminders.state.status !== 'ready') {
    return new Set<string>();
  }

  return new Set(
    reminders.state.data.map((reminder) =>
      toDateKey(new Date(reminder.eventDateTime)),
    ),
  );
}, [reminders.state]);

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
  {reminders.state.status === 'ready'
    ? reminders.state.data.length
    : 0}
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
    styles.miniCalendarCard,
    pressed && styles.miniCalendarCardPressed,
  ]}
>
  <View style={styles.miniCalendarHeader}>
  <Text style={styles.miniCalendarMonth}>
    {formatCalendarMonth(calendarDate)}
  </Text>

  <View style={styles.calendarNavigation}>
    <Pressable
      onPress={(event) => {
        event.stopPropagation();

        setCalendarDate((current) => {
          const previous = new Date(current);
          previous.setMonth(current.getMonth() - 1);
          return previous;
        });
      }}
      style={({ pressed }) => [
        styles.calendarNavButton,
        pressed && styles.calendarNavButtonPressed,
      ]}
    >
      <Ionicons
        name="chevron-back"
        size={17}
        color={theme.colors.textSecondary}
      />
    </Pressable>

    <Pressable
      onPress={(event) => {
        event.stopPropagation();

        setCalendarDate((current) => {
          const next = new Date(current);
          next.setMonth(current.getMonth() + 1);
          return next;
        });
      }}
      style={({ pressed }) => [
        styles.calendarNavButton,
        pressed && styles.calendarNavButtonPressed,
      ]}
    >
      <Ionicons
        name="chevron-forward"
        size={17}
        color={theme.colors.textSecondary}
      />
    </Pressable>
  </View>
</View>

  <View style={styles.weekHeader}>
    {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map((day) => (
      <Text key={day} style={styles.weekHeaderText}>
        {day}
      </Text>
    ))}
  </View>

  <View style={styles.calendarGrid}>
    {calendarDays.map((day) => {
      const hasReminder = reminderDateKeys.has(day.dateKey);

      return (
        <View
          key={day.key}
          style={[
            styles.calendarDay,
            day.isToday && styles.calendarDayToday,
          ]}
        >
          <Text
            style={[
              styles.calendarDayText,
              !day.inCurrentMonth && styles.calendarDayMuted,
              day.isToday && styles.calendarDayTodayText,
            ]}
          >
            {day.day}
          </Text>

          {hasReminder ? (
            <View style={styles.reminderDot} />
          ) : null}
        </View>
      );
    })}
  </View>
</Pressable>

  </>
) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatCalendarMonth(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    month: 'long',
    year: 'numeric',
  })
    .format(date)
    .toLocaleUpperCase('tr-TR');
}

function buildCalendarDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);

  const mondayBasedDay =
    (firstDay.getDay() + 6) % 7;

  const startDate = new Date(
    year,
    month,
    1 - mondayBasedDay,
  );

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(startDate);

    current.setDate(startDate.getDate() + index);

    return {
      key: current.toISOString(),
      dateKey: toDateKey(current),
      day: current.getDate(),
      inCurrentMonth: current.getMonth() === month,
      isToday:
        toDateKey(current) === toDateKey(new Date()),
    };
  });
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
  alignItems: 'center',
  minHeight: 58,
  marginBottom: 8,
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: theme.colors.border,
  backgroundColor: theme.colors.surface,
  ...theme.shadows.card,
},

reminderAccent: {
  width: 4,
  height: 38,
  borderRadius: 999,
  backgroundColor: theme.colors.primary,
  marginRight: 10,
  alignSelf: 'center',
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
  fontSize: 14,
  fontWeight: '700',
},

reminderDescription: {
  color: theme.colors.textSecondary,
  fontSize: 11,
  lineHeight: 14,
  marginTop: 1,
},

reminderMeta: {
  color: theme.colors.textMuted,
  fontSize: 10,
  marginTop: 2,
},

reminderTags: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 4,
  marginTop: 5,
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
    miniCalendarCard: {
  width: '100%',
  maxWidth: 340,
  alignSelf: 'center',
  marginTop: 18,
  paddingHorizontal: 14,
  paddingTop: 14,
  paddingBottom: 14,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: theme.colors.border,
  backgroundColor: theme.colors.surface,
  ...theme.shadows.card,
},

miniCalendarHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 10,
},

miniCalendarMonth: {
  color: theme.colors.textPrimary,
  fontSize: 14,
  fontWeight: '700',
},

miniCalendarCardPressed: {
  opacity: 0.82,
},

weekHeader: {
  flexDirection: 'row',
  marginBottom: 8,
},

calendarNavigation: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
},

calendarNavButton: {
  width: 30,
  height: 30,
  borderRadius: 15,
  alignItems: 'center',
  justifyContent: 'center',
},

calendarNavButtonPressed: {
  backgroundColor: theme.colors.primarySoft,
},

weekHeaderText: {
  width: '14.2857%',
  textAlign: 'center',
  color: theme.colors.textMuted,
  fontSize: 10,
  fontWeight: '600',
},

calendarGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
},


calendarDay: {
  width: '14.2857%',
  height: 34,
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
},

calendarDayToday: {
  width: 30,
  height: 30,
  borderRadius: 15,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.colors.primary,
},

calendarDayText: {
  color: theme.colors.textPrimary,
  fontSize: 11,
  fontWeight: '500',
},

calendarDayMuted: {
  color: theme.colors.textMuted,
  opacity: 0.45,
},

calendarDayTodayText: {
  color: theme.colors.textOnPrimary,
  fontWeight: '700',
},

reminderDot: {
  position: 'absolute',
  bottom: 1,
  width: 4,
  height: 4,
  borderRadius: 2,
  backgroundColor: theme.colors.primary,
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
