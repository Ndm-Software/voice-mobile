import type { ReminderHistory } from '@/domain/models/reminder';

import type {
  ReminderRepository,
} from '@/domain/repositories/reminder-repository';

export interface GetReminderHistory {
  execute(
    userId: string,
    signal?: AbortSignal,
  ): Promise<readonly ReminderHistory[]>;
}

export class GetReminderHistoryUseCase
  implements GetReminderHistory
{
  constructor(
    private readonly repository: ReminderRepository,
  ) {}

  execute(
    userId: string,
    signal?: AbortSignal,
  ): Promise<readonly ReminderHistory[]> {
    return this.repository.history(userId, signal);
  }
}