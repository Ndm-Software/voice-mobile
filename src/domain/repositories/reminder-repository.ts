import type { Reminder, ReminderRepeatType } from '@/domain/models/reminder';

export type ReminderListFilter = 'active' | 'history' | 'all';

export interface ReminderListQuery {
  readonly filter?: ReminderListFilter;
  readonly search?: string;
  readonly urgent?: boolean;
  readonly startDate?: string;
  readonly endDate?: string;
}

export type ReminderListCriteria = ReminderListFilter | ReminderListQuery;

export type ReminderNotificationMinutes = number;

export interface CreateReminderInput {
  readonly userId: string;
  readonly title: string;
  readonly description?: string;
  readonly eventDateTime: string;
  readonly urgent: boolean;
  readonly pushEnabled?: boolean;
  readonly pushMinutesBefore?: readonly ReminderNotificationMinutes[];
  readonly voiceEnabled?: boolean;
  readonly voiceMinutesBefore?: ReminderNotificationMinutes;
  readonly repeatType?: ReminderRepeatType;
  readonly repeatUntil?: string;
}

export interface UpdateReminderInput {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly description: string;
  readonly eventDateTime: string;
  readonly urgent: boolean;
  readonly repeatType?: ReminderRepeatType;
  readonly repeatUntil?: string;
}

export interface ChangeReminderStatusInput {
  readonly id: string;
  readonly userId: string;
  readonly status: Extract<Reminder['status'], 'active' | 'completed'>;
}

export type ReminderErrorCode =
  'VALIDATION_ERROR' | 'DUPLICATE' | 'NOT_FOUND' | 'REQUEST_FAILED' | 'BACKEND_UNSUPPORTED';

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
    criteria?: ReminderListCriteria,
    signal?: AbortSignal,
  ): Promise<readonly Reminder[]>;

  create(input: CreateReminderInput, signal?: AbortSignal): Promise<Reminder>;

  getById(userId: string, reminderId: string, signal?: AbortSignal): Promise<Reminder>;

  update(input: UpdateReminderInput, signal?: AbortSignal): Promise<Reminder>;

  remove(userId: string, reminderId: string, signal?: AbortSignal): Promise<void>;

  changeStatus(input: ChangeReminderStatusInput, signal?: AbortSignal): Promise<Reminder>;
}
