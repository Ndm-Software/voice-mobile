import { useRouter } from 'expo-router';
import { useState } from 'react';

import type { Login } from '@/application/auth';
import { useSession } from '@/application/session';
import { Badge, Button, Screen, TextField } from '@/components';
import { routes } from '@/config/routes';
import type { AuthFieldErrors } from '@/domain/repositories/auth-repository';

import { getAuthFieldErrors } from './auth-error';
import { AuthScreenCard } from './auth-screen-card';

interface LoginScreenProps {
  readonly login: Login;
}

export function LoginScreen({ login }: LoginScreenProps) {
  const router = useRouter();
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<AuthFieldErrors>({});

  async function handleLogin() {
    if (loading) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const session = await login.execute(email, password);
      await signIn(session);
    } catch (error) {
      setErrors(getAuthFieldErrors(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen description="Devam etmek için hesabına giriş yap." title="Giriş yap">
      {/* Test hesabı bilgileri geliştirme belgesinde tutulur; kullanıcı arayüzüne taşınmaz. */}
      <AuthScreenCard>
        {errors.form ? <Badge label={errors.form} variant="danger" /> : null}
        <TextField
          autoCapitalize="none"
          autoComplete="email"
          editable={!loading}
          error={errors.email}
          keyboardType="email-address"
          label="E-posta adresi"
          onChangeText={(value) => {
            setEmail(value);
            setErrors((current) => ({ ...current, email: undefined, form: undefined }));
          }}
          placeholder="isim@example.com"
          returnKeyType="next"
          value={email}
        />
        <TextField
          autoComplete="current-password"
          editable={!loading}
          error={errors.password}
          label="Şifre"
          onChangeText={(value) => {
            setPassword(value);
            setErrors((current) => ({ ...current, password: undefined, form: undefined }));
          }}
          onSubmitEditing={() => void handleLogin()}
          onTrailingPress={() => setPasswordVisible((visible) => !visible)}
          placeholder="Şifrenizi girin"
          returnKeyType="done"
          secureTextEntry={!passwordVisible}
          trailingAccessibilityLabel={passwordVisible ? 'Şifreyi gizle' : 'Şifreyi göster'}
          trailingIcon={passwordVisible ? 'eye-off' : 'eye'}
          value={password}
        />
        <Button
          disabled={loading}
          fullWidth
          label="Şifremi unuttum"
          onPress={() => router.push(routes.forgotPassword)}
          variant="ghost"
        />
        <Button fullWidth label="Giriş yap" loading={loading} onPress={() => void handleLogin()} />
        <Button
          disabled={loading}
          fullWidth
          label="Hesabın yok mu? Kayıt ol"
          onPress={() => router.replace(routes.register)}
          variant="ghost"
        />
      </AuthScreenCard>
    </Screen>
  );
}
