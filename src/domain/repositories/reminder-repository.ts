import type { Reminder } from '@/domain/models/reminder';

export type ReminderListFilter = 'active' | 'history';

export interface CreateReminderInput {
  readonly userId: string;
  readonly title: string;
  readonly description?: string;
  readonly eventDateTime: string;
  readonly urgent: boolean;
}

export type ReminderErrorCode = 'VALIDATION_ERROR' | 'REQUEST_FAILED' | 'BACKEND_UNSUPPORTED';

export class ReminderRequestError extends Error {
  constructor(
    readonly code: ReminderErrorCode,
    message: string,
    readonly fieldErrors: Partial<Record<'title' | 'eventDateTime' | 'form', string>> = {},
  ) {
    super(message);
    this.name = 'ReminderRequestError';
  }
}

export interface ReminderRepository {
  list(
    userId: string,
    filter?: ReminderListFilter,
    signal?: AbortSignal,
  ): Promise<readonly Reminder[]>;

  create(input: CreateReminderInput, signal?: AbortSignal): Promise<Reminder>;
}
