import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import type { GetReminders } from '@/application/reminder';
import { Badge, Button, Card, Chip, Screen, SearchField, StateView } from '@/components';
import { routes } from '@/config/routes';
import { type AppTheme, useTheme } from '@/core/theme';
import type { Reminder } from '@/domain/models/reminder';

import {
  buildMonthDays,
  buildWeekDays,
  getCalendarRange,
  moveCalendarDate,
  toDateKey,
  type CalendarDay,
  type CalendarViewMode,
} from '../domain/calendar';

interface CalendarScreenProps {
  readonly getReminders: GetReminders;
  readonly initialDate?: Date;
  readonly userId: string;
}

type CalendarState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly reminders: readonly Reminder[] }
  | { readonly status: 'error' };

const viewModes: readonly { readonly label: string; readonly value: CalendarViewMode }[] = [
  { label: 'Ay', value: 'month' },
  { label: 'Hafta', value: 'week' },
  { label: 'Gün', value: 'day' },
];
const weekDayLabels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'] as const;

export function CalendarScreen({ getReminders, initialDate, userId }: CalendarScreenProps) {
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [mode, setMode] = useState<CalendarViewMode>('month');
  const [screenOpenedAt] = useState(() => new Date());
  const [anchorDate, setAnchorDate] = useState(() => initialDate ?? new Date());
  const [selectedDate, setSelectedDate] = useState(() => initialDate ?? new Date());
  const [state, setState] = useState<CalendarState>({ status: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [urgentOnly, setUrgentOnly] = useState(false);

  const range = useMemo(() => getCalendarRange(anchorDate, mode), [anchorDate, mode]);

  useEffect(() => {
  const trimmed = searchText.trim();

  if (trimmed.length < 2) {
    setDebouncedSearch('');
    return;
  }

  const timeout = setTimeout(() => {
    setDebouncedSearch(trimmed);
  }, 350);

  return () => clearTimeout(timeout);
}, [searchText]);

  const loadReminders = useCallback(
  (signal?: AbortSignal, refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setState({ status: 'loading' });
    }

    getReminders
      .execute(
        userId,
        {
          filter: 'all',
          startDate: range.startDate,
          endDate: range.endDate,
          ...(debouncedSearch
            ? { search: debouncedSearch }
            : {}),
          ...(urgentOnly
            ? { urgent: true }
            : {}),
        },
        signal,
      )
      .then(
        (reminders) => {
          if (!signal?.aborted) {
            setState({
              status: 'ready',
              reminders,
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
            setState({ status: 'error' });
          }
        },
      )
      .finally(() => {
        if (!signal?.aborted) {
          setRefreshing(false);
        }
      });
  },
  [
    debouncedSearch,
    getReminders,
    range.endDate,
    range.startDate,
    urgentOnly,
    userId,
  ],
);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      loadReminders(controller.signal);
      return () => controller.abort();
    }, [loadReminders]),
  );

  const reminders = useMemo(() => (state.status === 'ready' ? state.reminders : []), [state]);
  const selectedDateKey = toDateKey(selectedDate);
  const countsByDate = useMemo(() => {
    const counts = new Map<string, number>();
    reminders.forEach((reminder) => {
      const key = toDateKey(new Date(reminder.eventDateTime));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [reminders]);
  const selectedReminders = reminders.filter(
    (reminder) => toDateKey(new Date(reminder.eventDateTime)) === selectedDateKey,
  );

  function selectDate(date: Date) {
    setSelectedDate(date);
    if (mode === 'month' && date.getMonth() !== anchorDate.getMonth()) {
      setAnchorDate(new Date(date.getFullYear(), date.getMonth(), 1, 12));
    } else if (mode !== 'month') {
      setAnchorDate(date);
    }
  }

  function move(direction: -1 | 1) {
    const next = moveCalendarDate(anchorDate, mode, direction);
    setAnchorDate(next);
    setSelectedDate(next);
  }

  function goToday() {
    const today = new Date();
    setAnchorDate(today);
    setSelectedDate(today);
  }

  return (
    <Screen
      description="Hatırlatıcılarını ay, hafta veya gün görünümünde takip et."
      refreshControl={
        <RefreshControl
          onRefresh={() => loadReminders(undefined, true)}
          refreshing={refreshing}
          tintColor={theme.colors.accentStrong}
        />
      }
      title="Takvim"
    >
      <View style={styles.filterPanel}>
  <SearchField
    accessibilityLabel="Hatırlatıcı ara"
    onChangeText={setSearchText}
    placeholder="Hatırlatıcılarda ara..."
    value={searchText}
  />

  <View style={styles.filterRow}>
    <Chip
      label="Önemli"
      onPress={() => setUrgentOnly((current) => !current)}
      selected={urgentOnly}
    />

    {searchText.length > 0 || urgentOnly ? (
      <Pressable
        accessibilityLabel="Filtreleri temizle"
        accessibilityRole="button"
        onPress={() => {
          setSearchText('');
          setDebouncedSearch('');
          setUrgentOnly(false);
        }}
      >
        <Text style={styles.clearFiltersText}>
          Filtreleri temizle
        </Text>
      </Pressable>
    ) : null}
  </View>

  {searchText.trim().length === 1 ? (
    <Text style={styles.searchHint}>
      Arama için en az 2 karakter gir.
    </Text>
  ) : null}
</View>
      <View style={styles.modeRow}>
        {viewModes.map((item) => (
          <Chip
            accessibilityLabel={`${item.label} görünümü`}
            key={item.value}
            label={item.label}
            onPress={() => {
              setMode(item.value);
              setAnchorDate(selectedDate);
            }}
            selected={mode === item.value}
          />
        ))}
      </View>

      <Card variant="outlined">
        <View style={styles.navigationRow}>
          <PeriodButton label="Önceki dönem" onPress={() => move(-1)} symbol="‹" />
          <View style={styles.periodCopy}>
            <Text style={styles.periodTitle}>{formatPeriod(anchorDate, mode)}</Text>
            <Pressable accessibilityRole="button" onPress={goToday}>
              <Text style={styles.todayLink}>Bugüne dön</Text>
            </Pressable>
          </View>
          <PeriodButton label="Sonraki dönem" onPress={() => move(1)} symbol="›" />
        </View>

        {mode === 'month' ? (
          <MonthView
            anchorDate={anchorDate}
            countsByDate={countsByDate}
            onSelect={selectDate}
            selectedDateKey={selectedDateKey}
            todayDateKey={toDateKey(screenOpenedAt)}
          />
        ) : null}
        {mode === 'week' ? (
          <WeekView
            countsByDate={countsByDate}
            days={buildWeekDays(anchorDate)}
            onSelect={selectDate}
            selectedDateKey={selectedDateKey}
            todayDateKey={toDateKey(screenOpenedAt)}
          />
        ) : null}
        {mode === 'day' ? (
          <View style={styles.daySummary}>
            <Text style={styles.dayNumber}>{selectedDate.getDate()}</Text>
            <Text style={styles.dayName}>{formatSelectedDate(selectedDate)}</Text>
            <Text style={styles.dayCount}>{selectedReminders.length} hatırlatıcı</Text>
          </View>
        ) : null}
      </Card>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionCopy}>
          <Text style={styles.sectionTitle}>{formatSelectedDate(selectedDate)}</Text>
          <Text style={styles.sectionDescription}>Seçili tarihin planı</Text>
        </View>
        <Badge label={`${selectedReminders.length} kayıt`} variant="accent" />
      </View>

      <Button
        fullWidth
        icon="add"
        label="Bu tarihe hatırlatıcı ekle"
        onPress={() =>
          router.push({ pathname: routes.createReminder, params: { initialDate: selectedDateKey } })
        }
      />

      <View style={styles.reminderList}>
        {state.status === 'loading' ? <StateView variant="loading" /> : null}
        {state.status === 'error' ? (
          <StateView
            actionLabel="Tekrar dene"
            description="Takvim kayıtları şu anda alınamadı."
            onAction={() => loadReminders()}
            title="Takvim yüklenemedi"
            variant="error"
          />
        ) : null}
        {state.status === 'ready' && selectedReminders.length === 0 ? (
  <StateView
    description={
      debouncedSearch || urgentOnly
        ? 'Arama veya filtre kriterlerine uygun bir hatırlatıcı bulunamadı.'
        : 'Bu tarihe yeni bir hatırlatıcı ekleyebilirsin.'
    }
    title={
      debouncedSearch || urgentOnly
        ? 'Sonuç bulunamadı'
        : 'Bu gün için plan yok'
    }
    variant="empty"
  />
) : null}
        {state.status === 'ready'
          ? selectedReminders.map((reminder) => (
              <ReminderCard key={reminder.id} now={screenOpenedAt.getTime()} reminder={reminder} />
            ))
          : null}
      </View>
    </Screen>
  );
}

interface CalendarViewProps {
  readonly countsByDate: ReadonlyMap<string, number>;
  readonly onSelect: (date: Date) => void;
  readonly selectedDateKey: string;
  readonly todayDateKey: string;
}

function MonthView({ anchorDate, ...props }: CalendarViewProps & { readonly anchorDate: Date }) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View>
      <View style={styles.weekHeader}>
        {weekDayLabels.map((label) => (
          <Text key={label} style={styles.weekLabel}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.monthGrid}>
        {buildMonthDays(anchorDate).map((day) => (
          <CalendarDayButton key={day.dateKey} day={day} {...props} />
        ))}
      </View>
    </View>
  );
}

function WeekView({
  countsByDate,
  days,
  onSelect,
  selectedDateKey,
  todayDateKey,
}: CalendarViewProps & { readonly days: readonly CalendarDay[] }) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View>
      <View style={styles.weekHeader}>
        {weekDayLabels.map((label) => (
          <Text key={label} style={styles.weekLabel}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.monthGrid}>
        {days.map((day) => (
          <CalendarDayButton
            key={day.dateKey}
            countsByDate={countsByDate}
            day={day}
            onSelect={onSelect}
            selectedDateKey={selectedDateKey}
            todayDateKey={todayDateKey}
          />
        ))}
      </View>
    </View>
  );
}

function CalendarDayButton({
  countsByDate,
  day,
  onSelect,
  selectedDateKey,
  todayDateKey,
}: CalendarViewProps & { readonly day: CalendarDay }) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const selected = day.dateKey === selectedDateKey;
  const count = countsByDate.get(day.dateKey) ?? 0;
  const past = day.dateKey < todayDateKey;

  return (
    <Pressable
      accessibilityLabel={`${formatSelectedDate(day.date)}${count ? `, ${count} hatırlatıcı` : ''}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => onSelect(day.date)}
      style={({ pressed }) => [
        styles.calendarDay,
        selected && styles.selectedDay,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.dayText,
          past && styles.pastDayText,
          !day.inCurrentMonth && styles.outsideDayText,
          selected && styles.selectedDayText,
        ]}
      >
        {day.date.getDate()}
      </Text>

      {selected ? (
        <View style={styles.reminderLines}>
          <View style={styles.reminderLine} />

          {count > 0 ? <View style={styles.reminderLine} /> : null}
        </View>
      ) : count > 0 ? (
        <View style={styles.reminderLines}>
          <View style={styles.reminderLine} />
        </View>
      ) : null}
    </Pressable>
  );
}

function PeriodButton({
  label,
  onPress,
  symbol,
}: {
  readonly label: string;
  readonly onPress: () => void;
  readonly symbol: string;
}) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.navigationButton, pressed && styles.pressed]}
    >
      <Text style={styles.navigationSymbol}>{symbol}</Text>
    </Pressable>
  );
}

function ReminderCard({ now, reminder }: { readonly now: number; readonly reminder: Reminder }) {
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const past = Date.parse(reminder.eventDateTime) < now;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(routes.reminderDetails(reminder.id))}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card variant="outlined">
        <View style={styles.reminderHeader}>
          <View style={styles.reminderCopy}>
            <Text style={styles.reminderTitle}>{reminder.title}</Text>
            <Text style={styles.reminderTime}>{formatTime(reminder.eventDateTime)}</Text>
          </View>
          <View style={styles.reminderBadges}>
            <Badge label={past ? 'Geçmiş' : 'Yaklaşan'} variant={past ? 'neutral' : 'accent'} />
            {reminder.urgent ? <Badge label="Önemli" variant="warning" /> : null}
          </View>
        </View>
        {reminder.description ? (
          <Text style={styles.reminderDescription}>{reminder.description}</Text>
        ) : null}
      </Card>
    </Pressable>
  );
}

function formatPeriod(date: Date, mode: CalendarViewMode): string {
  if (mode === 'month') {
    return new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(date);
  }
  if (mode === 'day') return formatSelectedDate(date);
  const days = buildWeekDays(date);
  return `${days[0].date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} – ${days[6].date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

function formatSelectedDate(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

function formatTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Saat bilgisi yok'
    : date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    modeRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
    navigationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.lg,
    },
    navigationButton: {
      width: theme.sizes.touchTarget,
      height: theme.sizes.touchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radii.full,
      backgroundColor: theme.colors.primarySoft,
    },
    navigationSymbol: { color: theme.colors.primary, fontSize: 32, lineHeight: 34 },
    periodCopy: { flex: 1, alignItems: 'center', paddingHorizontal: theme.spacing.sm },
    periodTitle: {
      color: theme.colors.textPrimary,
      ...theme.typography.cardTitle,
      textAlign: 'center',
      textTransform: 'capitalize',
    },
    todayLink: {
      color: theme.colors.accentStrong,
      ...theme.typography.caption,
      marginTop: theme.spacing.xs,
    },
    weekHeader: { flexDirection: 'row', marginBottom: theme.spacing.sm },
    weekLabel: {
      width: '14.285%',
      color: theme.colors.textMuted,
      ...theme.typography.caption,
      textAlign: 'center',
    },
    monthGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    calendarDay: {
      width: '14.285%',
      minHeight: theme.sizes.touchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radii.full,
    },
    selectedDay: {
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 12,
    },
    dayText: { color: theme.colors.textPrimary, ...theme.typography.bodySmall },
    pastDayText: { color: theme.colors.textMuted },
    outsideDayText: { color: theme.colors.textMuted },
    selectedDayText: {
      color: theme.colors.primary,
      fontWeight: '700',
    },
    reminderLines: {
      height: 8,
      marginTop: 2,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },

    reminderLine: {
      width: 16,
      height: 2,
      borderRadius: 2,
      backgroundColor: theme.colors.accentStrong,
    },
    dayCount: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
      marginTop: theme.spacing.xs,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      marginTop: theme.spacing['2xl'],
      marginBottom: theme.spacing.md,
    },
    sectionCopy: { flex: 1 },
    sectionTitle: {
      color: theme.colors.textPrimary,
      ...theme.typography.sectionTitle,
      textTransform: 'capitalize',
    },
    sectionDescription: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
      marginTop: theme.spacing.xs,
    },
    reminderList: { gap: theme.spacing.md, marginTop: theme.spacing.lg },
    reminderHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
    reminderCopy: { flex: 1 },
    reminderBadges: { alignItems: 'flex-end', gap: theme.spacing.xs },
    reminderTitle: { color: theme.colors.textPrimary, ...theme.typography.cardTitle },
    reminderTime: {
      color: theme.colors.primary,
      ...theme.typography.label,
      marginTop: theme.spacing.xs,
    },
    reminderDescription: {
      color: theme.colors.textSecondary,
      ...theme.typography.bodySmall,
      marginTop: theme.spacing.md,
    },
    pressed: {
      opacity: 0.75,
    },
    daySummary: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    dayNumber: {
      color: theme.colors.primary,
      ...theme.typography.display,
    },
    dayName: {
      color: theme.colors.textPrimary,
      ...theme.typography.cardTitle,
      textTransform: 'capitalize',
    },
    filterPanel: {
  gap: theme.spacing.sm,
  marginBottom: theme.spacing.lg,
},

filterRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing.sm,
},

clearFiltersText: {
  color: theme.colors.accentStrong,
  ...theme.typography.caption,
},

searchHint: {
  color: theme.colors.textMuted,
  ...theme.typography.caption,
},
  });
}
