import { screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import type { SecureStorage } from '@/core/storage/secure-storage';
import { AuthRequestError } from '@/domain/repositories/auth-repository';
import type { DeviceSessionRepository } from '@/domain/repositories/device-session-repository';
import { renderWithProviders } from '@/test/render-with-providers';

import { DeviceSessionManager } from './device-session-manager';
import { INSTALLATION_ID_STORAGE_KEY, InstallationManager } from './installation-manager';
import { SESSION_STORAGE_KEY, SessionManager } from './session-manager';
import { SessionProvider, useSession } from './session-provider';

const savedSession = {
  userId: '6bfbe9b4-8ce0-4f39-a2c1-417b4ab7ca7c',
  accessToken: 'stale-access',
  refreshToken: 'stale-refresh',
  accessTokenExpiresAt: '2099-08-19T10:00:00.000Z',
  refreshTokenExpiresAt: '2099-09-19T10:00:00.000Z',
} as const;

describe('SessionProvider bootstrap', () => {
  it('backend tarafından reddedilen eski oturumu temizleyip giriş durumuna döner', async () => {
    const storage = createStorage({
      [INSTALLATION_ID_STORAGE_KEY]: '2d931510-3d4e-4bb1-b6ba-8a7c2c3a5d1e',
      [SESSION_STORAGE_KEY]: JSON.stringify(savedSession),
    });
    const manager = new SessionManager({ storage });
    const deviceSessions = createDeviceSessions(storage);

    await renderWithProviders(
      <SessionProvider
        deviceSessions={deviceSessions}
        hydrateSession={async () => {
          throw new AuthRequestError('AUTH_SESSION_INVALID', 'Oturum geçersiz.');
        }}
        manager={manager}
      >
        <SessionStatus />
      </SessionProvider>,
    );

    expect(await screen.findByText('unauthenticated')).toBeTruthy();
    await expect(manager.restore()).resolves.toBeNull();
  });

  it('bağlantı hatasında oturumu silmeden yeniden deneme durumunu gösterir', async () => {
    const storage = createStorage({
      [INSTALLATION_ID_STORAGE_KEY]: '2d931510-3d4e-4bb1-b6ba-8a7c2c3a5d1e',
      [SESSION_STORAGE_KEY]: JSON.stringify(savedSession),
    });
    const manager = new SessionManager({ storage });
    const deviceSessions = createDeviceSessions(storage);

    await renderWithProviders(
      <SessionProvider
        deviceSessions={deviceSessions}
        hydrateSession={async () => {
          throw new Error('Network unavailable');
        }}
        manager={manager}
      >
        <SessionStatus />
      </SessionProvider>,
    );

    expect(await screen.findByText('error')).toBeTruthy();
    await expect(manager.restore()).resolves.toEqual(savedSession);
  });
});

function SessionStatus() {
  const { status } = useSession();
  return <Text>{status}</Text>;
}

function createStorage(initial: Record<string, string>): SecureStorage {
  const values = new Map(Object.entries(initial));
  return {
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    removeItem: jest.fn(async (key: string) => {
      values.delete(key);
    }),
    setItem: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
  };
}

function createDeviceSessions(storage: SecureStorage): DeviceSessionManager {
  const repository: DeviceSessionRepository = {
    list: jest.fn(async () => []),
    bind: jest.fn(async () => undefined),
    revoke: jest.fn(async () => undefined),
  };
  return new DeviceSessionManager(
    new InstallationManager(storage, () => '2d931510-3d4e-4bb1-b6ba-8a7c2c3a5d1e'),
    repository,
    'android',
  );
}
