import { Stack } from 'expo-router';

import { useTheme } from '@/core/theme';

export default function AppLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Geri',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: theme.typography.cardTitle,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="component-gallery" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: 'Profil' }} />
      <Stack.Screen name="preferences" options={{ title: 'Dil ve tercihler' }} />
      <Stack.Screen name="quiet-hours" options={{ title: 'Sessiz saatler' }} />
      <Stack.Screen name="devices" options={{ title: 'Cihaz ve bildirimler' }} />
      <Stack.Screen name="history/[id]" options={{ title: 'Geçmiş kaydı' }} />
      <Stack.Screen name="privacy" options={{ title: 'Gizlilik ve yasal' }} />
      <Stack.Screen name="reminders/[id]/index" options={{ title: 'Hatırlatıcı' }} />
      <Stack.Screen name="reminders/[id]/edit" options={{ title: 'Hatırlatıcıyı düzenle' }} />
    </Stack>
  );
}
