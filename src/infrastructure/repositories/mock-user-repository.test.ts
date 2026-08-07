import type { KeyValueStorage } from '@/core/storage/key-value-storage';
import {
  MockAuthAccountStore,
  type PasswordHasher,
} from '@/infrastructure/mock/auth/mock-auth-account-store';
import { PersistentMockDatabase } from '@/infrastructure/mock/database/persistent-mock-database';
import { MockNetwork } from '@/infrastructure/mock/mock-network';

import { MockUserRepository } from './mock-user-repository';

class MemoryStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): Promise<string | null> {
    return Promise.resolve(this.values.get(key) ?? null);
  }
  setItem(key: string, value: string): Promise<void> {
    this.values.set(key, value);
    return Promise.resolve();
  }
  removeItem(key: string): Promise<void> {
    this.values.delete(key);
    return Promise.resolve();
  }
}

describe('MockUserRepository', () => {
  it('profil ve tercihleri kalıcı mock veride okur/günceller; hesap silmede ilişkileri kaldırır', async () => {
    const secureStorage = new MemoryStorage();
    const database = new PersistentMockDatabase(new MemoryStorage());
    const accountStore = new MockAuthAccountStore(secureStorage, {
      hash: async (value: string) => `hash:${value}`,
    } satisfies PasswordHasher);
    await accountStore.findByEmail('ugur@example.com');
    const repository = new MockUserRepository(
      database,
      accountStore,
      new MockNetwork({ minimumDelayMs: 0, maximumDelayMs: 0, scenario: 'success' }),
      () => new Date('2026-08-07T09:00:00.000Z'),
    );

    await expect(repository.getProfile('1001')).resolves.toMatchObject({
      firstName: 'Uğur',
      phoneVerified: true,
    });
    await repository.updateProfile('1001', {
      firstName: 'Uğur',
      lastName: 'Demir',
      email: 'ugur@example.com',
      phoneNumber: '+905551112233',
    });
    await expect(repository.getPreferences('1001')).resolves.toMatchObject({
      timezone: 'Europe/Istanbul',
      defaultPushBeforeMinutes: 15,
    });
    await repository.updatePreferences('1001', {
      languageId: '2',
      timezone: 'Europe/London',
      province: 'London',
      notificationsEnabled: false,
      defaultPushBeforeMinutes: 30,
      defaultCallBeforeMinutes: 20,
    });
    await expect(repository.getPreferences('1001')).resolves.toMatchObject({
      languageId: '2',
      timezone: 'Europe/London',
    });

    await repository.deleteAccount('1001');
    await expect(accountStore.findByUserId('1001')).resolves.toBeUndefined();
    const state = await database.read();
    expect(state.users).not.toContainEqual(expect.objectContaining({ id: '1001' }));
    expect(state.reminders).not.toContainEqual(expect.objectContaining({ userId: '1001' }));
  });
});
