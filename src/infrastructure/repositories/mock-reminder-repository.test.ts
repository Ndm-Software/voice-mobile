import type { KeyValueStorage } from '@/core/storage/key-value-storage';
import { MockNetwork } from '@/infrastructure/mock/mock-network';
import { PersistentMockDatabase } from '@/infrastructure/mock/database/persistent-mock-database';

import { MockReminderRepository } from './mock-reminder-repository';

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

describe('MockReminderRepository', () => {
  it('kullanıcının aktif reminder kayıtlarını tarihe göre döndürür', async () => {
    const repository = new MockReminderRepository(
      new PersistentMockDatabase(new MemoryStorage()),
      new MockNetwork({ minimumDelayMs: 0, maximumDelayMs: 0, scenario: 'success' }),
    );

    await expect(repository.list('1001')).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: '6001', status: 'active' }),
        expect.objectContaining({ id: '6002', status: 'active' }),
      ]),
    );
  });

  it('history filtresi aktif kayıtları dışarıda bırakır', async () => {
    const repository = new MockReminderRepository(
      new PersistentMockDatabase(new MemoryStorage()),
      new MockNetwork({ minimumDelayMs: 0, maximumDelayMs: 0, scenario: 'success' }),
    );

    await expect(repository.list('1001', 'history')).resolves.toEqual([
      expect.objectContaining({ id: '6003', status: 'completed' }),
    ]);
  });

  it('yeni reminder kaydını mock veritabanına ekler', async () => {
    const repository = new MockReminderRepository(
      new PersistentMockDatabase(new MemoryStorage()),
      new MockNetwork({ minimumDelayMs: 0, maximumDelayMs: 0, scenario: 'success' }),
      () => new Date('2026-08-11T10:00:00.000Z'),
    );

    const created = await repository.create({
      userId: '1001',
      title: 'Yeni görev',
      description: 'Kısa not',
      eventDateTime: '2026-08-12T09:30:00.000Z',
      urgent: true,
    });

    expect(created).toEqual(
      expect.objectContaining({
        id: '6004',
        title: 'Yeni görev',
        status: 'active',
        urgent: true,
        pushSettings: [],
      }),
    );
    await expect(repository.list('1001')).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: '6004' })]),
    );
  });
});
