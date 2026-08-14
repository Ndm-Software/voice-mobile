import type { Reminder } from '@/domain/models/reminder';
import type { ReminderRepository } from '@/domain/repositories/reminder-repository';

import { CreateReminderUseCase } from './create-reminder';

const reminder: Reminder = {
  id: '6004',
  userId: '1001',
  title: 'Yeni görev',
  eventDateTime: '2026-08-12T09:30:00.000Z',
  repeatType: 'none',
  status: 'active',
  urgent: false,
  pushSettings: [],
  createdAt: '2026-08-11T10:00:00.000Z',
  updatedAt: '2026-08-11T10:00:00.000Z',
};

function createRepository(overrides: Partial<ReminderRepository> = {}): ReminderRepository {
  return {
    list: jest.fn(),
    create: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    changeStatus: jest.fn(),
    ...overrides,
  };
}

describe('CreateReminderUseCase', () => {
  it('başlığı temizleyerek repository üzerinden reminder oluşturur', async () => {
    const repository = createRepository({ create: jest.fn().mockResolvedValue(reminder) });
    const useCase = new CreateReminderUseCase(repository);

    await expect(
      useCase.execute({
        userId: '1001',
        title: '  Yeni görev  ',
        description: '  Kısa not  ',
        eventDateTime: '2099-08-12T09:30:00.000Z',
        urgent: false,
      }),
    ).resolves.toEqual(reminder);
    expect(repository.create).toHaveBeenCalledWith(
      {
        userId: '1001',
        title: 'Yeni görev',
        description: 'Kısa not',
        eventDateTime: '2099-08-12T09:30:00.000Z',
        urgent: false,
      },
      undefined,
    );
  });

  it('boş başlık ve geçmiş tarihi repository çağırmadan reddeder', async () => {
    const repository = createRepository();
    const useCase = new CreateReminderUseCase(repository);

    expect(() =>
      useCase.execute({
        userId: '1001',
        title: ' ',
        eventDateTime: '2020-01-01T09:30:00.000Z',
        urgent: false,
      }),
    ).toThrow(
      expect.objectContaining({
        code: 'VALIDATION_ERROR',
        fieldErrors: {
          title: 'Başlık zorunludur.',
          eventDateTime: 'Geçmiş bir tarih veya saat seçemezsiniz.',
        },
      }),
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('bildirim sürelerini normalize ederek repositorye aktarır', async () => {
    const repository = createRepository({ create: jest.fn().mockResolvedValue(reminder) });
    const useCase = new CreateReminderUseCase(repository);

    await useCase.execute({
      userId: '1001',
      title: 'Bildirimli görev',
      eventDateTime: '2099-08-12T09:30:00.000Z',
      urgent: false,
      pushEnabled: true,
      pushMinutesBefore: [10, 60],
      voiceEnabled: true,
      voiceMinutesBefore: 30,
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        pushEnabled: true,
        pushMinutesBefore: [10, 60],
        voiceEnabled: true,
        voiceMinutesBefore: 30,
      }),
      undefined,
    );
  });

  it('push açıkken zaman seçilmemişse kaydı reddeder', async () => {
    const repository = createRepository();
    const useCase = new CreateReminderUseCase(repository);

    expect(() =>
      useCase.execute({
        userId: '1001',
        title: 'Zamansız görev',
        eventDateTime: '2099-08-12T09:30:00.000Z',
        urgent: false,
        pushEnabled: true,
        pushMinutesBefore: [],
      }),
    ).toThrow(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
    expect(repository.create).not.toHaveBeenCalled();
  });
});
