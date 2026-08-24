import type { QuietHour, SaveQuietHourInput } from '@/domain/models/quiet-hour';

export class QuietHoursRequestError extends Error {
  constructor(
    readonly code: 'CONFLICT' | 'NOT_FOUND' | 'REQUEST_FAILED' | 'VALIDATION_ERROR',
    message: string,
  ) {
    super(message);
    this.name = 'QuietHoursRequestError';
  }
}

export interface QuietHoursRepository {
  list(userId: string, signal?: AbortSignal): Promise<readonly QuietHour[]>;
  create(
    userId: string,
    input: Omit<SaveQuietHourInput, 'id'>,
    signal?: AbortSignal,
  ): Promise<QuietHour>;
  update(
    userId: string,
    input: SaveQuietHourInput & { readonly id: string },
    signal?: AbortSignal,
  ): Promise<QuietHour>;
  remove(userId: string, quietHourId: string, signal?: AbortSignal): Promise<void>;
}
