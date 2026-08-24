import type { QuietHoursRepository } from '@/domain/repositories/quiet-hours-repository';

import {
  ApplyQuietHoursToAllDaysUseCase,
  DeleteQuietHourUseCase,
  GetQuietHoursUseCase,
  SaveQuietHourUseCase,
} from './manage-quiet-hours';

describe('quiet hours use cases', () => {
  it('listelemeyi repositoryye iletir ve yeni kaydı oluşturur', async () => {
    const repository = createRepository();
    const list = new GetQuietHoursUseCase(repository);
    const save = new SaveQuietHourUseCase(repository);

    await list.execute('user-1');
    await save.execute('user-1', { dayOfWeek: 'monday', start: '09:00', end: '17:00' });

    expect(repository.list).toHaveBeenCalledWith('user-1', undefined);
    expect(repository.create).toHaveBeenCalledWith(
      'user-1',
      { dayOfWeek: 'monday', start: '09:00', end: '17:00' },
      undefined,
    );
  });

  it('kimlik verilen kaydı günceller ve geçersiz saatleri reddeder', async () => {
    const repository = createRepository();
    const save = new SaveQuietHourUseCase(repository);

    await save.execute('user-1', {
      id: 'quiet-1',
      dayOfWeek: 'monday',
      start: '09:30',
      end: '17:30',
    });
    expect(repository.update).toHaveBeenCalledWith(
      'user-1',
      { id: 'quiet-1', dayOfWeek: 'monday', start: '09:30', end: '17:30' },
      undefined,
    );
    expect(() =>
      save.execute('user-1', { dayOfWeek: 'monday', start: '25:00', end: '07:00' }),
    ).toThrow('Saatleri SS:DD biçiminde seçin.');
    expect(() =>
      save.execute('user-1', { dayOfWeek: 'monday', start: '07:00', end: '07:00' }),
    ).toThrow('Başlangıç ve bitiş saatleri farklı olmalıdır.');
    await expect(
      save.execute('user-1', { dayOfWeek: 'monday', start: '23:00', end: '07:00' }),
    ).resolves.toMatchObject({ start: '23:00', end: '07:00' });
  });

  it('aynı aralığı mevcut kayıtları güncelleyip eksik günleri oluşturarak tüm haftaya uygular', async () => {
    const repository = createRepository();
    const applyAll = new ApplyQuietHoursToAllDaysUseCase(repository);

    const result = await applyAll.execute(
      'user-1',
      [createRecord('quiet-1', 'monday')],
      '09:00',
      '17:00',
    );

    expect(result).toHaveLength(7);
    expect(repository.update).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledTimes(6);
  });

  it('boş kayıt kimliğini silmeye çalışmaz', async () => {
    const repository = createRepository();
    const remove = new DeleteQuietHourUseCase(repository);

    await expect(remove.execute('user-1', '')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(repository.remove).not.toHaveBeenCalled();
  });
});

function createRecord(id: string, dayOfWeek: 'monday') {
  return {
    id,
    userId: 'user-1',
    dayOfWeek,
    start: '22:00',
    end: '06:00',
    createdAt: '2026-08-24T10:00:00.000Z',
    updatedAt: '2026-08-24T10:00:00.000Z',
  } as const;
}

function createRepository(): QuietHoursRepository {
  return {
    list: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockImplementation((userId, input) =>
      Promise.resolve({
        ...input,
        id: `quiet-${input.dayOfWeek}`,
        userId,
        createdAt: '2026-08-24T10:00:00.000Z',
        updatedAt: '2026-08-24T10:00:00.000Z',
      }),
    ),
    update: jest.fn().mockImplementation((userId, input) =>
      Promise.resolve({
        ...input,
        userId,
        createdAt: '2026-08-24T10:00:00.000Z',
        updatedAt: '2026-08-24T10:00:00.000Z',
      }),
    ),
    remove: jest.fn().mockResolvedValue(undefined),
  };
}
