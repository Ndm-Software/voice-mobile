import { quietHourDays, type QuietHour, type SaveQuietHourInput } from '@/domain/models/quiet-hour';
import {
  QuietHoursRequestError,
  type QuietHoursRepository,
} from '@/domain/repositories/quiet-hours-repository';

export interface GetQuietHours {
  execute(userId: string, signal?: AbortSignal): Promise<readonly QuietHour[]>;
}

export class GetQuietHoursUseCase implements GetQuietHours {
  constructor(private readonly repository: QuietHoursRepository) {}

  execute(userId: string, signal?: AbortSignal): Promise<readonly QuietHour[]> {
    return this.repository.list(userId, signal);
  }
}

export interface SaveQuietHour {
  execute(userId: string, input: SaveQuietHourInput, signal?: AbortSignal): Promise<QuietHour>;
}

export class SaveQuietHourUseCase implements SaveQuietHour {
  constructor(private readonly repository: QuietHoursRepository) {}

  execute(userId: string, input: SaveQuietHourInput, signal?: AbortSignal): Promise<QuietHour> {
    validateQuietHour(input);
    return input.id
      ? this.repository.update(userId, { ...input, id: input.id }, signal)
      : this.repository.create(userId, input, signal);
  }
}

export interface DeleteQuietHour {
  execute(userId: string, quietHourId: string, signal?: AbortSignal): Promise<void>;
}

export class DeleteQuietHourUseCase implements DeleteQuietHour {
  constructor(private readonly repository: QuietHoursRepository) {}

  execute(userId: string, quietHourId: string, signal?: AbortSignal): Promise<void> {
    if (!quietHourId) {
      return Promise.reject(
        new QuietHoursRequestError('NOT_FOUND', 'Sessiz saat kaydı bulunamadı.'),
      );
    }
    return this.repository.remove(userId, quietHourId, signal);
  }
}

export interface ApplyQuietHoursToAllDays {
  execute(
    userId: string,
    current: readonly QuietHour[],
    start: string,
    end: string,
    signal?: AbortSignal,
  ): Promise<readonly QuietHour[]>;
}

export class ApplyQuietHoursToAllDaysUseCase implements ApplyQuietHoursToAllDays {
  constructor(private readonly repository: QuietHoursRepository) {}

  async execute(
    userId: string,
    current: readonly QuietHour[],
    start: string,
    end: string,
    signal?: AbortSignal,
  ): Promise<readonly QuietHour[]> {
    validateQuietHour({ dayOfWeek: 'monday', start, end });
    const records: QuietHour[] = [];
    for (const dayOfWeek of quietHourDays) {
      if (signal?.aborted) throw new DOMException('İstek iptal edildi.', 'AbortError');
      const existing = current.find((entry) => entry.dayOfWeek === dayOfWeek);
      records.push(
        existing
          ? await this.repository.update(userId, { id: existing.id, dayOfWeek, start, end }, signal)
          : await this.repository.create(userId, { dayOfWeek, start, end }, signal),
      );
    }
    return records;
  }
}

export function validateQuietHour(input: SaveQuietHourInput): void {
  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!quietHourDays.includes(input.dayOfWeek)) {
    throw new QuietHoursRequestError('VALIDATION_ERROR', 'Geçerli bir gün seçin.');
  }
  if (!timePattern.test(input.start) || !timePattern.test(input.end)) {
    throw new QuietHoursRequestError('VALIDATION_ERROR', 'Saatleri SS:DD biçiminde seçin.');
  }
  if (input.start === input.end) {
    throw new QuietHoursRequestError(
      'VALIDATION_ERROR',
      'Başlangıç ve bitiş saatleri farklı olmalıdır.',
    );
  }
}
