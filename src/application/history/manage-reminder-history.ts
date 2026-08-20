import type { ReminderHistory } from '@/domain/models/reminder';
import {
  ReminderHistoryRequestError,
  type ReminderHistoryRepository,
} from '@/domain/repositories/reminder-history-repository';

export interface GetReminderHistory {
  execute(reminderId?: string, signal?: AbortSignal): Promise<readonly ReminderHistory[]>;
}

export class GetReminderHistoryUseCase implements GetReminderHistory {
  constructor(private readonly repository: ReminderHistoryRepository) {}

  execute(reminderId?: string, signal?: AbortSignal): Promise<readonly ReminderHistory[]> {
    return this.repository.list(reminderId, signal);
  }
}

export interface GetReminderHistoryDetails {
  execute(historyId: string, signal?: AbortSignal): Promise<ReminderHistory>;
}

export class GetReminderHistoryDetailsUseCase implements GetReminderHistoryDetails {
  constructor(private readonly repository: ReminderHistoryRepository) {}

  execute(historyId: string, signal?: AbortSignal): Promise<ReminderHistory> {
    if (!historyId) {
      return Promise.reject(
        new ReminderHistoryRequestError('NOT_FOUND', 'Geçmiş kaydı bulunamadı.'),
      );
    }
    return this.repository.getById(historyId, signal);
  }
}

export interface DeleteReminderHistory {
  execute(historyId: string, signal?: AbortSignal): Promise<void>;
}

export class DeleteReminderHistoryUseCase implements DeleteReminderHistory {
  constructor(private readonly repository: ReminderHistoryRepository) {}

  execute(historyId: string, signal?: AbortSignal): Promise<void> {
    if (!historyId) {
      return Promise.reject(
        new ReminderHistoryRequestError('NOT_FOUND', 'Geçmiş kaydı bulunamadı.'),
      );
    }
    return this.repository.remove(historyId, signal);
  }
}
