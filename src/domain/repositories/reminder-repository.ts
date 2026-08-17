import type {Reminder,ReminderHistory,} from '@/domain/models/reminder';

export type ReminderListFilter = 'active' | 'history';

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
}

export interface UpdateReminderInput {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly description: string;
  readonly eventDateTime: string;
  readonly urgent: boolean;
}

export interface ChangeReminderStatusInput {
  readonly id: string;
  readonly userId: string;
  readonly status: Extract<
  Reminder['status'],
  'active' | 'completed' | 'cancelled'
>;
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
    filter?: ReminderListFilter,
    signal?: AbortSignal,
  ): Promise<readonly Reminder[]>;

  create(input: CreateReminderInput, signal?: AbortSignal): Promise<Reminder>;

  getById(userId: string, reminderId: string, signal?: AbortSignal): Promise<Reminder>;

  update(input: UpdateReminderInput, signal?: AbortSignal): Promise<Reminder>;

  remove(userId: string, reminderId: string, signal?: AbortSignal): Promise<void>;

  changeStatus(input: ChangeReminderStatusInput, signal?: AbortSignal): Promise<Reminder>;

  history(
  userId: string,
  signal?: AbortSignal,
): Promise<readonly ReminderHistory[]>;

}
