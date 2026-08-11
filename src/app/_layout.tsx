import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ToastProvider } from '@/components';
import { SessionGate, SessionProvider } from '@/application/session';
import { appContainer } from '@/composition/app-container';
import { lightTheme, ThemeProvider } from '@/core/theme';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SessionProvider
        deviceSessions={appContainer.deviceSessionManager}
        manager={appContainer.sessionManager}
        refreshSession={appContainer.refreshSession}
        logoutSession={appContainer.logoutSession}
      >
        <ToastProvider>
          <SessionGate>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: lightTheme.colors.background },
              }}
            />
            <StatusBar style={lightTheme.statusBarStyle} />
          </SessionGate>
        </ToastProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
