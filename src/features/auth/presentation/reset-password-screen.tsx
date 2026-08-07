import { useRouter } from 'expo-router';
import { useState } from 'react';

import type { ResetPassword } from '@/application/auth';
import { Badge, Button, Screen, TextField, useToast } from '@/components';
import { routes } from '@/config/routes';
import type { AuthFieldErrors } from '@/domain/repositories/auth-repository';

import { getAuthFieldErrors } from './auth-error';
import { AuthScreenCard } from './auth-screen-card';

interface ResetPasswordScreenProps {
  readonly resetPassword: ResetPassword;
  readonly token: string;
}

export function ResetPasswordScreen({ resetPassword, token }: ResetPasswordScreenProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setErrors({});

    try {
      await resetPassword.execute(token, password, passwordConfirmation);
      showToast('Şifren yenilendi. Yeni şifrenle giriş yapabilirsin.', { variant: 'success' });
      router.replace(routes.login);
    } catch (error) {
      setErrors(getAuthFieldErrors(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen description="Hesabın için güvenli bir yeni şifre belirle." title="Yeni şifre">
      <AuthScreenCard badgeLabel="Tek kullanımlık bağlantı">
        {errors.form ? <Badge label={errors.form} variant="danger" /> : null}
        <TextField
          autoComplete="new-password"
          editable={!loading}
          error={errors.password}
          helperText="En az 8 karakter; büyük harf, küçük harf ve rakam içermeli."
          label="Yeni şifre"
          onChangeText={(value) => {
            setPassword(value);
            setErrors((current) => ({ ...current, password: undefined, form: undefined }));
          }}
          onTrailingPress={() => setPasswordVisible((visible) => !visible)}
          secureTextEntry={!passwordVisible}
          trailingAccessibilityLabel={passwordVisible ? 'Şifreyi gizle' : 'Şifreyi göster'}
          trailingIcon={passwordVisible ? 'eye-off' : 'eye'}
          value={password}
        />
        <TextField
          autoComplete="new-password"
          editable={!loading}
          error={errors.passwordConfirmation}
          label="Yeni şifre tekrar"
          onChangeText={(value) => {
            setPasswordConfirmation(value);
            setErrors((current) => ({
              ...current,
              passwordConfirmation: undefined,
              form: undefined,
            }));
          }}
          onSubmitEditing={() => void handleSubmit()}
          returnKeyType="done"
          secureTextEntry={!passwordVisible}
          value={passwordConfirmation}
        />
        <Button
          disabled={!token}
          fullWidth
          label={token ? 'Şifreyi yenile' : 'Yenileme bağlantısı geçersiz'}
          loading={loading}
          onPress={() => void handleSubmit()}
        />
        {!token ? (
          <Button
            fullWidth
            label="Yeni bağlantı iste"
            onPress={() => router.replace(routes.forgotPassword)}
            variant="ghost"
          />
        ) : null}
      </AuthScreenCard>
    </Screen>
  );
}
