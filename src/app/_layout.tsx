import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ToastProvider } from '@/components';
import { SessionGate, SessionProvider } from '@/application/session';
import { PendingRegistrationProvider } from '@/application/auth';
import { appContainer } from '@/composition/app-container';
import { lightTheme, ThemeProvider } from '@/core/theme';
import { PushNotificationProvider } from '@/features/notifications';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <PendingRegistrationProvider>
        <SessionProvider
          deviceSessions={appContainer.deviceSessionManager}
          manager={appContainer.sessionManager}
          refreshSession={appContainer.refreshSession}
          logoutSession={appContainer.logoutSession}
          hydrateSession={appContainer.hydrateSession}
        >
          <ToastProvider>
            <PushNotificationProvider manager={appContainer.pushNotificationManager}>
              <SessionGate>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: lightTheme.colors.background },
                  }}
                />
                <StatusBar style={lightTheme.statusBarStyle} />
              </SessionGate>
            </PushNotificationProvider>
          </ToastProvider>
        </SessionProvider>
      </PendingRegistrationProvider>
    </ThemeProvider>
  );
}
