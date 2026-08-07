import { Tabs } from 'expo-router';

import { AppIcon, type AppIconName } from '@/components';
import { useTheme } from '@/core/theme';

const tabIcons: Record<string, AppIconName> = {
  home: 'home',
  calendar: 'calendar',
  'create-reminder': 'add',
  history: 'history',
  settings: 'settings',
};

export default function AppTabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          ...theme.typography.caption,
          fontWeight: theme.typography.label.fontWeight,
        },
        tabBarStyle: {
          minHeight: 68,
          paddingTop: theme.spacing.sm,
          borderTopColor: theme.colors.divider,
          backgroundColor: theme.colors.surface,
        },
        tabBarIcon: ({ color, focused, size }) => (
          <AppIcon
            color={color}
            name={tabIcons[route.name] ?? 'home'}
            size={route.name === 'create-reminder' && focused ? size + 4 : size}
          />
        ),
      })}
    >
      <Tabs.Screen name="home" options={{ title: 'Ana Sayfa' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Takvim' }} />
      <Tabs.Screen name="create-reminder" options={{ title: 'Ekle' }} />
      <Tabs.Screen name="history" options={{ title: 'Geçmiş' }} />
      <Tabs.Screen name="settings" options={{ title: 'Ayarlar' }} />
    </Tabs>
  );
}
