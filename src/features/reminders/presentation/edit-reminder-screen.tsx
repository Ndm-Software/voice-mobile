import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { UpdateReminder } from '@/application/reminder';
import {
  AppIcon,
  AppModal,
  Badge,
  Button,
  Card,
  Chip,
  Screen,
  SwitchRow,
  TextField,
  useToast,
} from '@/components';
import { routes } from '@/config/routes';
import { type AppTheme, useTheme } from '@/core/theme';
import type { Reminder, ReminderRepeatType } from '@/domain/models/reminder';
import { ReminderRequestError } from '@/domain/repositories/reminder-repository';

interface EditReminderScreenProps {
  readonly reminder: Reminder;
  readonly updateReminder: UpdateReminder;
}

interface FormErrors {
  readonly title?: string;
  readonly date?: string;
  readonly time?: string;
  readonly form?: string;
}

type PickerMode = 'date' | 'time' | 'repeat-until';

const repeatOptions: readonly { label: string; value: ReminderRepeatType }[] = [
  { label: 'Tekrarlanmaz', value: 'none' },
  { label: 'Her gün', value: 'daily' },
  { label: 'Her hafta', value: 'weekly' },
  { label: 'Her ay', value: 'monthly' },
];

export function EditReminderScreen({ reminder, updateReminder }: EditReminderScreenProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const initialDate = useMemo(() => new Date(reminder.eventDateTime), [reminder.eventDateTime]);
  const [title, setTitle] = useState(reminder.title);
  const [description, setDescription] = useState(reminder.description ?? '');
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedTime, setSelectedTime] = useState(initialDate);
  const [repeatType, setRepeatType] = useState<ReminderRepeatType>(reminder.repeatType);
  const [repeatUntil, setRepeatUntil] = useState<Date | null>(
    reminder.repeatUntil ? new Date(reminder.repeatUntil) : null,
  );
  const [pickerMode, setPickerMode] = useState<PickerMode | null>(null);
  const [urgent, setUrgent] = useState(reminder.urgent);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (loading) return;

    const nextErrors: FormErrors = {
      title: title.trim() ? undefined : 'Başlık zorunludur.',
      date: Number.isNaN(selectedDate.getTime()) ? 'Tarih seçin.' : undefined,
      time: Number.isNaN(selectedTime.getTime()) ? 'Saat seçin.' : undefined,
    };
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      await updateReminder.execute({
        id: reminder.id,
        userId: reminder.userId,
        title,
        description,
        eventDateTime: combineDateTime(selectedDate, selectedTime),
        urgent,
        repeatType,
        ...(repeatType !== 'none' && repeatUntil ? { repeatUntil: repeatUntil.toISOString() } : {}),
      });
      showToast('Hatırlatıcı güncellendi.', { variant: 'success' });
      router.replace(routes.reminderDetails(reminder.id));
    } catch (error) {
      if (error instanceof ReminderRequestError) {
        setErrors({
          form: error.message,
          title: error.fieldErrors.title,
          date: error.fieldErrors.eventDateTime,
        });
      } else {
        setErrors({ form: 'Hatırlatıcı güncellenemedi. Lütfen tekrar deneyin.' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen
      description="Hatırlatıcının temel bilgilerini güvenle güncelle."
      title="Hatırlatıcıyı düzenle"
    >
      <Card variant="outlined">
        {errors.form ? <Badge label={errors.form} variant="danger" /> : null}
        <View style={styles.fields}>
          <TextField
            autoCapitalize="sentences"
            editable={!loading}
            error={errors.title}
            label="Başlık"
            maxLength={255}
            onChangeText={(value) => {
              setTitle(value);
              setErrors((current) => ({ ...current, title: undefined, form: undefined }));
            }}
            value={title}
          />
          <TextField
            editable={!loading}
            helperText="İsteğe bağlı"
            label="Açıklama"
            multiline
            numberOfLines={4}
            onChangeText={setDescription}
            value={description}
          />
          <View style={styles.row}>
            <View style={styles.halfField}>
              <PickerField
                disabled={loading}
                error={errors.date}
                icon="calendar"
                label="Tarih"
                onPress={() => setPickerMode('date')}
                value={formatDate(selectedDate)}
              />
            </View>
            <View style={styles.halfField}>
              <PickerField
                disabled={loading}
                error={errors.time}
                icon="clock"
                label="Saat"
                onPress={() => setPickerMode('time')}
                value={formatTime(selectedTime)}
              />
            </View>
          </View>
          <SwitchRow
            description="Önemli hatırlatıcı olarak işaretle."
            disabled={loading}
            label="Önemli hatırlatıcı"
            onValueChange={setUrgent}
            value={urgent}
          />
          <Card
            description="Günlük, haftalık veya aylık basit tekrar kuralını düzenle."
            title="Tekrar"
            variant="outlined"
          >
            <View style={styles.notificationSection}>
              <View style={styles.chips}>
                {repeatOptions.map((option) => (
                  <Chip
                    disabled={loading}
                    key={option.value}
                    label={option.label}
                    onPress={() => {
                      setRepeatType(option.value);
                      if (option.value === 'none') setRepeatUntil(null);
                    }}
                    selected={repeatType === option.value}
                  />
                ))}
              </View>
              {repeatType !== 'none' ? (
                <PickerField
                  disabled={loading}
                  icon="calendar"
                  label="Tekrar bitişi (isteğe bağlı)"
                  onPress={() => setPickerMode('repeat-until')}
                  value={repeatUntil ? formatDate(repeatUntil) : 'Bitiş tarihi seç'}
                />
              ) : null}
            </View>
          </Card>
          <Card
            description="Push ve sesli arama tercihlerin korunur. Bu ayarlar bildirim yönetimi ekranında ayrıca düzenlenecek."
            title="Bildirim tercihleri"
            variant="soft"
          >
            <Text style={styles.notificationSummary}>{formatNotificationSummary(reminder)}</Text>
          </Card>
          <Button
            fullWidth
            label="Değişiklikleri kaydet"
            loading={loading}
            onPress={() => void handleSubmit()}
          />
        </View>
      </Card>
      {pickerMode ? (
        <AppModal
          onClose={() => setPickerMode(null)}
          title={
            pickerMode === 'date'
              ? 'Tarih seç'
              : pickerMode === 'time'
                ? 'Saat seç'
                : 'Tekrar bitişi seç'
          }
          visible
        >
          <DateTimePicker
            accentColor={theme.colors.primary}
            display="default"
            is24Hour
            minimumDate={
              pickerMode === 'date'
                ? new Date()
                : pickerMode === 'repeat-until'
                  ? selectedDate
                  : undefined
            }
            mode={pickerMode === 'repeat-until' ? 'date' : pickerMode}
            negativeButton={{ label: 'Vazgeç' }}
            onDismiss={() => setPickerMode(null)}
            onValueChange={(_, value) => {
              const nextValue = new Date(value);
              if (pickerMode === 'date') setSelectedDate(nextValue);
              else if (pickerMode === 'time') setSelectedTime(nextValue);
              else setRepeatUntil(nextValue);
              setErrors((current) => ({
                ...current,
                date: undefined,
                time: undefined,
                form: undefined,
              }));
              setPickerMode(null);
            }}
            positiveButton={{ label: 'Tamam' }}
            presentation="dialog"
            value={
              pickerMode === 'date'
                ? selectedDate
                : pickerMode === 'time'
                  ? selectedTime
                  : (repeatUntil ?? selectedDate)
            }
          />
        </AppModal>
      ) : null}
    </Screen>
  );
}

function combineDateTime(date: Date, time: Date): string {
  const combined = new Date(date);
  combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return combined.toISOString();
}

function formatDate(value: Date): string {
  return value.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatTime(value: Date): string {
  return value.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function formatNotificationSummary(reminder: Reminder): string {
  const pushCount = reminder.pushSettings.filter((setting) => setting.enabled).length;
  const voiceEnabled = reminder.voiceCallSetting?.enabled === true;
  if (pushCount === 0 && !voiceEnabled) return 'Bildirim veya sesli arama kapalı.';
  return `${pushCount} push bildirimi${voiceEnabled ? ' • Sesli arama açık' : ''}`;
}

interface PickerFieldProps {
  readonly disabled: boolean;
  readonly error?: string;
  readonly icon: 'calendar' | 'clock';
  readonly label: string;
  readonly onPress: () => void;
  readonly value: string;
}

function PickerField({ disabled, error, icon, label, onPress, value }: PickerFieldProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.pickerWrapper}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [styles.pickerButton, pressed && styles.pickerButtonPressed]}
      >
        <AppIcon color={theme.colors.primary} name={icon} size={theme.sizes.icon.md} />
        <Text style={styles.pickerValue}>{value}</Text>
      </Pressable>
      {error ? <Text style={styles.pickerError}>{error}</Text> : null}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    fields: { gap: theme.spacing.lg },
    notificationSection: { gap: theme.spacing.md },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    row: { flexDirection: 'row', gap: theme.spacing.md },
    halfField: { flex: 1 },
    notificationSummary: { color: theme.colors.textSecondary, ...theme.typography.bodySmall },
    pickerWrapper: { gap: theme.spacing.sm },
    pickerLabel: { color: theme.colors.textPrimary, ...theme.typography.label },
    pickerButton: {
      minHeight: theme.sizes.inputHeight,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surface,
    },
    pickerButtonPressed: {
      borderColor: theme.colors.accentStrong,
      backgroundColor: theme.colors.primarySoft,
    },
    pickerValue: { flex: 1, color: theme.colors.textPrimary, ...theme.typography.body },
    pickerError: { color: theme.colors.danger, ...theme.typography.caption },
  });
}
