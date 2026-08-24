import { quietHourDays, type QuietHour, type QuietHourDay } from '@/domain/models/quiet-hour';
import {
  QuietHoursRequestError,
  type QuietHoursRepository,
} from '@/domain/repositories/quiet-hours-repository';
import type { MockDatabase } from '@/infrastructure/mock/database/persistent-mock-database';

export class MockQuietHoursRepository implements QuietHoursRepository {
  constructor(
    private readonly database: MockDatabase,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async list(userId: string): Promise<readonly QuietHour[]> {
    const state = await this.database.read();
    return state.quietHours
      .filter((entry) => entry.userId === userId)
      .sort(
        (left, right) =>
          quietHourDays.indexOf(left.dayOfWeek) - quietHourDays.indexOf(right.dayOfWeek),
      );
  }

  async create(
    userId: string,
    input: { readonly dayOfWeek: QuietHourDay; readonly start: string; readonly end: string },
  ): Promise<QuietHour> {
    const state = await this.database.read();
    if (
      state.quietHours.some(
        (entry) => entry.userId === userId && entry.dayOfWeek === input.dayOfWeek,
      )
    ) {
      throw new QuietHoursRequestError('CONFLICT', 'Bu gün için zaten bir sessiz saat bulunuyor.');
    }
    const timestamp = this.now().toISOString();
    const entry: QuietHour = {
      id: `quiet-${userId}-${input.dayOfWeek}`,
      userId,
      ...input,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await this.database.replace({ ...state, quietHours: [...state.quietHours, entry] });
    return entry;
  }

  async update(
    userId: string,
    input: {
      readonly id: string;
      readonly dayOfWeek: QuietHourDay;
      readonly start: string;
      readonly end: string;
    },
  ): Promise<QuietHour> {
    const state = await this.database.read();
    const current = state.quietHours.find(
      (entry) => entry.id === input.id && entry.userId === userId,
    );
    if (!current) {
      throw new QuietHoursRequestError('NOT_FOUND', 'Sessiz saat kaydı bulunamadı.');
    }
    if (
      state.quietHours.some(
        (entry) =>
          entry.id !== input.id && entry.userId === userId && entry.dayOfWeek === input.dayOfWeek,
      )
    ) {
      throw new QuietHoursRequestError('CONFLICT', 'Bu gün için zaten bir sessiz saat bulunuyor.');
    }
    const updated: QuietHour = { ...current, ...input, updatedAt: this.now().toISOString() };
    await this.database.replace({
      ...state,
      quietHours: state.quietHours.map((entry) => (entry.id === input.id ? updated : entry)),
    });
    return updated;
  }

  async remove(userId: string, quietHourId: string): Promise<void> {
    const state = await this.database.read();
    const exists = state.quietHours.some(
      (entry) => entry.id === quietHourId && entry.userId === userId,
    );
    if (!exists) {
      throw new QuietHoursRequestError('NOT_FOUND', 'Sessiz saat kaydı bulunamadı.');
    }
    await this.database.replace({
      ...state,
      quietHours: state.quietHours.filter((entry) => entry.id !== quietHourId),
    });
  }
}
