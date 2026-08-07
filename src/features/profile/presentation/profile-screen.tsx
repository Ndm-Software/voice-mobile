import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { GetProfile, UpdateProfile } from '@/application/user';
import { useSession } from '@/application/session';
import { AppIcon, Badge, Button, Card, Screen, StateView, TextField, useToast } from '@/components';
import type { User } from '@/domain/models/account';
import { UserRequestError } from '@/domain/repositories/user-repository';
import { type AppTheme, useTheme } from '@/core/theme';

interface ProfileScreenProps {
  readonly getProfile: GetProfile;
  readonly updateProfile: UpdateProfile;
}

export function ProfileScreen({ getProfile, updateProfile }: ProfileScreenProps) {
  const { session } = useSession();
  const { showToast } = useToast();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [profile, setProfile] = useState<User>();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void getProfile.execute(session?.userId ?? '').then(
      (value) => {
        if (!active) return;
        setProfile(value);
        setFirstName(value.firstName);
        setLastName(value.lastName);
        setEmail(value.email);
        setPhoneNumber(value.phoneNumber);
        setLoading(false);
      },
      () => {
        if (active) setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, [getProfile, session?.userId]);

  async function handleSave() {
    if (!session || saving) return;
    setSaving(true);
    setErrors({});
    try {
      const updated = await updateProfile.execute(session.userId, {
        firstName,
        lastName,
        email,
        phoneNumber,
      });
      setProfile(updated);
      setFirstName(updated.firstName);
      setLastName(updated.lastName);
      setEmail(updated.email);
      setPhoneNumber(updated.phoneNumber);
      showToast('Profilin güncellendi.', { variant: 'success' });
    } catch (error) {
      setErrors(
        error instanceof UserRequestError ? error.fieldErrors : { form: 'Profil güncellenemedi.' },
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen title="Profil">
        <StateView variant="loading" />
      </Screen>
    );
  }

  return (
    <Screen description="Kişisel bilgilerini ve hesap durumunu yönet." title="Profil">
      <Card style={styles.identityCard} variant="soft">
        <View style={styles.avatar}>
          <AppIcon color={theme.colors.primary} name="person" size={theme.sizes.icon.xl} />
        </View>
        <View style={styles.identityCopy}>
          <Badge
            label={profile?.phoneVerified ? 'Telefon doğrulandı' : 'Telefon doğrulaması bekliyor'}
            variant={profile?.phoneVerified ? 'success' : 'warning'}
          />
          <View style={styles.identitySpacer} />
        </View>
      </Card>
      {errors.form ? <Badge label={errors.form} variant="danger" /> : null}
      <Card title="Kişisel bilgiler" variant="outlined">
        <View style={styles.form}>
          <TextField
            editable={!saving}
            error={errors.firstName}
            label="Ad"
            onChangeText={setFirstName}
            value={firstName}
          />
          <TextField
            editable={!saving}
            error={errors.lastName}
            label="Soyad"
            onChangeText={setLastName}
            value={lastName}
          />
          <TextField
            autoCapitalize="none"
            editable={!saving}
            error={errors.email}
            keyboardType="email-address"
            label="E-posta"
            onChangeText={setEmail}
            value={email}
          />
          <TextField
            editable={!saving}
            error={errors.phoneNumber}
            keyboardType="phone-pad"
            label="Telefon"
            onChangeText={setPhoneNumber}
            value={phoneNumber}
          />
          <Button
            fullWidth
            label="Değişiklikleri kaydet"
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
    identityCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg },
    avatar: {
      width: 64,
      height: 64,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radii.full,
      backgroundColor: theme.colors.surface,
    },
    identityCopy: { flex: 1 },
    identitySpacer: { height: theme.spacing.xs },
    form: { gap: theme.spacing.lg },
  });
}
