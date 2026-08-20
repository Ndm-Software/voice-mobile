import type {
  ReminderHistory,
  ReminderHistoryStatus,
  ReminderHistoryType,
} from '@/domain/models/reminder';
import {
  ReminderHistoryRequestError,
  type ReminderHistoryRepository,
} from '@/domain/repositories/reminder-history-repository';
import { HttpError, type HttpClient } from '@/infrastructure/http/http-client';

interface ReminderHistoryDto {
  readonly historyId: string | number;
  readonly reminderId: string | number;
  readonly historyType: string;
  readonly status: string;
  readonly provider?: string | null;
  readonly sentAt?: string | null;
  readonly attempt?: number;
  readonly errorMessage?: string | null;
}

export class HttpReminderHistoryRepository implements ReminderHistoryRepository {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly endpoint: string,
  ) {}

  async list(reminderId?: string, signal?: AbortSignal): Promise<readonly ReminderHistory[]> {
    try {
      const query = reminderId ? `?reminderId=${encodeURIComponent(reminderId)}` : '';
      const response = await this.httpClient.get<readonly ReminderHistoryDto[]>(
        `${this.endpoint}${query}`,
        { signal },
      );
      return response.map(mapHistory);
    } catch (error) {
      throw mapHistoryError(error);
    }
  }

  async getById(historyId: string, signal?: AbortSignal): Promise<ReminderHistory> {
    try {
      const response = await this.httpClient.get<ReminderHistoryDto>(
        `${this.endpoint}/${encodeURIComponent(historyId)}`,
        { signal },
      );
      return mapHistory(response);
    } catch (error) {
      throw mapHistoryError(error);
    }
  }

  async remove(historyId: string, signal?: AbortSignal): Promise<void> {
    try {
      await this.httpClient.delete<unknown>(`${this.endpoint}/${encodeURIComponent(historyId)}`, {
        signal,
      });
    } catch (error) {
      throw mapHistoryError(error);
    }
  }
}

function mapHistory(dto: ReminderHistoryDto): ReminderHistory {
  return {
    id: String(dto.historyId),
    reminderId: String(dto.reminderId),
    type: mapHistoryType(dto.historyType),
    status: mapHistoryStatus(dto.status),
    ...(dto.provider ? { provider: dto.provider } : {}),
    ...(dto.sentAt ? { sentAt: dto.sentAt } : {}),
    attempt: Number.isFinite(dto.attempt) ? (dto.attempt ?? 0) : 0,
    ...(dto.errorMessage ? { userMessage: 'Gönderim tamamlanamadı.' } : {}),
  };
}

function mapHistoryType(value: string): ReminderHistoryType {
  return value.toUpperCase() === 'VOICE_CALL' ? 'voice-call' : 'push';
}

function mapHistoryStatus(value: string): ReminderHistoryStatus {
  const normalized = value.toUpperCase();
  if (normalized === 'SUCCESS') return 'success';
  if (normalized === 'FAILED') return 'failed';
  return 'pending';
}

function mapHistoryError(error: unknown): Error {
  if (error instanceof HttpError && error.status === 404) {
    return new ReminderHistoryRequestError('NOT_FOUND', 'Geçmiş kaydı bulunamadı.');
  }
  if (error instanceof HttpError) {
    return new ReminderHistoryRequestError(
      'REQUEST_FAILED',
      'Geçmiş bilgileri alınamadı. Lütfen yeniden deneyin.',
    );
  }
  return error instanceof Error ? error : new Error('Geçmiş isteği tamamlanamadı.');
}
