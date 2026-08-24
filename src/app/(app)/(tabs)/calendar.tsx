import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/application/session';
import { appContainer } from '@/composition/app-container';
import type { Reminder } from '@/domain/models/reminder';

interface CalendarDay {
  readonly key: string;
  readonly dateKey: string;
  readonly day: number;
  readonly inCurrentMonth: boolean;
}

export default function CalendarRoute() {
  const router = useRouter();

  const { session } = useSession();
  const userId = session?.userId ?? '';

  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const [reminders, setReminders] = useState<readonly Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();

      async function loadReminders() {
        try {
          setLoading(true);
          setError(null);

          const [activeReminders, pastReminders] =
            await Promise.all([
              appContainer.getReminders.execute(
                userId,
                'active',
                controller.signal,
              ),
              appContainer.getReminders.execute(
                userId,
                'history',
                controller.signal,
              ),
            ]);

          setReminders([
            ...activeReminders,
            ...pastReminders,
          ]);
        } catch (err) {
          if (controller.signal.aborted) {
            return;
          }

          setError(
            err instanceof Error
              ? err.message
              : 'Takvim yüklenemedi.',
          );
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      }

      void loadReminders();

      return () => {
        controller.abort();
      };
    }, [userId]),
  );

  const calendarDays = useMemo(
    () => buildCalendarDays(calendarDate),
    [calendarDate],
  );

  const reminderDateKeys = useMemo(() => {
    return new Set(
      reminders.map((reminder) =>
        toDateKey(new Date(reminder.eventDateTime)),
      ),
    );
  }, [reminders]);

  const selectedDateKey = toDateKey(selectedDate);

  const selectedReminders = useMemo(() => {
    return reminders
      .filter(
        (reminder) =>
          toDateKey(new Date(reminder.eventDateTime)) ===
          selectedDateKey,
      )
      .sort((left, right) =>
        left.eventDateTime.localeCompare(
          right.eventDateTime,
        ),
      );
  }, [reminders, selectedDateKey]);

  const goPreviousMonth = () => {
    setCalendarDate((current) => {
      return new Date(
        current.getFullYear(),
        current.getMonth() - 1,
        1,
      );
    });
  };

  const goNextMonth = () => {
    setCalendarDate((current) => {
      return new Date(
        current.getFullYear(),
        current.getMonth() + 1,
        1,
      );
    });
  };

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.pageTitle}>
            Takvim
          </Text>

          <Text style={styles.pageDescription}>
            Hatırlatıcılarını tarihlerine göre görüntüle.
          </Text>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Pressable
              onPress={goPreviousMonth}
              style={({ pressed }) => [
                styles.arrowButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.arrowText}>
                ‹
              </Text>
            </Pressable>

            <Text style={styles.monthTitle}>
              {formatMonth(calendarDate)}
            </Text>

            <Pressable
              onPress={goNextMonth}
              style={({ pressed }) => [
                styles.arrowButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.arrowText}>
                ›
              </Text>
            </Pressable>
          </View>

          <View style={styles.weekHeader}>
            {[
              'Pzt',
              'Sal',
              'Çar',
              'Per',
              'Cum',
              'Cmt',
              'Paz',
            ].map((day) => (
              <Text
                key={day}
                style={styles.weekDayText}
              >
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarDays.map((day) => {
              const isSelected =
                day.dateKey === selectedDateKey;

              const hasReminder =
                reminderDateKeys.has(day.dateKey);

              return (
                <Pressable
                  key={day.key}
                  onPress={() => {
                    const date = dateFromKey(day.dateKey);

                    setSelectedDate(date);

                    if (
                      date.getMonth() !==
                      calendarDate.getMonth()
                    ) {
                      setCalendarDate(
                        new Date(
                          date.getFullYear(),
                          date.getMonth(),
                          1,
                        ),
                      );
                    }
                  }}
                  style={({ pressed }) => [
                    styles.calendarDay,
                    isSelected &&
                      styles.calendarDaySelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <View
  style={[
    styles.dayNumberCircle,
    isSelected && styles.dayNumberCircleSelected,
  ]}
>
  <Text
    style={[
      styles.calendarDayText,
      !day.inCurrentMonth &&
        styles.calendarDayMuted,
      isSelected &&
        styles.calendarDaySelectedText,
    ]}
  >
    {day.day}
  </Text>
</View>

    {hasReminder ? (
  <View style={styles.reminderLines}>
    <View style={styles.reminderLine} />

    {isSelected ? (
      <View
        style={[
          styles.reminderLine,
          styles.reminderLineSecond,
        ]}
      />
    ) : null}
  </View>
) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.selectedSection}>
          <Text style={styles.selectedDateTitle}>
            {formatSelectedDate(selectedDate)}
          </Text>

          <Text style={styles.selectedDateSubtitle}>
            {selectedReminders.length}{' '}
            hatırlatıcı planlandı
          </Text>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator
                size="large"
                color={COLORS.primary}
              />

              <Text style={styles.loadingText}>
                Hatırlatıcılar yükleniyor...
              </Text>
            </View>
          ) : null}

          {!loading && error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>
                Takvim yüklenemedi
              </Text>

              <Text style={styles.errorText}>
                {error}
              </Text>
            </View>
          ) : null}

          {!loading &&
          !error &&
          selectedReminders.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>
                Bu tarihte hatırlatıcı yok
              </Text>

              <Text style={styles.emptyDescription}>
                Hatırlatıcısı olan günler takvimde
                yeşil noktayla gösterilir.
              </Text>
            </View>
          ) : null}

          {!loading &&
            !error &&
            selectedReminders.map((reminder) => (
              <Pressable
                key={reminder.id}
                onPress={() =>
                  router.push({
                    pathname: '/reminders/[id]',
                    params: {
                      id: reminder.id,
                    },
                  })
                }
                style={({ pressed }) => [
                  styles.reminderCard,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.reminderTopLine}>
                  <View style={styles.reminderBadge}>
                    <Text style={styles.reminderBadgeText}>
                      HATIRLATICI
                    </Text>
                  </View>

                  <Text style={styles.reminderTime}>
                    {formatTime(
                      reminder.eventDateTime,
                    )}
                  </Text>
                </View>

                <Text style={styles.reminderTitle}>
                  {reminder.title}
                </Text>

                {reminder.description ? (
                  <Text
                    style={styles.reminderDescription}
                  >
                    {reminder.description}
                  </Text>
                ) : null}
              </Pressable>
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function buildCalendarDays(
  date: Date,
): readonly CalendarDay[] {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(
    year,
    month,
    1,
  );

  const mondayIndex =
    (firstDay.getDay() + 6) % 7;

  const startDate = new Date(
    year,
    month,
    1 - mondayIndex,
  );

  return Array.from(
    { length: 42 },
    (_, index) => {
      const current = new Date(startDate);

      current.setDate(
        startDate.getDate() + index,
      );

      return {
        key: toDateKey(current),
        dateKey: toDateKey(current),
        day: current.getDate(),
        inCurrentMonth:
          current.getMonth() === month,
      };
    },
  );
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    date.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function dateFromKey(value: string): Date {
  const [year, month, day] = value
    .split('-')
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
    12,
    0,
    0,
  );
}

function formatMonth(date: Date): string {
  return new Intl.DateTimeFormat(
    'tr-TR',
    {
      month: 'long',
      year: 'numeric',
    },
  )
    .format(date)
    .toLocaleUpperCase('tr-TR');
}

function formatSelectedDate(
  date: Date,
): string {
  return new Intl.DateTimeFormat(
    'tr-TR',
    {
      day: 'numeric',
      month: 'long',
      weekday: 'long',
    },
  ).format(date);
}

function formatTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }

  return new Intl.DateTimeFormat(
    'tr-TR',
    {
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date);
}

const COLORS = {
  background: '#F7FAF8',
  surface: '#FFFFFF',

  primary: '#0B5D48',
  primarySoft: '#EAF6F2',

  textPrimary: '#17231F',
  textSecondary: '#68756F',
  textMuted: '#9AA39F',

  border: '#E1E9E5',

  danger: '#C64242',
  dangerSoft: '#FFF1F1',
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 18,
  },

  pageTitle: {
    color: COLORS.primary,
    fontSize: 28,
    fontWeight: '800',
  },

  pageDescription: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },

  calendarCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    elevation: 2,
  },

  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  monthTitle: {
    flex: 1,
    color: COLORS.primary,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
  },

  arrowButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },

  arrowText: {
    color: COLORS.textSecondary,
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '300',
  },

  weekHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingVertical: 9,
    marginBottom: 3,
  },

  weekDayText: {
    width: '14.2857%',
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
  },

  calendarGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  calendarDay: {
    width: '14.2857%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F1',
  },

  calendarDaySelected: {
    
  },
  
  calendarDayText: {
  color: COLORS.textPrimary,
  fontSize: 12,
  fontWeight: '600',
},

  calendarDayMuted: {
    color: COLORS.textMuted,
    opacity: 0.4,
  },

  calendarDaySelectedText: {
  color: COLORS.primary,
  fontWeight: '800',
  fontSize: 12,
},

 reminderLines: {
  position: 'absolute',
  bottom: 3,
  alignItems: 'center',
  gap: 2,
},

reminderLine: {
  width: 18,
  height: 3,
  borderRadius: 2,
  backgroundColor: COLORS.primary,
},

reminderLineSecond: {
  backgroundColor: '#2BAA8A',
},



  selectedSection: {
    marginTop: 22,
  },

  selectedDateTitle: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: '800',
    textTransform: 'capitalize',
  },

  selectedDateSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 14,
  },

  reminderCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    elevation: 1,
  },

  reminderTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  reminderBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  reminderBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },

  reminderTime: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },

  reminderTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },

  reminderDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  loadingBox: {
    alignItems: 'center',
    paddingVertical: 30,
  },

  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 10,
  },

  emptyBox: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 22,
  },

  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },

  emptyDescription: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },

  errorBox: {
    backgroundColor: COLORS.dangerSoft,
    borderRadius: 16,
    padding: 18,
  },

  errorTitle: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: '700',
  },

  errorText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 5,
  },

  pressed: {
    opacity: 0.7,
  },
  dayNumberCircle: {
  width: 30,
  height: 30,
  borderRadius: 15,
  alignItems: 'center',
  justifyContent: 'center',
},

dayNumberCircleSelected: {
  backgroundColor: 'transparent',
},
});