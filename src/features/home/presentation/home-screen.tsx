import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { GetHomeOverview } from '@/application/use-cases/get-home-overview';
import { type AppTheme, useTheme } from '@/core/theme';

import { useHomeOverview } from './use-home-overview';

interface HomeScreenProps {
  readonly getHomeOverview: GetHomeOverview;
}

export function HomeScreen({ getHomeOverview }: HomeScreenProps) {
  const { retry, state } = useHomeOverview(getHomeOverview);
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {state.status === 'loading' ? (
            <ActivityIndicator
              accessibilityLabel="Voia hazırlanıyor"
              color={theme.colors.accentStrong}
              size="large"
            />
          ) : null}

          {state.status === 'error' ? (
            <View style={styles.feedbackCard}>
              <Text style={styles.feedbackTitle}>Başlangıç bilgileri alınamadı</Text>
              <Text style={styles.feedbackDescription}>
                Lütfen bağlantıyı kontrol edip yeniden deneyin.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={retry}
                style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
              >
                <Text style={styles.retryButtonText}>Yeniden dene</Text>
              </Pressable>
            </View>
          ) : null}

          {state.status === 'ready' ? (
            <>
              <View style={styles.mark} accessibilityElementsHidden>
                <Text style={styles.markText}>V</Text>
              </View>
              <Text accessibilityRole="header" style={styles.title}>
                {state.data.applicationName}
              </Text>
              <Text style={styles.subtitle}>{state.data.assistantTagline}</Text>
              <View style={styles.statusCard}>
                <View
                  style={[
                    styles.statusDot,
                    state.data.readiness === 'degraded' && styles.statusDotDegraded,
                  ]}
                />
                <View style={styles.statusTextContainer}>
                  <Text style={styles.statusTitle}>
                    {state.data.mockDataSummary
                      ? `Merhaba, ${state.data.mockDataSummary.userDisplayName}`
                      : 'Hoş geldin'}
                  </Text>
                  <Text style={styles.statusDescription}>
                    Hatırlatmaların ve kişisel ayarların senin için hazır.
                  </Text>
                  {state.data.mockDataSummary ? (
                    <Text style={styles.fixtureDescription}>
                      {state.data.mockDataSummary.userDisplayName} •{' '}
                      {state.data.mockDataSummary.activeReminderCount} aktif hatırlatıcı •{' '}
                      {state.data.mockDataSummary.deviceCount} cihaz •{' '}
                      {state.data.mockDataSummary.historyCount} geçmiş kaydı
                    </Text>
                  ) : null}
                </View>
              </View>
              <View accessible style={styles.themeCard}>
                <View style={styles.themeTextContainer}>
                  <Text style={styles.themeTitle}>Gününü planlamaya başla</Text>
                  <Text style={styles.themeDescription}>
                    Hatırlatıcılarını oluştur, yaklaşan işlerini takip et.
                  </Text>
                </View>
              </View>
            </>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    page: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    safeArea: {
      flex: 1,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing['2xl'],
    },
    mark: {
      width: 72,
      height: 72,
      borderRadius: theme.radii.xl,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.xl,
    },
    markText: {
      color: theme.colors.textOnPrimary,
      fontSize: 36,
      fontWeight: theme.typography.display.fontWeight,
    },
    title: {
      color: theme.colors.primary,
      ...theme.typography.display,
      textAlign: 'center',
    },
    subtitle: {
      color: theme.colors.textSecondary,
      ...theme.typography.body,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
    statusCard: {
      width: '100%',
      maxWidth: theme.sizes.contentMaxWidth,
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing['4xl'],
      padding: theme.spacing.lg,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      ...theme.shadows.card,
    },
    statusDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: theme.spacing.md,
      backgroundColor: theme.colors.accent,
    },
    statusDotDegraded: {
      backgroundColor: theme.colors.warningAccent,
    },
    statusTextContainer: {
      flex: 1,
    },
    statusTitle: {
      color: theme.colors.textPrimary,
      ...theme.typography.button,
    },
    statusDescription: {
      color: theme.colors.textMuted,
      ...theme.typography.caption,
      marginTop: theme.spacing.xs,
    },
    fixtureDescription: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
      marginTop: theme.spacing.sm,
    },
    feedbackCard: {
      width: '100%',
      maxWidth: theme.sizes.contentMaxWidth,
      alignItems: 'center',
      padding: theme.spacing['2xl'],
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: theme.colors.dangerAccent,
      backgroundColor: theme.colors.surface,
      ...theme.shadows.card,
    },
    feedbackTitle: {
      color: theme.colors.danger,
      ...theme.typography.cardTitle,
      textAlign: 'center',
    },
    feedbackDescription: {
      color: theme.colors.textSecondary,
      ...theme.typography.bodySmall,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
    retryButton: {
      minHeight: theme.sizes.touchTarget,
      justifyContent: 'center',
      marginTop: theme.spacing.xl,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.primary,
    },
    retryButtonPressed: {
      backgroundColor: theme.colors.primaryPressed,
    },
    retryButtonText: {
      color: theme.colors.textOnPrimary,
      ...theme.typography.button,
    },
    themeCard: {
      width: '100%',
      maxWidth: theme.sizes.contentMaxWidth,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.lg,
      marginTop: theme.spacing.md,
      padding: theme.spacing.lg,
      borderRadius: theme.radii.lg,
      backgroundColor: theme.colors.primarySoft,
    },
    themeTextContainer: {
      flex: 1,
    },
    themeTitle: {
      color: theme.colors.primary,
      ...theme.typography.label,
    },
    themeDescription: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
      marginTop: theme.spacing.xs,
    },
  });
}
