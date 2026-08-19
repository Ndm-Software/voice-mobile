import type { SecureStorage } from '@/core/storage/secure-storage';
import type { Session } from '@/domain/models/session';
import type { DeviceSessionRepository } from '@/domain/repositories/device-session-repository';
import type { PushNotificationGateway } from '@/domain/repositories/push-notification-gateway';

import { DeviceSessionManager } from './device-session-manager';
import { InstallationManager } from './installation-manager';
import { PushNotificationManager } from './push-notification-manager';

const session: Session = {
  userId: 'user-1',
  accessToken: 'access',
  refreshToken: 'refresh',
  accessTokenExpiresAt: '2026-08-20T10:00:00.000Z',
  refreshTokenExpiresAt: '2026-09-20T10:00:00.000Z',
};

describe('PushNotificationManager', () => {
  it('izin verilmişse Firebase tokenını cihaz kaydıyla eşleştirir', async () => {
    const { manager, repository } = createManager({
      getPermissionStatus: jest.fn().mockResolvedValue('granted'),
      getToken: jest.fn().mockResolvedValue('fcm-token'),
    });

    await expect(manager.synchronize(session)).resolves.toEqual({
      permission: 'granted',
      tokenRegistered: true,
    });
    expect(repository.bind).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceName: 'Pixel Test',
        installationId: 'installation-1',
        pushToken: 'fcm-token',
      }),
    );
  });

  it('izin reddedildiğinde backend cihaz kaydındaki tokenı temizler', async () => {
    const { manager, repository } = createManager({
      requestPermission: jest.fn().mockResolvedValue('denied'),
    });

    await expect(manager.synchronize(session, { requestPermission: true })).resolves.toEqual({
      permission: 'denied',
      tokenRegistered: false,
    });
    expect(repository.bind).toHaveBeenCalledWith(expect.objectContaining({ pushToken: null }));
  });
});

function createManager(overrides: Partial<PushNotificationGateway>) {
  const storage: SecureStorage = {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  };
  const repository: DeviceSessionRepository = {
    bind: jest.fn().mockResolvedValue(undefined),
    revoke: jest.fn().mockResolvedValue(undefined),
  };
  const gateway: PushNotificationGateway = {
    getInitialMessage: jest.fn().mockResolvedValue(null),
    getPermissionStatus: jest.fn().mockResolvedValue('not-determined'),
    getToken: jest.fn().mockResolvedValue(null),
    requestPermission: jest.fn().mockResolvedValue('not-determined'),
    subscribeToForegroundMessages: jest.fn(() => jest.fn()),
    subscribeToOpenedMessages: jest.fn(() => jest.fn()),
    subscribeToTokenRefresh: jest.fn(() => jest.fn()),
    ...overrides,
  };
  const deviceSessions = new DeviceSessionManager(
    new InstallationManager(storage, () => 'installation-1'),
    repository,
    'android',
    'Pixel Test',
  );

  return {
    manager: new PushNotificationManager(gateway, deviceSessions),
    repository,
  };
}
