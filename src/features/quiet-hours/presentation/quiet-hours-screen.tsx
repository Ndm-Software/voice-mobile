import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import type {
  ApplyQuietHoursToAllDays,
  DeleteQuietHour,
  GetQuietHours,
  SaveQuietHour,
} from '@/application/quiet-hours';
import { useSession } from '@/application/session';
import type { GetPreferences } from '@/application/user';
import { AppIcon, AppModal, Badge, Button, Card, Screen, StateView, useToast } from '@/components';
import { type AppTheme, useTheme } from '@/core/theme';
import { quietHourDays, type QuietHour, type QuietHourDay } from '@/domain/models/quiet-hour';
import { QuietHoursRequestError } from '@/domain/repositories/quiet-hours-repository';

interface QuietHoursScreenProps {
  readonly applyQuietHoursToAllDays: ApplyQuietHoursToAllDays;
  readonly deleteQuietHour: DeleteQuietHour;
  readonly getPreferences: GetPreferences;
  readonly getQuietHours: GetQuietHours;
  readonly saveQuietHour: SaveQuietHour;
}

type PickerTarget = 'start' | 'end';

const dayLabels: Record<QuietHourDay, string> = {
  monday: 'Pazartesi',
  tuesday: 'Salı',
  wednesday: 'Çarşamba',
  thursday: 'Perşembe',
  friday: 'Cuma',
  saturday: 'Cumartesi',
  sunday: 'Pazar',
};

