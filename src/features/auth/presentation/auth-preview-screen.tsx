import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppIcon, Button, Card, Screen, TextField } from '@/components';
import { useSession } from '@/application/session';
import { routes } from '@/config/routes';
import { type AppTheme, useTheme } from '@/core/theme';

type AuthPreviewMode = 'welcome' | 'register';

interface AuthPreviewScreenProps {
  readonly mode: AuthPreviewMode;
}

const copy = {
  welcome: {
    title: 'Voia’ya hoş geldin',
    description: 'Çok dilli kişisel sesli asistanın.',
  },
  register: {
    title: 'Hesap oluştur',
    description: 'Voia dünyasına adım atmak için bilgilerini gir.',
  },
} as const;

export function AuthPreviewScreen({ mode }: AuthPreviewScreenProps) {
  const router = useRouter();
  const { signInDemo } = useSession();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const screenCopy = copy[mode];

  async function handleDemoSignIn() {
    await signInDemo();
    router.replace(routes.home);
  }

  return (
    <Screen description={screenCopy.description} title={screenCopy.title}>
      <Card style={styles.card}>
        <View style={styles.brandMark}>
          <AppIcon color={theme.colors.textOnPrimary} name="sparkles" size={theme.sizes.icon.xl} />
        </View>
        {mode === 'welcome' ? (
          <View style={styles.stack}>
            <Text style={styles.welcomeTitle}>Kişisel asistanın her zaman yanında.</Text>
            <Text style={styles.welcomeDescription}>
              Hatırlatmalarını kolayca planla, bildirimlerini yönet ve günlük işlerini tek yerde
              takip et.
            </Text>
            <Button fullWidth label="Giriş yap" onPress={() => router.push(routes.login)} />
            <Button
              fullWidth
              label="Hesap oluştur"
              onPress={() => router.push(routes.register)}
              variant="secondary"
            />
          </View>
        ) : (
          <View style={styles.stack}>
            <TextField label="Ad soyad" placeholder="Örn. Selin Aydın" />
            <TextField
              autoCapitalize="none"
              keyboardType="email-address"
              label="E-posta adresi"
              placeholder="isim@example.com"
            />
            <TextField label="Şifre" placeholder="En az 8 karakter" secureTextEntry />
            <TextField label="Şifre tekrar" placeholder="Şifrenizi tekrar girin" secureTextEntry />
            <Button fullWidth label="Kayıt ol" onPress={() => void handleDemoSignIn()} />
            <Button
              fullWidth
              label="Zaten hesabın var mı? Giriş yap"
              onPress={() => router.replace(routes.login)}
              variant="ghost"
            />
          </View>
        )}
      </Card>

      {mode === 'register' ? (
        <View style={styles.backAction}>
          <Button
            fullWidth
            label="Karşılama ekranına dön"
            onPress={() => router.replace(routes.welcome)}
            variant="ghost"
          />
        </View>
      ) : null}
    </Screen>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    card: {
      width: '100%',
      maxWidth: theme.sizes.contentMaxWidth,
      alignSelf: 'center',
    },
    brandMark: {
      width: 64,
      height: 64,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.lg,
      borderRadius: theme.radii.xl,
      backgroundColor: theme.colors.primary,
    },
    stack: {
      gap: theme.spacing.lg,
      marginTop: theme.spacing['2xl'],
    },
    welcomeTitle: {
      color: theme.colors.textPrimary,
      ...theme.typography.sectionTitle,
    },
    welcomeDescription: {
      color: theme.colors.textSecondary,
      ...theme.typography.body,
    },
    backAction: {
      width: '100%',
      maxWidth: theme.sizes.contentMaxWidth,
      alignSelf: 'center',
      marginTop: theme.spacing.md,
    },
  });
}
