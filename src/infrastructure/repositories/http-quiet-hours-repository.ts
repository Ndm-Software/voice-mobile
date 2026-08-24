import { quietHourDays, type QuietHour, type QuietHourDay } from '@/domain/models/quiet-hour';
import {
  QuietHoursRequestError,
  type QuietHoursRepository,
} from '@/domain/repositories/quiet-hours-repository';
import { HttpError, type HttpClient } from '@/infrastructure/http/http-client';

interface QuietHourDto {
  readonly silentHourId: string | number;
  readonly userId: string | number;
  readonly dayOfWeek: string;
  readonly silentStart: string;
  readonly silentEnd: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export class HttpQuietHoursRepository implements QuietHoursRepository {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly endpoint: string,
  ) {}

  async list(_userId: string, signal?: AbortSignal): Promise<readonly QuietHour[]> {
    try {
      const response = await this.httpClient.get<readonly QuietHourDto[]>(this.endpoint, {
        signal,
      });
      return response.map(mapQuietHour).sort(compareQuietHours);
    } catch (error) {
      throw mapQuietHoursError(error);
    }
  }

  async create(
    _userId: string,
    input: { readonly dayOfWeek: QuietHourDay; readonly start: string; readonly end: string },
    signal?: AbortSignal,
  ): Promise<QuietHour> {
    try {
      const response = await this.httpClient.post<QuietHourDto>(this.endpoint, toRequest(input), {
        signal,
      });
      return mapQuietHour(response);
    } catch (error) {
      throw mapQuietHoursError(error);
    }
  }

  async update(
    _userId: string,
    input: {
      readonly id: string;
      readonly dayOfWeek: QuietHourDay;
      readonly start: string;
      readonly end: string;
    },
    signal?: AbortSignal,
  ): Promise<QuietHour> {
    try {
      const response = await this.httpClient.patch<QuietHourDto>(
        `${this.endpoint}/${encodeURIComponent(input.id)}`,
        toRequest(input),
        { signal },
      );
      return mapQuietHour(response);
    } catch (error) {
      throw mapQuietHoursError(error);
    }
  }

  async remove(_userId: string, quietHourId: string, signal?: AbortSignal): Promise<void> {
    try {
      await this.httpClient.delete<unknown>(`${this.endpoint}/${encodeURIComponent(quietHourId)}`, {
        signal,
      });
    } catch (error) {
      throw mapQuietHoursError(error);
    }
  }
}

function toRequest(input: {
  readonly dayOfWeek: QuietHourDay;
  readonly start: string;
  readonly end: string;
}) {
  return {
    dayOfWeek: input.dayOfWeek.toUpperCase(),
    silentStart: input.start,
    silentEnd: input.end,
  };
}

function mapQuietHour(dto: QuietHourDto): QuietHour {
  const dayOfWeek = dto.dayOfWeek.toLowerCase() as QuietHourDay;
  if (!quietHourDays.includes(dayOfWeek)) {
    throw new QuietHoursRequestError('REQUEST_FAILED', 'Sessiz saat gün bilgisi geçersiz.');
  }
  return {
    id: String(dto.silentHourId),
    userId: String(dto.userId),
    dayOfWeek,
    start: dto.silentStart.slice(0, 5),
    end: dto.silentEnd.slice(0, 5),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function compareQuietHours(left: QuietHour, right: QuietHour): number {
  return quietHourDays.indexOf(left.dayOfWeek) - quietHourDays.indexOf(right.dayOfWeek);
}

function mapQuietHoursError(error: unknown): Error {
  if (error instanceof QuietHoursRequestError) return error;
  if (error instanceof HttpError && error.status === 404) {
    return new QuietHoursRequestError('NOT_FOUND', 'Sessiz saat kaydı bulunamadı.');
  }
  if (error instanceof HttpError && error.status === 409) {
    return new QuietHoursRequestError('CONFLICT', 'Bu gün için zaten bir sessiz saat bulunuyor.');
  }
  if (error instanceof HttpError && error.status === 400) {
    return new QuietHoursRequestError('VALIDATION_ERROR', 'Sessiz saat bilgilerini kontrol edin.');
  }
  if (error instanceof HttpError) {
    return new QuietHoursRequestError(
      'REQUEST_FAILED',
      'Sessiz saat işlemi şu anda tamamlanamadı.',
    );
  }
  return error instanceof Error ? error : new Error('Sessiz saat isteği tamamlanamadı.');
}
