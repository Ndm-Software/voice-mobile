import type { HttpClient } from '@/infrastructure/http/http-client';

import { HttpReminderRepository } from './http-reminder-repository';

describe('HttpReminderRepository', () => {
  it('aktif reminder endpointini filtre ile çağırıp DTO mapper kullanır', async () => {
    const reminderId = '16ba0196-904d-4c21-b959-e9bf4b1017b5';
    const userId = '6bfbe9b4-8ce0-4f39-a2c1-417b4ab7ca7c';
    const httpClient: HttpClient = {
      get: jest.fn().mockResolvedValue([
        {
          reminderId,
          userId,
          title: 'Doktor kontrolü',
          eventDateTime: '2026-08-11T09:30:00+03:00',
          repeatType: 'none',
          status: 'active',
          urgent: false,
          pushSettings: [],
          createdAt: '2026-08-01T12:00:00+03:00',
          updatedAt: '2026-08-01T12:00:00+03:00',
        },
      ]),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };
    const repository = new HttpReminderRepository(httpClient, { list: '/reminders' });

    await expect(repository.list(userId)).resolves.toMatchObject([
      { id: reminderId, userId, title: 'Doktor kontrolü' },
    ]);
    expect(httpClient.get).toHaveBeenCalledWith('/reminders', {
      signal: undefined,
    });
  });
});
