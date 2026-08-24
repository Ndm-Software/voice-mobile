import type { HttpClient } from '@/infrastructure/http/http-client';
import { HttpError } from '@/infrastructure/http/http-client';

import { HttpQuietHoursRepository } from './http-quiet-hours-repository';

describe('HttpQuietHoursRepository', () => {
  it('backend alanlarını mobil modele çevirir ve gün sırasına dizer', async () => {
    const client = createClient();
    jest
      .mocked(client.get)
      .mockResolvedValue([createDto('quiet-2', 'TUESDAY'), createDto('quiet-1', 'MONDAY')]);
    const repository = new HttpQuietHoursRepository(client, '/silent-hours');

    await expect(repository.list('user-1')).resolves.toMatchObject([
      { id: 'quiet-1', dayOfWeek: 'monday', start: '09:00', end: '17:00' },
      { id: 'quiet-2', dayOfWeek: 'tuesday', start: '09:00', end: '17:00' },
    ]);
  });

  it('oluşturma ve güncellemede backend sözleşmesini kullanır', async () => {
    const client = createClient();
    jest.mocked(client.post).mockResolvedValue(createDto('quiet-1', 'MONDAY'));
    jest.mocked(client.patch).mockResolvedValue(createDto('quiet-1', 'MONDAY'));
    const repository = new HttpQuietHoursRepository(client, '/silent-hours');

    await repository.create('user-1', { dayOfWeek: 'monday', start: '09:00', end: '17:00' });
    await repository.update('user-1', {
      id: 'quiet-1',
      dayOfWeek: 'monday',
      start: '09:00',
      end: '17:00',
    });

    const body = { dayOfWeek: 'MONDAY', silentStart: '09:00', silentEnd: '17:00' };
    expect(client.post).toHaveBeenCalledWith('/silent-hours', body, { signal: undefined });
    expect(client.patch).toHaveBeenCalledWith('/silent-hours/quiet-1', body, {
      signal: undefined,
    });
  });

  it('silme yolunu ve çakışma hatasını güvenli biçimde eşler', async () => {
    const client = createClient();
    const repository = new HttpQuietHoursRepository(client, '/silent-hours');

    await repository.remove('user-1', 'quiet-1');
    expect(client.delete).toHaveBeenCalledWith('/silent-hours/quiet-1', { signal: undefined });

    jest.mocked(client.post).mockRejectedValue(new HttpError('Conflict', 409));
    await expect(
      repository.create('user-1', { dayOfWeek: 'monday', start: '09:00', end: '17:00' }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });
});

function createDto(silentHourId: string, dayOfWeek: string) {
  return {
    silentHourId,
    userId: 'user-1',
    dayOfWeek,
    silentStart: '09:00:00',
    silentEnd: '17:00:00',
    createdAt: '2026-08-24T10:00:00.000Z',
    updatedAt: '2026-08-24T10:00:00.000Z',
  };
}

function createClient(): HttpClient {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
  };
}
