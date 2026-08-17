import type { Reminder } from '@/domain/models/reminder';
import type { ReminderRepository } from '@/domain/repositories/reminder-repository';

import {
  ChangeReminderStatusUseCase,
  DeleteReminderUseCase,
  GetReminderDetailsUseCase,
  UpdateReminderUseCase,
} from './manage-reminder';

const reminder: Reminder = {
  id: '6001',
  userId: '1001',
  title: 'Doktor kontrolü',
  eventDateTime: '2099-08-20T09:30:00.000Z',
  repeatType: 'none',
  status: 'active',
  urgent: false,
  pushSettings: [],
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-08-01T10:00:00.000Z',
};

function createRepository(overrides: Partial<ReminderRepository> = {}): ReminderRepository {
  return {
    list: jest.fn(),
    create: jest.fn(),
    history: jest.fn().mockResolvedValue([]),
    getById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    changeStatus: jest.fn(),
    ...overrides,
  };
}

describe('reminder yönetim use-case akışı', () => {
  it('detayı kullanıcı ve reminder kimliğiyle ister', async () => {
    const repository = createRepository({ getById: jest.fn().mockResolvedValue(reminder) });
    const useCase = new GetReminderDetailsUseCase(repository);

    await expect(useCase.execute('1001', '6001')).resolves.toEqual(reminder);
    expect(repository.getById).toHaveBeenCalledWith('1001', '6001', undefined);
  });

  it('düzenleme alanlarını temizleyerek repositorye aktarır', async () => {
    const repository = createRepository({ update: jest.fn().mockResolvedValue(reminder) });
    const useCase = new UpdateReminderUseCase(repository);

    await useCase.execute({
      id: '6001',
      userId: '1001',
      title: '  Doktor kontrolü  ',
      description: '  Sonuçları götür  ',
      eventDateTime: '2099-08-20T09:30:00.000Z',
      urgent: true,
    });

    expect(repository.update).toHaveBeenCalledWith(
      {
        id: '6001',
        userId: '1001',
        title: 'Doktor kontrolü',
        description: 'Sonuçları götür',
        eventDateTime: '2099-08-20T09:30:00.000Z',
        urgent: true,
      },
      undefined,
    );
  });

  it('geçmiş tarihli düzenlemeyi repository çağırmadan reddeder', () => {
    const repository = createRepository();
    const useCase = new UpdateReminderUseCase(repository);

    expect(() =>
      useCase.execute({
        id: '6001',
        userId: '1001',
        title: 'Doktor kontrolü',
        description: '',
        eventDateTime: '2020-08-20T09:30:00.000Z',
        urgent: false,
      }),
    ).toThrow(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('silme ve durum değişikliğini repository sınırından yürütür', async () => {
    const repository = createRepository({
      remove: jest.fn().mockResolvedValue(undefined),
      changeStatus: jest.fn().mockResolvedValue({ ...reminder, status: 'completed' }),
    });

    await new DeleteReminderUseCase(repository).execute('1001', '6001');
    await expect(
      new ChangeReminderStatusUseCase(repository).execute({
        id: '6001',
        userId: '1001',
        status: 'completed',
      }),
    ).resolves.toMatchObject({ status: 'completed' });

    expect(repository.remove).toHaveBeenCalledWith('1001', '6001', undefined);
    expect(repository.changeStatus).toHaveBeenCalledWith(
      { id: '6001', userId: '1001', status: 'completed' },
      undefined,
    );
  });
});
