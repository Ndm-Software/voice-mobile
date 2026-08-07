import type { KeyValueStorage } from '@/core/storage/key-value-storage';
import { PersistentMockDatabase } from '@/infrastructure/mock/database/persistent-mock-database';

import { MockDeviceSessionRepository } from './mock-device-session-repository';

class MemoryStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();

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

const binding = {
  installationId: 'installation-1',
  platform: 'android' as const,
  refreshToken: 'refresh-sensitive',
  refreshTokenExpiresAt: '2026-09-06T09:00:00.000Z',
  userId: '1001',
};

describe('MockDeviceSessionRepository', () => {
  it('cihazı etkinleştirir ve çıkışta ham token saklamadan revoke eder', async () => {
    const database = new PersistentMockDatabase(new MemoryStorage());
    const repository = new MockDeviceSessionRepository(
      database,
      () => new Date('2026-08-06T09:00:00.000Z'),
    );

    await repository.bind(binding);
    const active = await database.read();
    expect(active.devices).toContainEqual(
      expect.objectContaining({ id: 'installation-1', userId: '1001', active: true }),
    );
    expect(JSON.stringify(active.refreshSessions)).not.toContain('refresh-sensitive');

    await repository.revoke(binding);
    const revoked = await database.read();
    expect(revoked.devices).toContainEqual(
      expect.objectContaining({ id: 'installation-1', active: false }),
    );
    expect(revoked.refreshSessions).toContainEqual(
      expect.objectContaining({
        deviceId: 'installation-1',
        revokedAt: '2026-08-06T09:00:00.000Z',
      }),
    );
  });
});
