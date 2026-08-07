import { useRouter } from 'expo-router';
import { useState } from 'react';

import type { RequestPasswordReset } from '@/application/auth';
import { Badge, Button, Card, Screen, TextField } from '@/components';
import { routes } from '@/config/routes';
import type { AuthFieldErrors } from '@/domain/repositories/auth-repository';

import { getAuthFieldErrors } from './auth-error';
import { AuthScreenCard } from './auth-screen-card';

interface ForgotPasswordScreenProps {
  readonly requestPasswordReset: RequestPasswordReset;
}

export function ForgotPasswordScreen({ requestPasswordReset }: ForgotPasswordScreenProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [previewToken, setPreviewToken] = useState<string>();

  async function handleSubmit() {
    setLoading(true);
    setErrors({});

    try {
      const result = await requestPasswordReset.execute(email);
      setPreviewToken(result.previewToken);
      setSubmitted(true);
    } catch (error) {
      setErrors(getAuthFieldErrors(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen
      description="Şifre yenileme bağlantısını e-posta adresine gönderelim."
      title="Şifremi unuttum"
    >
      <AuthScreenCard badgeLabel="Enumeration-safe akış">
        {submitted ? (
          <>
            <Card
              description="Bu e-postayla eşleşen bir hesap varsa şifre yenileme bağlantısı gönderildi."
              title="E-postanı kontrol et"
              variant="soft"
            />
            {previewToken ? (
              <Button
                fullWidth
                label="Şifre yenilemeye devam et"
                onPress={() =>
                  router.push({ pathname: routes.resetPassword, params: { token: previewToken } })
                }
              />
            ) : null}
          </>
        ) : (
          <>
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
                setErrors({});
              }}
              onSubmitEditing={() => void handleSubmit()}
              placeholder="isim@example.com"
              returnKeyType="send"
              value={email}
            />
            <Button
              fullWidth
              label="Yenileme bağlantısı gönder"
              loading={loading}
              onPress={() => void handleSubmit()}
            />
          </>
        )}
        <Button
          fullWidth
          label="Giriş ekranına dön"
          onPress={() => router.replace(routes.login)}
          variant="ghost"
        />
      </AuthScreenCard>
    </Screen>
  );
}
