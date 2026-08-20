import type { HttpClient } from '@/infrastructure/http/http-client';
import { HttpError } from '@/infrastructure/http/http-client';

import { HttpReminderHistoryRepository } from './http-reminder-history-repository';

describe('HttpReminderHistoryRepository', () => {
  it('backend history DTO alanlarını mobil modele çevirir', async () => {
    const client = createClient();
    jest.mocked(client.get).mockResolvedValue([
      {
        historyId: 'history-1',
        reminderId: 'reminder-1',
        historyType: 'PUSH',
        status: 'SUCCESS',
        provider: 'firebase',
        sentAt: '2026-08-19T14:40:00.000Z',
        attempt: 1,
        errorMessage: null,
      },
      {
        historyId: 'history-2',
        reminderId: 'reminder-2',
        historyType: 'VOICE_CALL',
        status: 'FAILED',
        provider: 'twilio',
        sentAt: null,
        attempt: 2,
        errorMessage: 'provider detail',
      },
    ]);
    const repository = new HttpReminderHistoryRepository(client, '/reminder-history');

    await expect(repository.list()).resolves.toEqual([
      {
        id: 'history-1',
        reminderId: 'reminder-1',
        type: 'push',
        status: 'success',
        provider: 'firebase',
        sentAt: '2026-08-19T14:40:00.000Z',
        attempt: 1,
      },
      {
        id: 'history-2',
        reminderId: 'reminder-2',
        type: 'voice-call',
        status: 'failed',
        provider: 'twilio',
        attempt: 2,
        userMessage: 'Gönderim tamamlanamadı.',
      },
    ]);
  });

  it('reminder filtresini query olarak gönderir ve detay kaydını okur', async () => {
    const client = createClient();
    jest.mocked(client.get).mockResolvedValueOnce([]).mockResolvedValueOnce({
      historyId: 'history-1',
      reminderId: 'reminder-1',
      historyType: 'PUSH',
      status: 'PENDING',
      attempt: 0,
    });
    const repository = new HttpReminderHistoryRepository(client, '/reminder-history');

    await repository.list('reminder-1');
    await repository.getById('history-1');

    expect(client.get).toHaveBeenNthCalledWith(1, '/reminder-history?reminderId=reminder-1', {
      signal: undefined,
    });
    expect(client.get).toHaveBeenNthCalledWith(2, '/reminder-history/history-1', {
      signal: undefined,
    });
  });

  it('kaydı siler ve 404 cevabını güvenli domain hatasına çevirir', async () => {
    const client = createClient();
    const repository = new HttpReminderHistoryRepository(client, '/reminder-history');

    await repository.remove('history-1');
    expect(client.delete).toHaveBeenCalledWith('/reminder-history/history-1', {
      signal: undefined,
    });

    jest.mocked(client.get).mockRejectedValue(new HttpError('Not found', 404));
    await expect(repository.getById('missing')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

function createClient(): HttpClient {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
  };
}
