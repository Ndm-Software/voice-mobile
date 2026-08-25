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

  it('arama, önem ve tarih aralığı sorgularını mock veride uygular', async () => {
    const repository = new MockReminderRepository(
      new PersistentMockDatabase(new MemoryStorage()),
      new MockNetwork({ minimumDelayMs: 0, maximumDelayMs: 0, scenario: 'success' }),
    );
    const urgentReminders = await repository.list('1001', { filter: 'all', urgent: true });
    const selected = urgentReminders[0];

    expect(selected).toBeDefined();
    await expect(
      repository.list('1001', {
        filter: 'all',
        search: selected.title,
        urgent: true,
        startDate: selected.eventDateTime,
        endDate: selected.eventDateTime,
      }),
    ).resolves.toEqual([selected]);
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

  it('push ve voice bildirim ayarlarını mock reminder kaydına ekler', async () => {
    const repository = new MockReminderRepository(
      new PersistentMockDatabase(new MemoryStorage()),
      new MockNetwork({ minimumDelayMs: 0, maximumDelayMs: 0, scenario: 'success' }),
      () => new Date('2026-08-11T10:00:00.000Z'),
    );

    const created = await repository.create({
      userId: '1001',
      title: 'Bildirimli görev',
      eventDateTime: '2026-08-12T09:30:00.000Z',
      urgent: false,
      pushEnabled: true,
      pushMinutesBefore: [10, 60],
      voiceEnabled: true,
      voiceMinutesBefore: 30,
    });

    expect(created.pushSettings).toEqual([
      { id: 'push-6004-1', minutesBefore: 10, enabled: true },
      { id: 'push-6004-2', minutesBefore: 60, enabled: true },
    ]);
    expect(created.voiceCallSetting).toEqual({
      id: 'voice-6004',
      minutesBefore: 30,
      retryCount: 0,
      enabled: true,
      locale: 'tr-TR',
    });
  });

  it('detay kaydını yalnız sahibi için getirir', async () => {
    const repository = new MockReminderRepository(
      new PersistentMockDatabase(new MemoryStorage()),
      new MockNetwork({ minimumDelayMs: 0, maximumDelayMs: 0, scenario: 'success' }),
    );

    await expect(repository.getById('1001', '6001')).resolves.toMatchObject({
      id: '6001',
      userId: '1001',
    });
    await expect(repository.getById('başka-kullanıcı', '6001')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('temel alanları günceller ve bildirim ayarlarını korur', async () => {
    const repository = new MockReminderRepository(
      new PersistentMockDatabase(new MemoryStorage()),
      new MockNetwork({ minimumDelayMs: 0, maximumDelayMs: 0, scenario: 'success' }),
      () => new Date('2026-08-14T12:00:00.000Z'),
    );

    const updated = await repository.update({
      id: '6001',
      userId: '1001',
      title: 'Güncel doktor kontrolü',
      description: 'Yeni açıklama',
      eventDateTime: '2026-08-20T09:30:00.000Z',
      urgent: true,
    });

    expect(updated).toMatchObject({
      title: 'Güncel doktor kontrolü',
      description: 'Yeni açıklama',
      eventDateTime: '2026-08-20T09:30:00.000Z',
      urgent: true,
      updatedAt: '2026-08-14T12:00:00.000Z',
    });
    expect(updated.pushSettings).not.toHaveLength(0);
    await expect(repository.getById('1001', '6001')).resolves.toEqual(updated);
  });

  it('aynı başlık, tarih ve saatte çift kayıt oluşturmaz', async () => {
    const repository = new MockReminderRepository(
      new PersistentMockDatabase(new MemoryStorage()),
      new MockNetwork({ minimumDelayMs: 0, maximumDelayMs: 0, scenario: 'success' }),
    );
    const existing = await repository.getById('1001', '6001');

    await expect(
      repository.create({
        userId: '1001',
        title: `  ${existing.title.toLocaleUpperCase('tr-TR')}  `,
        eventDateTime: existing.eventDateTime,
        urgent: false,
      }),
    ).rejects.toMatchObject({ code: 'DUPLICATE' });
  });

  it('tamamlanan kaydı geçmişe taşır ve yeniden açar', async () => {
    const repository = new MockReminderRepository(
      new PersistentMockDatabase(new MemoryStorage()),
      new MockNetwork({ minimumDelayMs: 0, maximumDelayMs: 0, scenario: 'success' }),
      () => new Date('2026-08-14T12:00:00.000Z'),
    );

    await expect(
      repository.changeStatus({ id: '6001', userId: '1001', status: 'completed' }),
    ).resolves.toMatchObject({ status: 'completed' });
    await expect(repository.list('1001', 'active')).resolves.not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: '6001' })]),
    );
    await expect(repository.list('1001', 'history')).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: '6001', status: 'completed' })]),
    );
    await expect(
      repository.changeStatus({ id: '6001', userId: '1001', status: 'active' }),
    ).resolves.toMatchObject({ status: 'active' });
  });

  it('kaydı ve ilişkili mock geçmişini siler', async () => {
    const database = new PersistentMockDatabase(new MemoryStorage());
    const repository = new MockReminderRepository(
      database,
      new MockNetwork({ minimumDelayMs: 0, maximumDelayMs: 0, scenario: 'success' }),
    );

    await repository.remove('1001', '6003');

    await expect(repository.getById('1001', '6003')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(database.read()).resolves.toMatchObject({
      reminderHistory: [expect.objectContaining({ id: '9002', reminderId: '6001' })],
    });
  });
});
