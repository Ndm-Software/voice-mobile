import type { Reminder } from '@/domain/models/reminder';
import type {
  ReminderListCriteria,
  ReminderRepository,
} from '@/domain/repositories/reminder-repository';

export interface GetReminders {
  execute(
    userId?: string,
    criteria?: ReminderListCriteria,
    signal?: AbortSignal,
  ): Promise<readonly Reminder[]>;
}

export class GetRemindersUseCase implements GetReminders {
  constructor(private readonly repository: ReminderRepository) {}

  execute(
    userId = '',
    criteria: ReminderListCriteria = 'active',
    signal?: AbortSignal,
  ): Promise<readonly Reminder[]> {
    return this.repository.list(userId, criteria, signal);
  }
}
