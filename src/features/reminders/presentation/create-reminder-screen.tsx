import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';

import type { CreateReminder } from '@/application/reminder';
import { useSession } from '@/application/session';
import { AppIcon, AppModal, Badge, Button, Card, Screen, SwitchRow, TextField } from '@/components';
import { routes } from '@/config/routes';
import { type AppTheme, useTheme } from '@/core/theme';
import { ReminderRequestError } from '@/domain/repositories/reminder-repository';

interface CreateReminderScreenProps {
  readonly createReminder: CreateReminder;
}

interface FormErrors {
  readonly title?: string;
  readonly date?: string;
  readonly time?: string;
  readonly form?: string;
}

type PickerMode = 'date' | 'time';

export function CreateReminderScreen({ createReminder }: CreateReminderScreenProps) {
  const router = useRouter();
  const { session } = useSession();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [pickerMode, setPickerMode] = useState<PickerMode | null>(null);
  const [urgent, setUrgent] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit() {
    if (loading || !session) {
      return;
    }

    const eventDateTime = combineDateTime(selectedDate, selectedTime);
    const nextErrors: FormErrors = {
      title: title.trim() ? undefined : 'Başlık zorunludur.',
      date: selectedDate ? undefined : 'Tarih seçin.',
      time: selectedTime ? undefined : 'Saat seçin.',
    };

    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await createReminder.execute({
        userId: session.userId,
        title,
        description,
        eventDateTime: eventDateTime as string,
        urgent,
      });
      setSaved(true);
    } catch (error) {
      if (error instanceof ReminderRequestError) {
        setErrors({
          form: error.message,
          title: error.fieldErrors.title,
          date: error.fieldErrors.eventDateTime,
        });
      } else {
        setErrors({ form: 'Hatırlatıcı kaydedilemedi. Lütfen tekrar deneyin.' });
      }
    } finally {
      setLoading(false);
    }
  }

  if (saved) {
    return (
      <Screen
        description="Hatırlatıcın kaydedildi ve artık takip edilebilir."
        title="Hatırlatıcı hazır"
      >
        <Card style={styles.successCard} variant="soft">
          <Badge label="Kaydedildi" variant="accent" />
          <Text style={styles.successTitle}>{title}</Text>
          <Text style={styles.successDescription}>
            Tarih ve bildirim seçeneklerini daha sonra hatırlatıcı detayından düzenleyebilirsin.
          </Text>
          <Button fullWidth label="Ana sayfaya dön" onPress={() => router.replace(routes.home)} />
          <Button
            fullWidth
            label="Yeni hatırlatıcı oluştur"
            onPress={() => {
              setSaved(false);
              setTitle('');
              setDescription('');
              setSelectedDate(null);
              setSelectedTime(null);
              setUrgent(false);
              setErrors({});
            }}
            variant="secondary"
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      description="Başlık, tarih ve saati belirleyerek gününü planla."
      title="Yeni hatırlatıcı"
    >
      <Card
        description="Hatırlatıcın cihazına kaydedilir ve daha sonra düzenlenebilir."
        variant="soft"
      >
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
            placeholder="Örn. Doktor kontrolü"
            value={title}
          />
          <TextField
            editable={!loading}
            helperText="İsteğe bağlı"
            label="Açıklama"
            multiline
            numberOfLines={4}
            onChangeText={setDescription}
            placeholder="Hatırlatıcıyla ilgili kısa bir not"
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
                value={selectedDate ? formatDate(selectedDate) : 'Tarih seç'}
              />
            </View>
            <View style={styles.halfField}>
              <PickerField
                disabled={loading}
                error={errors.time}
                icon="clock"
                label="Saat"
                onPress={() => setPickerMode('time')}
                value={selectedTime ? formatTime(selectedTime) : 'Saat seç'}
              />
            </View>
          </View>
          <SwitchRow
            description="Önemli hatırlatıcılar ileride sessiz saatleri aşabilecek şekilde işaretlenir."
            disabled={loading}
            label="Önemli hatırlatıcı"
            onValueChange={setUrgent}
            value={urgent}
          />
          <Button
            fullWidth
            label="Hatırlatıcıyı kaydet"
            loading={loading}
            onPress={() => void handleSubmit()}
          />
        </View>
      </Card>
      {pickerMode ? (
        <AppModal
          onClose={() => setPickerMode(null)}
          title={pickerMode === 'date' ? 'Tarih seç' : 'Saat seç'}
          visible
        >
          <DateTimePicker
            accentColor={theme.colors.primary}
            display="default"
            is24Hour
            minimumDate={pickerMode === 'date' ? new Date() : undefined}
            mode={pickerMode}
            negativeButton={{ label: 'Vazgeç' }}
            onDismiss={() => setPickerMode(null)}
            onValueChange={(_, value) => {
              const nextValue = new Date(value);
              const currentMode = pickerMode;
              setPickerMode(null);

              if (currentMode === 'date') {
                setSelectedDate(nextValue);
                setErrors((current) => ({ ...current, date: undefined, form: undefined }));
                if (!selectedTime) {
                  setTimeout(() => setPickerMode('time'), 120);
                }
              } else {
                setSelectedTime(nextValue);
                setErrors((current) => ({ ...current, time: undefined, form: undefined }));
                if (!selectedDate) {
                  setTimeout(() => setPickerMode('date'), 120);
                }
              }
            }}
            positiveButton={{ label: 'Tamam' }}
            presentation="dialog"
            value={getPickerValue(pickerMode, selectedDate, selectedTime)}
          />
        </AppModal>
      ) : null}
    </Screen>
  );
}

function combineDateTime(date: Date | null, time: Date | null): string | undefined {
  if (!date || !time) {
    return undefined;
  }

  const combined = new Date(date);
  combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return combined.toISOString();
}

function getPickerValue(mode: PickerMode, date: Date | null, time: Date | null): Date {
  if (mode === 'date') {
    return date ?? new Date();
  }

  return time ?? date ?? new Date();
}

function formatDate(value: Date): string {
  return value.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(value: Date): string {
  return value.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    fields: {
      gap: theme.spacing.lg,
    },
    row: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    halfField: {
      flex: 1,
    },
    pickerWrapper: {
      gap: theme.spacing.sm,
    },
    pickerLabel: {
      color: theme.colors.textPrimary,
      ...theme.typography.label,
    },
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
    pickerValue: {
      flex: 1,
      color: theme.colors.textPrimary,
      ...theme.typography.body,
    },
    pickerPlaceholder: {
      color: theme.colors.textMuted,
    },
    pickerError: {
      color: theme.colors.danger,
      ...theme.typography.caption,
    },
    successCard: {
      gap: theme.spacing.lg,
    },
    successTitle: {
      color: theme.colors.primary,
      ...theme.typography.sectionTitle,
    },
    successDescription: {
      color: theme.colors.textSecondary,
      ...theme.typography.bodySmall,
    },
  });
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
  const placeholder = value === 'Tarih seç' || value === 'Saat seç';

  return (
    <View style={styles.pickerWrapper}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.pickerButton,
          pressed && !disabled && styles.pickerButtonPressed,
        ]}
      >
        <AppIcon color={theme.colors.primary} name={icon} size={theme.sizes.icon.md} />
        <Text style={[styles.pickerValue, placeholder && styles.pickerPlaceholder]}>{value}</Text>
      </Pressable>
      {error ? <Text style={styles.pickerError}>{error}</Text> : null}
    </View>
  );
}