export function QuietHoursScreen({
  applyQuietHoursToAllDays,
  deleteQuietHour,
  getPreferences,
  getQuietHours,
  saveQuietHour,
}: QuietHoursScreenProps) {
  const { session } = useSession();
  const { showToast } = useToast();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [records, setRecords] = useState<readonly QuietHour[]>([]);
  const [timezone, setTimezone] = useState(resolveDeviceTimezone);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedDay, setSelectedDay] = useState<QuietHourDay | null>(null);
  const [start, setStart] = useState('23:00');
  const [end, setEnd] = useState('07:00');
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    if (!session) return;
    setLoading(true);
    setError(false);
    const [quietHoursResult, preferencesResult] = await Promise.allSettled([
      getQuietHours.execute(session.userId),
      getPreferences.execute(session.userId),
    ]);
    if (quietHoursResult.status === 'fulfilled') {
      setRecords(quietHoursResult.value);
    } else {
      setError(true);
    }
    if (preferencesResult.status === 'fulfilled') {
      setTimezone(preferencesResult.value.timezone);
    }
    setLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(load);
    // Kullanıcı değiştiğinde veriler yeniden alınır; use-case nesneleri uygulama boyunca sabittir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.userId]);

  function openEditor(day: QuietHourDay) {
    const existing = records.find((record) => record.dayOfWeek === day);
    setSelectedDay(day);
    setStart(existing?.start ?? '23:00');
    setEnd(existing?.end ?? '07:00');
    setFormError(null);
  }

  function closeEditor() {
    if (saving) return;
    setSelectedDay(null);
    setPickerTarget(null);
    setFormError(null);
  }

  async function saveCurrentDay() {
    if (!session || !selectedDay || saving) return;
    const existing = records.find((record) => record.dayOfWeek === selectedDay);
    setSaving(true);
    setFormError(null);
    try {
      const saved = await saveQuietHour.execute(session.userId, {
        id: existing?.id,
        dayOfWeek: selectedDay,
        start,
        end,
      });
      setRecords((current) =>
        sortRecords([...current.filter((item) => item.id !== saved.id), saved]),
      );
      setSelectedDay(null);
      showToast(`${dayLabels[selectedDay]} sessiz saatleri kaydedildi.`, { variant: 'success' });
    } catch (caught) {
      setFormError(getErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function applyToAllDays() {
    if (!session || !selectedDay || saving) return;
    setSaving(true);
    setFormError(null);
    try {
      const saved = await applyQuietHoursToAllDays.execute(session.userId, records, start, end);
      setRecords(saved);
      setSelectedDay(null);
      showToast('Saat aralığı tüm günlere uygulandı.', { variant: 'success' });
    } catch (caught) {
      setFormError(getErrorMessage(caught));
      await load();
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(record: QuietHour) {
    Alert.alert(
      'Sessiz saati kaldır',
      `${dayLabels[record.dayOfWeek]} için belirlenen saat aralığı kaldırılsın mı?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: () => void removeRecord(record),
        },
      ],
    );
  }

  async function removeRecord(record: QuietHour) {
    if (!session || saving) return;
    setSaving(true);
    try {
      await deleteQuietHour.execute(session.userId, record.id);
      setRecords((current) => current.filter((item) => item.id !== record.id));
      setSelectedDay(null);
      showToast(`${dayLabels[record.dayOfWeek]} sessiz saati kaldırıldı.`, {
        variant: 'success',
      });
    } catch (caught) {
      setFormError(getErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen title="Sessiz saatler">
        <StateView variant="loading" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen title="Sessiz saatler">
        <StateView
          description="Sessiz saat tercihlerin şu anda alınamadı."
          onAction={() => void load()}
          variant="error"
        />
      </Screen>
    );
  }

  return (
    <Screen
      description="Rahatsız edilmeyeceğin saat aralıklarını günlere göre belirle."
      title="Sessiz saatler"
    >
      <Card description={`Saatler ${timezone} zaman dilimine göre kaydedilir.`} variant="soft">
        <View style={styles.timezoneRow}>
          <AppIcon color={theme.colors.primary} name="clock" size={theme.sizes.icon.sm} />
          <Text style={styles.timezone}>{timezone}</Text>
        </View>
      </Card>

      <View style={styles.days}>
        {quietHourDays.map((day) => {
          const record = records.find((item) => item.dayOfWeek === day);
          return (
            <Pressable
              accessibilityHint="Sessiz saat aralığını düzenler"
              accessibilityRole="button"
              key={day}
              onPress={() => openEditor(day)}
              style={({ pressed }) => [styles.dayCard, pressed && styles.dayCardPressed]}
            >
              <View style={styles.dayCopy}>
                <Text style={styles.dayLabel}>{dayLabels[day]}</Text>
                <Text style={record ? styles.range : styles.emptyRange}>
                  {record ? `${record.start} – ${record.end}` : 'Ayarlanmadı'}
                </Text>
              </View>
              {record ? <Badge label="Etkin" variant="accent" /> : null}
              <AppIcon color={theme.colors.textMuted} name="chevron-right" size={18} />
            </Pressable>
          );
        })}
      </View>

      <Card
        description="Bitiş saati başlangıçtan erkense aralık ertesi güne uzanır. Örneğin 23:00–07:00 gece boyunca geçerlidir."
        title="Gece aralıkları"
        variant="outlined"
      />

      {selectedDay ? (
        <AppModal onClose={closeEditor} title={dayLabels[selectedDay]} visible>
          <View style={styles.editor}>
            {formError ? <Badge label={formError} variant="danger" /> : null}
            <View style={styles.timeFields}>
              <TimeField
                disabled={saving}
                label="Başlangıç"
                onPress={() => setPickerTarget('start')}
                value={start}
              />
              <TimeField
                disabled={saving}
                label="Bitiş"
                onPress={() => setPickerTarget('end')}
                value={end}
              />
            </View>
            <Text style={styles.editorHint}>
              Seçilen saatler {timezone} zaman dilimini kullanır.
            </Text>
            <Button
              fullWidth
              label="Bu güne kaydet"
              loading={saving}
              onPress={() => void saveCurrentDay()}
            />
            <Button
              disabled={saving}
              fullWidth
              label="Tüm günlere uygula"
              onPress={() => void applyToAllDays()}
              variant="secondary"
            />
            {records.some((record) => record.dayOfWeek === selectedDay) ? (
              <Button
                disabled={saving}
                fullWidth
                label="Bu günü kaldır"
                onPress={() => {
                  const record = records.find((item) => item.dayOfWeek === selectedDay);
                  if (record) confirmDelete(record);
                }}
                variant="ghost"
              />
            ) : null}
          </View>
        </AppModal>
      ) : null}

      {pickerTarget ? (
        <AppModal
          onClose={() => setPickerTarget(null)}
          title={pickerTarget === 'start' ? 'Başlangıç saati' : 'Bitiş saati'}
          visible
        >
          <DateTimePicker
            accentColor={theme.colors.primary}
            display="default"
            is24Hour
            mode="time"
            negativeButton={{ label: 'Vazgeç' }}
            onDismiss={() => setPickerTarget(null)}
            onValueChange={(_, value) => {
              const formatted = formatTime(new Date(value));
              if (pickerTarget === 'start') setStart(formatted);
              else setEnd(formatted);
              setPickerTarget(null);
              setFormError(null);
            }}
            positiveButton={{ label: 'Tamam' }}
            presentation="dialog"
            value={parseTime(pickerTarget === 'start' ? start : end)}
          />
        </AppModal>
      ) : null}
    </Screen>
  );
}

interface TimeFieldProps {
  readonly disabled: boolean;
  readonly label: string;
  readonly onPress: () => void;
  readonly value: string;
}

function TimeField({ disabled, label, onPress, value }: TimeFieldProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={styles.timeField}
    >
      <Text style={styles.timeFieldLabel}>{label}</Text>
      <View style={styles.timeFieldValueRow}>
        <AppIcon color={theme.colors.primary} name="clock" size={18} />
        <Text style={styles.timeFieldValue}>{value}</Text>
      </View>
    </Pressable>
  );
}

function resolveDeviceTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Istanbul';
}

function parseTime(value: string): Date {
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatTime(value: Date): string {
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}

function sortRecords(records: readonly QuietHour[]): readonly QuietHour[] {
  return [...records].sort(
    (left, right) => quietHourDays.indexOf(left.dayOfWeek) - quietHourDays.indexOf(right.dayOfWeek),
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof QuietHoursRequestError
    ? error.message
    : 'Sessiz saat işlemi tamamlanamadı. Lütfen tekrar deneyin.';
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    timezoneRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    timezone: { color: theme.colors.primary, ...theme.typography.cardTitle },
    days: { gap: theme.spacing.sm, marginVertical: theme.spacing.lg },
    dayCard: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.lg,
      backgroundColor: theme.colors.surface,
    },
    dayCardPressed: { backgroundColor: theme.colors.primarySoft },
    dayCopy: { flex: 1 },
    dayLabel: { color: theme.colors.textPrimary, ...theme.typography.cardTitle },
    range: { color: theme.colors.primary, ...theme.typography.bodySmall, marginTop: 2 },
    emptyRange: { color: theme.colors.textMuted, ...theme.typography.bodySmall, marginTop: 2 },
    editor: { gap: theme.spacing.lg },
    timeFields: { flexDirection: 'row', gap: theme.spacing.md },
    timeField: {
      flex: 1,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surface,
    },
    timeFieldLabel: { color: theme.colors.textSecondary, ...theme.typography.caption },
    timeFieldValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    timeFieldValue: { color: theme.colors.textPrimary, ...theme.typography.sectionTitle },
    editorHint: { color: theme.colors.textSecondary, ...theme.typography.bodySmall },
  });
}
