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

describe('CreateReminderUseCase', () => {
  it('başlığı temizleyerek repository üzerinden reminder oluşturur', async () => {
    const repository: ReminderRepository = {
      list: jest.fn(),
      create: jest.fn().mockResolvedValue(reminder),
    };
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
    const repository: ReminderRepository = {
      list: jest.fn(),
      create: jest.fn(),
    };
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
});
