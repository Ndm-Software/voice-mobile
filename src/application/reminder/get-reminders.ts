import type { Reminder } from '@/domain/models/reminder';
import type {
  ReminderListFilter,
  ReminderRepository,
} from '@/domain/repositories/reminder-repository';

export interface GetReminders {
  execute(
    userId?: string,
    filter?: ReminderListFilter,
    signal?: AbortSignal,
  ): Promise<readonly Reminder[]>;
}

export class GetRemindersUseCase implements GetReminders {
  constructor(private readonly repository: ReminderRepository) {}

  execute(
    userId = '',
    filter: ReminderListFilter = 'active',
    signal?: AbortSignal,
  ): Promise<readonly Reminder[]> {
    return this.repository.list(userId, filter, signal);
  }
}
