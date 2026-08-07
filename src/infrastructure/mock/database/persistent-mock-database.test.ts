import type { KeyValueStorage } from '@/core/storage/key-value-storage';

import { MOCK_DATABASE_STORAGE_KEY, PersistentMockDatabase } from './persistent-mock-database';

class MemoryStorage implements KeyValueStorage {
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

describe('PersistentMockDatabase', () => {
  it('ilk açılışta fixture üretir ve sonraki uygulama açılışında aynı veriyi okur', async () => {
    const storage = new MemoryStorage();
    const firstApplicationRun = new PersistentMockDatabase(storage);
    const initialState = await firstApplicationRun.read();

    await firstApplicationRun.replace({
      ...initialState,
      reminders: initialState.reminders.slice(1),
    });

    const restartedApplication = new PersistentMockDatabase(storage);
    const persistedState = await restartedApplication.read();

    expect(storage.values.has(MOCK_DATABASE_STORAGE_KEY)).toBe(true);
    expect(persistedState.reminders).toHaveLength(2);
    expect(persistedState.reminders[0]?.id).toBe('6002');
  });

  it('bozuk depolama değerini güvenli fixture ile onarır', async () => {
    const storage = new MemoryStorage();
    storage.values.set(MOCK_DATABASE_STORAGE_KEY, '{bozuk-json');

    const database = new PersistentMockDatabase(storage);
    const recoveredState = await database.read();

    expect(recoveredState.schemaVersion).toBe(1);
    expect(recoveredState.users[0]?.firstName).toBe('Uğur');
    expect(recoveredState.reminders).toHaveLength(3);
  });
});
