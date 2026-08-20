import type { ReminderHistory } from '@/domain/models/reminder';

export class ReminderHistoryRequestError extends Error {
  constructor(
    readonly code: 'NOT_FOUND' | 'REQUEST_FAILED',
    message: string,
  ) {
    super(message);
    this.name = 'ReminderHistoryRequestError';
  }
}

export interface ReminderHistoryRepository {
  list(reminderId?: string, signal?: AbortSignal): Promise<readonly ReminderHistory[]>;
  getById(historyId: string, signal?: AbortSignal): Promise<ReminderHistory>;
  remove(historyId: string, signal?: AbortSignal): Promise<void>;
}
