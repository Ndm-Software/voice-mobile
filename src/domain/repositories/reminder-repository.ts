import type { Reminder } from '@/domain/models/reminder';

export type ReminderListFilter = 'active' | 'history';

export interface ReminderRepository {
  list(
    userId: string,
    filter?: ReminderListFilter,
    signal?: AbortSignal,
  ): Promise<readonly Reminder[]>;
}
