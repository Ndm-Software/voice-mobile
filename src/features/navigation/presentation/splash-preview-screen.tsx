import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon, StateView } from '@/components';
import { useSession } from '@/application/session';
import { type AppTheme, useTheme } from '@/core/theme';

export function SplashPreviewScreen() {
  const { error, retryBootstrap, status } = useSession();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.mark}>
          <AppIcon color={theme.colors.textOnPrimary} name="sparkles" size={theme.sizes.icon.xl} />
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          Voia
        </Text>
        <Text style={styles.subtitle}>
          {status === 'error'
            ? 'Başlangıç sırasında bir sorun oluştu.'
            : 'Kişisel asistanın hazırlanıyor.'}
        </Text>
        {status === 'bootstrapping' ? (
          <ActivityIndicator
            accessibilityLabel="Oturum kontrol ediliyor"
            color={theme.colors.accentStrong}
            style={styles.loader}
          />
        ) : null}
        {status === 'error' ? (
          <View style={styles.errorState}>
            <StateView
              actionLabel="Yeniden dene"
              description={error?.message ?? 'Oturum bilgileri okunamadı.'}
              onAction={retryBootstrap}
              variant="error"
            />
          </View>
        ) : null}
        {status === 'unauthenticated' ? (
          <Text accessibilityLiveRegion="polite" style={styles.hint}>
            Karşılama ekranına yönlendiriliyorsun.
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing['2xl'],
    },
    mark: {
      width: 80,
      height: 80,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radii.xl,
      backgroundColor: theme.colors.primary,
      ...theme.shadows.floating,
    },
    title: {
      color: theme.colors.primary,
      ...theme.typography.display,
      marginTop: theme.spacing.xl,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      ...theme.typography.body,
      marginTop: theme.spacing.sm,
    },
    loader: {
      marginTop: theme.spacing.xl,
    },
    errorState: {
      width: '100%',
      marginTop: theme.spacing.lg,
    },
    hint: {
      color: theme.colors.textMuted,
      ...theme.typography.caption,
      marginTop: theme.spacing.xl,
    },
  });
}
