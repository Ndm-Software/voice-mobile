import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { CreateReminder } from '@/application/reminder';
import { useSession } from '@/application/session';
import { Badge, Button, Card, Screen, SwitchRow, TextField } from '@/components';
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

export function CreateReminderScreen({ createReminder }: CreateReminderScreenProps) {
  const router = useRouter();
  const { session } = useSession();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const defaults = useMemo(() => getDefaultDateTime(), []);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaults.date);
  const [time, setTime] = useState(defaults.time);
  const [urgent, setUrgent] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit() {
    if (loading || !session) {
      return;
    }

    const parsedDateTime = parseDateTime(date, time);
    const nextErrors: FormErrors = {
      title: title.trim() ? undefined : 'Başlık zorunludur.',
      date: parsedDateTime ? undefined : 'Tarihi YYYY-AA-GG formatında girin.',
      time: parsedDateTime ? undefined : 'Saati SS:DD formatında girin.',
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
        eventDateTime: parsedDateTime as string,
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
              <TextField
                editable={!loading}
                error={errors.date}
                keyboardType="numbers-and-punctuation"
                label="Tarih"
                maxLength={10}
                onChangeText={(value) => {
                  setDate(value);
                  setErrors((current) => ({ ...current, date: undefined, form: undefined }));
                }}
                placeholder="2026-08-20"
                value={date}
              />
            </View>
            <View style={styles.halfField}>
              <TextField
                editable={!loading}
                error={errors.time}
                keyboardType="numbers-and-punctuation"
                label="Saat"
                maxLength={5}
                onChangeText={(value) => {
                  setTime(value);
                  setErrors((current) => ({ ...current, time: undefined, form: undefined }));
                }}
                placeholder="09:30"
                value={time}
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
    </Screen>
  );
}

function parseDateTime(date: string, time: string): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return undefined;
  }

  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const parsed = new Date(year, month - 1, day, hours, minutes, 0, 0);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day ||
    parsed.getHours() !== hours ||
    parsed.getMinutes() !== minutes
  ) {
    return undefined;
  }

  return parsed.toISOString();
}

function getDefaultDateTime(): { readonly date: string; readonly time: string } {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, '0');
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
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
