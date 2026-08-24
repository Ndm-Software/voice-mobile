import type { DeviceSessionBinding } from '@/domain/repositories/device-session-repository';
import type { HttpClient } from '@/infrastructure/http/http-client';

import { HttpDeviceSessionRepository } from './http-device-session-repository';

const binding: DeviceSessionBinding = {
  deviceName: 'Pixel Test',
  installationId: 'd70dc245-2d06-4ba7-836a-1e0d90be4951',
  platform: 'android',
  refreshToken: 'refresh-token',
  refreshTokenExpiresAt: '2026-09-20T10:00:00.000Z',
  userId: 'user-1',
};

describe('HttpDeviceSessionRepository', () => {
  it('hesaptaki Android, iOS, web ve Windows cihazlarını listeler', async () => {
    const client = createClient();
    jest.mocked(client.get).mockResolvedValue([
      {
        deviceId: 'device-1',
        platform: 'ANDROID',
        deviceName: 'Telefon',
        lastActive: '2026-08-19T14:34:51.739Z',
        isActive: true,
        createdAt: '2026-08-19T14:28:36.223Z',
      },
      {
        deviceId: 'device-2',
        platform: 'WEB',
        deviceName: 'Chrome',
        lastActive: '2026-08-18T10:00:00.000Z',
        isActive: false,
        createdAt: '2026-08-17T10:00:00.000Z',
      },
    ]);
    const repository = new HttpDeviceSessionRepository(client, {
      currentDevice: '/devices',
      logout: '/auth/logout',
    });

    await expect(repository.list()).resolves.toEqual([
      expect.objectContaining({ id: 'device-1', platform: 'android', active: true }),
      expect.objectContaining({ id: 'device-2', platform: 'web', active: false }),
    ]);
    expect(client.get).toHaveBeenCalledWith('/devices', { signal: undefined });
  });

  it('token verilmezse mevcut backend tokenına dokunmaz', async () => {
    const client = createClient();
    const repository = new HttpDeviceSessionRepository(client, {
      currentDevice: '/devices',
      logout: '/auth/logout',
    });

    await repository.bind(binding);

    expect(client.put).toHaveBeenCalledWith('/devices', {
      deviceName: 'Pixel Test',
      installationId: binding.installationId,
      platform: 'ANDROID',
    });
  });

  it('FCM tokenını kaydeder ve null ile temizleyebilir', async () => {
    const client = createClient();
    const repository = new HttpDeviceSessionRepository(client, {
      currentDevice: '/devices',
      logout: '/auth/logout',
    });

    await repository.bind({ ...binding, pushToken: 'fcm-token' });
    await repository.bind({ ...binding, pushToken: null });

    expect(client.put).toHaveBeenNthCalledWith(
      1,
      '/devices',
      expect.objectContaining({ pushToken: 'fcm-token' }),
    );
    expect(client.put).toHaveBeenNthCalledWith(
      2,
      '/devices',
      expect.objectContaining({ pushToken: null }),
    );
  });
});

function createClient(): HttpClient {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn().mockResolvedValue(undefined),
    patch: jest.fn(),
    delete: jest.fn(),
  };
}
