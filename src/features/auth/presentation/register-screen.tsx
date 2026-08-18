import { useRouter } from 'expo-router';
import { useState } from 'react';

import type { Register } from '@/application/auth';
import { usePendingRegistration } from '@/application/auth';
import { useSession } from '@/application/session';
import { Badge, Button, Screen, TextField } from '@/components';
import { routes } from '@/config/routes';
import type { AuthFieldErrors } from '@/domain/repositories/auth-repository';

import { getAuthFieldErrors } from './auth-error';
import { AuthScreenCard } from './auth-screen-card';

interface RegisterScreenProps {
  readonly register: Register;
}

export function RegisterScreen({ register }: RegisterScreenProps) {
  const router = useRouter();
  const { signIn } = useSession();
  const { startPendingRegistration } = usePendingRegistration();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<AuthFieldErrors>({});

  async function handleRegister() {
    if (loading) {
      return;
    }
    setLoading(true);
    setErrors({});

    try {
      const result = await register.execute(
        firstName,
        lastName,
        email,
        phoneNumber,
        password,
        passwordConfirmation,
      );
      if (result.kind === 'authenticated') {
        await signIn(result.session);
      } else {
        startPendingRegistration(result.pending);
        router.replace(routes.verifyPhone);
      }
    } catch (error) {
      setErrors(getAuthFieldErrors(error));
    } finally {
      setLoading(false);
    }
  }

  function clearField(
    field: keyof AuthFieldErrors,
    setter: (value: string) => void,
    value: string,
  ) {
    setter(value);
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  }

  return (
    <Screen description="Voia kişisel asistanını hesabınla kullanmaya başla." title="Kayıt ol">
      {/* Veri kaynağı ve entegrasyon durumu ürün arayüzünde gösterilmez. */}
      <AuthScreenCard>
        {errors.form ? <Badge label={errors.form} variant="danger" /> : null}
        <TextField
          autoCapitalize="words"
          editable={!loading}
          error={errors.firstName}
          label="Ad"
          onChangeText={(value) => clearField('firstName', setFirstName, value)}
          placeholder="Uğur"
          returnKeyType="next"
          value={firstName}
        />
        <TextField
          autoCapitalize="words"
          editable={!loading}
          error={errors.lastName}
          label="Soyad"
          onChangeText={(value) => clearField('lastName', setLastName, value)}
          placeholder="Yılmaz"
          returnKeyType="next"
          value={lastName}
        />
        <TextField
          autoCapitalize="none"
          autoComplete="email"
          editable={!loading}
          error={errors.email}
          keyboardType="email-address"
          label="E-posta adresi"
          onChangeText={(value) => clearField('email', setEmail, value)}
          placeholder="isim@example.com"
          returnKeyType="next"
          value={email}
        />
        <TextField
          autoComplete="tel"
          editable={!loading}
          error={errors.phoneNumber}
          keyboardType="phone-pad"
          label="Telefon numarası"
          onChangeText={(value) => clearField('phoneNumber', setPhoneNumber, value)}
          placeholder="+90 555 111 22 33"
          returnKeyType="next"
          value={phoneNumber}
        />
        <TextField
          autoComplete="new-password"
          editable={!loading}
          error={errors.password}
          helperText="En az 8 karakter; büyük harf, küçük harf ve rakam içermeli."
          label="Şifre"
          onChangeText={(value) => clearField('password', setPassword, value)}
          onTrailingPress={() => setPasswordVisible((visible) => !visible)}
          placeholder="Güçlü bir şifre girin"
          secureTextEntry={!passwordVisible}
          trailingAccessibilityLabel={passwordVisible ? 'Şifreyi gizle' : 'Şifreyi göster'}
          trailingIcon={passwordVisible ? 'eye-off' : 'eye'}
          value={password}
        />
        <TextField
          autoComplete="new-password"
          editable={!loading}
          error={errors.passwordConfirmation}
          label="Şifre tekrar"
          onChangeText={(value) =>
            clearField('passwordConfirmation', setPasswordConfirmation, value)
          }
          onSubmitEditing={() => void handleRegister()}
          returnKeyType="done"
          secureTextEntry={!passwordVisible}
          value={passwordConfirmation}
        />
        <Button
          fullWidth
          label="Kayıt ol"
          loading={loading}
          onPress={() => void handleRegister()}
        />
        <Button
          disabled={loading}
          fullWidth
          label="Zaten hesabın var mı? Giriş yap"
          onPress={() => router.replace(routes.login)}
          variant="ghost"
        />
      </AuthScreenCard>
    </Screen>
  );
}
