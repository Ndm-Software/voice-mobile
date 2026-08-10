import type { HttpClient } from '@/infrastructure/http/http-client';

import { HttpReminderRepository } from './http-reminder-repository';

describe('HttpReminderRepository', () => {
  it('aktif reminder endpointini filtre ile çağırıp DTO mapper kullanır', async () => {
    const httpClient: HttpClient = {
      get: jest.fn().mockResolvedValue([
        {
          id: 6001,
          userId: 1001,
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

    await expect(repository.list('1001')).resolves.toMatchObject([
      { id: '6001', userId: '1001', title: 'Doktor kontrolü' },
    ]);
    expect(httpClient.get).toHaveBeenCalledWith('/reminders?status=active', {
      signal: undefined,
    });
  });
});
