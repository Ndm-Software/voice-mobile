import type { KeyValueStorage } from '@/core/storage/key-value-storage';
import type { SecureStorage } from '@/core/storage/secure-storage';
import type { Session } from '@/domain/models/session';
import type { DeviceSessionRepository } from '@/domain/repositories/device-session-repository';

import { DeviceSessionManager } from './device-session-manager';
import { INSTALLATION_ID_STORAGE_KEY, InstallationManager } from './installation-manager';

class MemoryStorage implements KeyValueStorage, SecureStorage {
  readonly values = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.values.delete(key);
  }
}

const session: Session = {
  userId: '1001',
  accessToken: 'access',
  refreshToken: 'refresh-sensitive',
  accessTokenExpiresAt: '2026-08-06T10:00:00.000Z',
  refreshTokenExpiresAt: '2026-09-06T09:00:00.000Z',
};

describe('DeviceSessionManager', () => {
  it('kurulum kimliğini SecureStore uyumlu anahtarla bir kez üretir', async () => {
    const storage = new MemoryStorage();
    const installation = new InstallationManager(storage, () => 'installation-1');

    await expect(installation.getOrCreate()).resolves.toBe('installation-1');
    await expect(installation.getOrCreate()).resolves.toBe('installation-1');
    expect(INSTALLATION_ID_STORAGE_KEY).toMatch(/^[A-Za-z0-9._-]+$/);
    expect(storage.values.get(INSTALLATION_ID_STORAGE_KEY)).toBe('installation-1');
  });

  it('girişte cihazı bağlar, çıkışta aynı kurulumun refresh session kaydını revoke eder', async () => {
    const secureStorage = new MemoryStorage();
    const repository: DeviceSessionRepository = {
      bind: jest.fn(async () => undefined),
      revoke: jest.fn(async () => undefined),
    };
    const manager = new DeviceSessionManager(
      new InstallationManager(secureStorage, () => 'installation-1'),
      repository,
      'android',
    );

    await manager.bind(session);
    expect(repository.bind).toHaveBeenCalledWith(
      expect.objectContaining({ installationId: 'installation-1', userId: '1001' }),
    );

    await manager.revoke(session);
    expect(repository.revoke).toHaveBeenCalledWith(
      expect.objectContaining({
        installationId: 'installation-1',
        refreshToken: 'refresh-sensitive',
      }),
    );
    expect(secureStorage.values.get(INSTALLATION_ID_STORAGE_KEY)).toBe('installation-1');
  });
});
