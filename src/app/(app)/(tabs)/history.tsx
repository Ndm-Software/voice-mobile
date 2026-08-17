import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSession } from '@/application/session';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appContainer } from '@/composition/app-container';
import type {
  Reminder,
  ReminderHistory,
} from '@/domain/models/reminder';

type HistoryFilter = 'all' | 'voice-call' | 'push';

interface HistoryItem {
  readonly history: ReminderHistory;
  readonly reminder?: Reminder;
}

export default function HistoryRoute() {
  const { session } = useSession();
  const userId = session?.userId ?? '';

  // diğer kodların...
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<readonly HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
  useCallback(() => {
    const controller = new AbortController();

    async function loadHistory() {
      try {
        setLoading(true);
        setError(null);

        const [history, activeReminders, pastReminders] =
          await Promise.all([
            appContainer.getReminderHistory.execute(
              userId,
              controller.signal,
            ),
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

        const reminders = [
          ...activeReminders,
          ...pastReminders,
        ];

        const mapped: HistoryItem[] = history.map(
          (historyItem) => ({
            history: historyItem,
            reminder: reminders.find(
              (reminder) =>
                reminder.id === historyItem.reminderId,
            ),
          }),
        );

        setItems(mapped);
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : 'Geçmiş kayıtları yüklenemedi.',
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      controller.abort();
    };
  }, []),
);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase('tr-TR');

    return items.filter(({ history, reminder }) => {
      if (filter !== 'all' && history.type !== filter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        reminder?.title,
        reminder?.description,
        history.userMessage,
        history.provider,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('tr-TR');

      return searchableText.includes(normalizedSearch);
    });
  }, [filter, items, search]);

  const groups = useMemo(
    () => groupHistoryByDate(filteredItems),
    [filteredItems],
  );

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Geçmiş</Text>

          <Text style={styles.subtitle}>
            Bildirimlerinizi ve arama kayıtlarınızı buradan yönetin.
          </Text>
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Geçmişte ara..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.searchInput}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          <FilterButton
            active={filter === 'all'}
            label="Tüm Geçmiş"
            onPress={() => setFilter('all')}
          />

          <FilterButton
            active={filter === 'voice-call'}
            label="Sesli Aramalar"
            onPress={() => setFilter('voice-call')}
          />

          <FilterButton
            active={filter === 'push'}
            label="Bildirimler"
            onPress={() => setFilter('push')}
          />
        </ScrollView>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator
              size="large"
              color={COLORS.primary}
            />
            <Text style={styles.stateText}>
              Geçmiş yükleniyor...
            </Text>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>
              Geçmiş yüklenemedi
            </Text>

            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        ) : null}

        {!loading &&
        !error &&
        filteredItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>
              Geçmiş kaydı bulunamadı
            </Text>

            <Text style={styles.emptyText}>
              Arama veya filtre kriterlerini değiştirerek tekrar deneyin.
            </Text>
          </View>
        ) : null}

        {!loading &&
          !error &&
          groups.map((group) => (
            <View
              key={group.title}
              style={styles.group}
            >
              <Text style={styles.groupTitle}>
                {group.title}
              </Text>

              <View style={styles.groupItems}>
                {group.items.map((item) => (
                  <HistoryCard
                    key={item.history.id}
                    item={item}
                  />
                ))}
              </View>
            </View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterButton({
  active,
  label,
  onPress,
}: {
  readonly active: boolean;
  readonly label: string;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterButton,
        active && styles.filterButtonActive,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.filterText,
          active && styles.filterTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function HistoryCard({
  item,
}: {
  readonly item: HistoryItem;
}) {
  const router = useRouter();

  const { history, reminder } = item;

  const isVoiceCall = history.type === 'voice-call';
  const isDanger =
    history.status === 'missed' ||
    history.status === 'failed';

  const openReminder = () => {
    if (!reminder) {
      return;
    }

    router.push({
      pathname: '/reminders/[id]',
      params: {
        id: reminder.id,
      },
    });
  };

  return (
    <Pressable
      onPress={openReminder}
      disabled={!reminder}
      style={({ pressed }) => [
        styles.card,
        pressed && reminder ? styles.cardPressed : null,
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          isDanger && styles.iconCircleDanger,
        ]}
      >
        <Text
          style={[
            styles.iconText,
            isDanger && styles.iconTextDanger,
          ]}
        >
          {isVoiceCall ? '☎' : '◉'}
        </Text>
      </View>

      <View style={styles.cardContent}>
        <Text
          numberOfLines={1}
          style={styles.cardTitle}
        >
          {reminder?.title ??
            history.userMessage ??
            (isVoiceCall
              ? 'Sesli Arama'
              : 'Bildirim')}
        </Text>

        <Text
          numberOfLines={2}
          style={styles.cardDescription}
        >
          {getDescription(history, reminder)}
        </Text>
      </View>

      <View style={styles.cardRight}>
        <Text style={styles.time}>
          {formatTime(history.sentAt)}
        </Text>

        <StatusBadge status={history.status} />
      </View>
    </Pressable>
  );
}

function StatusBadge({
  status,
}: {
  readonly status: ReminderHistory['status'];
}) {
  const isDanger =
    status === 'missed' ||
    status === 'failed';

  return (
    <View
      style={[
        styles.statusBadge,
        isDanger
          ? styles.statusBadgeDanger
          : styles.statusBadgeSuccess,
      ]}
    >
      <Text
        style={[
          styles.statusText,
          isDanger
            ? styles.statusTextDanger
            : styles.statusTextSuccess,
        ]}
      >
        {formatStatus(status)}
      </Text>
    </View>
  );
}

function getDescription(
  history: ReminderHistory,
  reminder?: Reminder,
): string {
  if (history.userMessage) {
    return history.userMessage;
  }

  if (history.type === 'voice-call') {
    if (history.status === 'missed') {
      return 'Cevapsız Sesli Arama';
    }

    if (history.status === 'answered') {
      return 'Gerçekleşen Sesli Arama';
    }

    return 'Sesli Arama';
  }

  return (
    reminder?.description ??
    'Hatırlatıcı bildirimi'
  );
}

function formatStatus(
  status: ReminderHistory['status'],
): string {
  switch (status) {
    case 'pending':
      return 'Bekliyor';

    case 'sent':
      return 'Gönderildi';

    case 'delivered':
      return 'İletildi';

    case 'answered':
      return 'Cevaplandı';

    case 'missed':
      return 'Cevapsız';

    case 'failed':
      return 'Başarısız';

    default:
      return status;
  }
}

function formatTime(value?: string): string {
  if (!value) {
    return '--:--';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }

  return new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function groupHistoryByDate(
  items: readonly HistoryItem[],
): readonly {
  readonly title: string;
  readonly items: readonly HistoryItem[];
}[] {
  const groups = new Map<string, HistoryItem[]>();

  for (const item of items) {
    const title = formatGroupDate(
      item.history.sentAt,
    );

    const current = groups.get(title) ?? [];

    current.push(item);
    groups.set(title, current);
  }

  return Array.from(groups.entries()).map(
    ([title, groupItems]) => ({
      title,
      items: groupItems,
    }),
  );
}

function formatGroupDate(value?: string): string {
  if (!value) {
    return 'DİĞER';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'DİĞER';
  }

  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) {
    return 'BUGÜN';
  }

  if (isSameDay(date, yesterday)) {
    return 'DÜN';
  }

  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'long',
  })
    .format(date)
    .toLocaleUpperCase('tr-TR');
}

function isSameDay(
  left: Date,
  right: Date,
): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

const COLORS = {
  background: '#F6F9F7',
  card: '#FFFFFF',

  primary: '#0D5C49',
  primarySoft: '#EAF5F1',

  text: '#17231F',
  textSecondary: '#65716C',
  textMuted: '#929B97',

  border: '#E2E9E5',

  success: '#197357',
  successSoft: '#ECF8F3',

  danger: '#D74343',
  dangerSoft: '#FDEEEE',
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 20,
  },

  title: {
    color: COLORS.primary,
    fontSize: 30,
    fontWeight: '800',
  },

  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
  },

  searchBox: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    elevation: 2,
  },

  searchIcon: {
    color: COLORS.textMuted,
    fontSize: 22,
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
  },

  filters: {
    gap: 10,
    paddingVertical: 20,
  },

  filterButton: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: COLORS.primarySoft,
  },

  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },

  filterText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },

  filterTextActive: {
    color: '#FFFFFF',
  },

  pressed: {
    opacity: 0.75,
  },

  group: {
    marginTop: 8,
    marginBottom: 22,
  },

  groupTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  groupItems: {
    gap: 10,
  },

  card: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    elevation: 1,
  },

  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
    marginRight: 12,
  },

  iconCircleDanger: {
    backgroundColor: COLORS.dangerSoft,
  },

  iconText: {
    color: COLORS.primary,
    fontSize: 19,
    fontWeight: '700',
  },

  iconTextDanger: {
    color: COLORS.danger,
  },
  cardPressed: {
  opacity: 0.7,
},
  cardContent: {
    flex: 1,
    paddingRight: 10,
  },

  cardTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },

  cardDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },

  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 58,
  },

  time: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },

  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  statusBadgeSuccess: {
    backgroundColor: COLORS.successSoft,
  },

  statusBadgeDanger: {
    backgroundColor: COLORS.dangerSoft,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  statusTextSuccess: {
    color: COLORS.success,
  },

  statusTextDanger: {
    color: COLORS.danger,
  },

  centerState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },

  stateText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  errorBox: {
    backgroundColor: COLORS.dangerSoft,
    borderRadius: 16,
    padding: 20,
  },

  errorTitle: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: '700',
  },

  errorText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },

  emptyBox: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 30,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
  },

  emptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
});