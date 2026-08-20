import type { ReminderHistoryRepository } from '@/domain/repositories/reminder-history-repository';

import {
  DeleteReminderHistoryUseCase,
  GetReminderHistoryDetailsUseCase,
  GetReminderHistoryUseCase,
} from './manage-reminder-history';

describe('reminder history use cases', () => {
  it('liste ve detay çağrılarını repositoryye iletir', async () => {
    const repository = createRepository();
    const list = new GetReminderHistoryUseCase(repository);
    const details = new GetReminderHistoryDetailsUseCase(repository);

    await list.execute('reminder-1');
    await details.execute('history-1');

    expect(repository.list).toHaveBeenCalledWith('reminder-1', undefined);
    expect(repository.getById).toHaveBeenCalledWith('history-1', undefined);
  });

  it('boş kimliği reddeder ve geçerli geçmiş kaydını siler', async () => {
    const repository = createRepository();
    const details = new GetReminderHistoryDetailsUseCase(repository);
    const remove = new DeleteReminderHistoryUseCase(repository);

    await expect(details.execute('')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await remove.execute('history-1');
    expect(repository.remove).toHaveBeenCalledWith('history-1', undefined);
  });
});

function createRepository(): ReminderHistoryRepository {
  return {
    list: jest.fn().mockResolvedValue([]),
    getById: jest.fn().mockResolvedValue({
      id: 'history-1',
      reminderId: 'reminder-1',
      type: 'push',
      status: 'success',
      attempt: 1,
    }),
    remove: jest.fn().mockResolvedValue(undefined),
  };
}
