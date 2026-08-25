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

  it('arama, önem ve tarih aralığını backend sorgu parametrelerine dönüştürür', async () => {
    const httpClient: HttpClient = {
      get: jest.fn().mockResolvedValue([]),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };
    const repository = new HttpReminderRepository(httpClient, { list: '/reminders' });

    await repository.list('user-id', {
      filter: 'all',
      search: '  doktor kontrolü  ',
      urgent: true,
      startDate: '2026-08-01T00:00:00.000Z',
      endDate: '2026-08-31T23:59:59.999Z',
    });

    expect(httpClient.get).toHaveBeenCalledWith(
      '/reminders?search=doktor%20kontrol%C3%BC&isUrgent=true&startDate=2026-08-01T00%3A00%3A00.000Z&endDate=2026-08-31T23%3A59%3A59.999Z',
      { signal: undefined },
    );
  });

  it('detay, güncelleme ve silme uçlarını UUID rota parametresiyle çağırır', async () => {
    const reminderId = '16ba0196-904d-4c21-b959-e9bf4b1017b5';
    const userId = '6bfbe9b4-8ce0-4f39-a2c1-417b4ab7ca7c';
    const response = {
      reminderId,
      userId,
      title: 'Doktor kontrolü',
      eventDatetime: '2099-08-20T09:30:00.000Z',
      repeatType: 'DAILY',
      status: 'ACTIVE',
      isUrgent: true,
      pushNotifications: [],
      voiceCallSettings: [],
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-14T10:00:00.000Z',
    };
    const httpClient: HttpClient = {
      get: jest.fn().mockResolvedValue(response),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn().mockResolvedValue(response),
      delete: jest.fn().mockResolvedValue({ message: 'Silindi.' }),
    };
    const repository = new HttpReminderRepository(httpClient, { list: '/reminders' });

    await expect(repository.getById(userId, reminderId)).resolves.toMatchObject({
      id: reminderId,
      status: 'active',
    });
    await repository.update({
      id: reminderId,
      userId,
      title: 'Doktor kontrolü',
      description: 'Sonuçları götür',
      eventDateTime: '2099-08-20T09:30:00.000Z',
      urgent: true,
    });
    await repository.remove(userId, reminderId);

    expect(httpClient.get).toHaveBeenCalledWith(`/reminders/${reminderId}`, {
      signal: undefined,
    });
    expect(httpClient.patch).toHaveBeenCalledWith(
      `/reminders/${reminderId}`,
      {
        title: 'Doktor kontrolü',
        description: 'Sonuçları götür',
        eventDatetime: '2099-08-20T09:30:00.000Z',
        isUrgent: true,
      },
      { signal: undefined },
    );
    expect(httpClient.delete).toHaveBeenCalledWith(`/reminders/${reminderId}`, {
      signal: undefined,
    });
  });

  it('backend status güncellemesini desteklemiyorsa açık hata döndürür', async () => {
    const httpClient: HttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };
    const repository = new HttpReminderRepository(httpClient, { list: '/reminders' });

    await expect(
      repository.changeStatus({ id: 'reminder-id', userId: 'user-id', status: 'completed' }),
    ).rejects.toMatchObject({ code: 'BACKEND_UNSUPPORTED' });
    expect(httpClient.patch).not.toHaveBeenCalled();
  });
});
