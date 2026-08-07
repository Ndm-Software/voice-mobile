import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { GetPreferences, UpdatePreferences } from '@/application/user';
import type { GetLanguages } from '@/application/language';
import { useSession } from '@/application/session';
import {
  Button,
  Card,
  Chip,
  Screen,
  StateView,
  SwitchRow,
  TextField,
  useToast,
} from '@/components';
import { UserRequestError } from '@/domain/repositories/user-repository';
import { type AppTheme, useTheme } from '@/core/theme';

interface PreferencesScreenProps {
  readonly getLanguages: GetLanguages;
  readonly getPreferences: GetPreferences;
  readonly updatePreferences: UpdatePreferences;
}

export function PreferencesScreen({
  getLanguages,
  getPreferences,
  updatePreferences,
}: PreferencesScreenProps) {
  const { session } = useSession();
  const { showToast } = useToast();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [languageId, setLanguageId] = useState('1');
  const [languages, setLanguages] = useState<readonly { id: string; name: string }[]>([]);
  const [timezone, setTimezone] = useState('Europe/Istanbul');
  const [province, setProvince] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [pushMinutes, setPushMinutes] = useState('15');
  const [callMinutes, setCallMinutes] = useState('10');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([getPreferences.execute(session?.userId ?? ''), getLanguages.execute()]).then(
      ([value, availableLanguages]) => {
        if (!active) return;
        setLanguageId(value.languageId);
        setTimezone(value.timezone);
        setProvince(value.province ?? '');
        setNotificationsEnabled(value.notificationsEnabled);
        setPushMinutes(String(value.defaultPushBeforeMinutes));
        setCallMinutes(String(value.defaultCallBeforeMinutes));
        setLanguages(availableLanguages.map(({ id, name }) => ({ id, name })));
        setLoading(false);
      },
      () => {
        if (active) setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, [getLanguages, getPreferences, session?.userId]);

  async function handleSave() {
    if (!session || saving) return;
    setSaving(true);
    setErrors({});
    try {
      await updatePreferences.execute(session.userId, {
        languageId,
        timezone,
        province,
        notificationsEnabled,
        defaultPushBeforeMinutes: Number(pushMinutes),
        defaultCallBeforeMinutes: Number(callMinutes),
      });
      showToast('Tercihlerin kaydedildi.', { variant: 'success' });
    } catch (error) {
      setErrors(
        error instanceof UserRequestError
          ? error.fieldErrors
          : { form: 'Tercihler kaydedilemedi.' },
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <Screen title="Dil ve tercihler">
        <StateView variant="loading" />
      </Screen>
    );

  return (
    <Screen
      description="Dil, timezone ve varsayılan hatırlatma sürelerini seç."
      title="Dil ve tercihler"
    >
      <Card
        description="Asistanın bildirim ve arama tercihlerini buradan yönet."
        title="Dil"
        variant="outlined"
      >
        <View style={styles.chips}>
          {languages.map((language) => (
            <Chip
              key={language.id}
              label={language.name}
              onPress={() => setLanguageId(language.id)}
              selected={language.id === languageId}
            />
          ))}
        </View>
      </Card>
      <Card title="Bölge ve zaman" variant="outlined">
        <View style={styles.form}>
          <TextField
            editable={!saving}
            error={errors.timezone}
            label="Timezone"
            onChangeText={setTimezone}
            value={timezone}
          />
          <TextField editable={!saving} label="Şehir" onChangeText={setProvince} value={province} />
        </View>
      </Card>
      <Card title="Varsayılan süreler" variant="outlined">
        <View style={styles.form}>
          <TextField
            editable={!saving}
            error={errors.defaultPushBeforeMinutes}
            keyboardType="number-pad"
            label="Bildirim öncesi (dakika)"
            onChangeText={setPushMinutes}
            value={pushMinutes}
          />
          <TextField
            editable={!saving}
            error={errors.defaultCallBeforeMinutes}
            keyboardType="number-pad"
            label="Arama öncesi (dakika)"
            onChangeText={setCallMinutes}
            value={callMinutes}
          />
          <SwitchRow
            description="Hatırlatıcı bildirimlerini al"
            disabled={saving}
            label="Bildirimler"
            onValueChange={setNotificationsEnabled}
            value={notificationsEnabled}
          />
          <Button
            fullWidth
            label="Tercihleri kaydet"
            loading={saving}
            onPress={() => void handleSave()}
          />
        </View>
      </Card>
    </Screen>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    form: { gap: theme.spacing.lg },
  });
}
