import type { Reminder } from '@/domain/models/reminder';
import {
  ReminderRequestError,
  type ChangeReminderStatusInput,
  type ReminderRepository,
  type UpdateReminderInput,
} from '@/domain/repositories/reminder-repository';

export interface GetReminderDetails {
  execute(userId: string, reminderId: string, signal?: AbortSignal): Promise<Reminder>;
}

export class GetReminderDetailsUseCase implements GetReminderDetails {
  constructor(private readonly repository: ReminderRepository) {}

  execute(userId: string, reminderId: string, signal?: AbortSignal): Promise<Reminder> {
    if (!userId || !reminderId) {
      return Promise.reject(new ReminderRequestError('NOT_FOUND', 'Hatırlatıcı bulunamadı.'));
    }

    return this.repository.getById(userId, reminderId, signal);
  }
}

export interface UpdateReminder {
  execute(input: UpdateReminderInput, signal?: AbortSignal): Promise<Reminder>;
}

export class UpdateReminderUseCase implements UpdateReminder {
  constructor(private readonly repository: ReminderRepository) {}

  execute(input: UpdateReminderInput, signal?: AbortSignal): Promise<Reminder> {
    const title = input.title.trim();
    const description = input.description.trim();
    const errors: Partial<Record<'title' | 'eventDateTime', string>> = {};

    if (!title) {
      errors.title = 'Başlık zorunludur.';
    } else if (title.length > 255) {
      errors.title = 'Başlık 255 karakterden kısa olmalıdır.';
    }

    const eventTime = Date.parse(input.eventDateTime);
    if (!Number.isFinite(eventTime)) {
      errors.eventDateTime = 'Geçerli bir tarih ve saat seçin.';
    } else if (eventTime <= Date.now()) {
      errors.eventDateTime = 'Geçmiş bir tarih veya saat seçemezsiniz.';
    }

    if (Object.keys(errors).length > 0) {
      throw new ReminderRequestError('VALIDATION_ERROR', 'Hatırlatıcı bilgilerini kontrol edin.', {
        title: errors.title,
        eventDateTime: errors.eventDateTime,
      });
    }

    return this.repository.update(
      {
        id: input.id,
        userId: input.userId,
        title,
        description,
        eventDateTime: input.eventDateTime,
        urgent: input.urgent,
      },
      signal,
    );
  }
}

export interface DeleteReminder {
  execute(userId: string, reminderId: string, signal?: AbortSignal): Promise<void>;
}

export class DeleteReminderUseCase implements DeleteReminder {
  constructor(private readonly repository: ReminderRepository) {}

  execute(userId: string, reminderId: string, signal?: AbortSignal): Promise<void> {
    return this.repository.remove(userId, reminderId, signal);
  }
}

export interface ChangeReminderStatus {
  execute(input: ChangeReminderStatusInput, signal?: AbortSignal): Promise<Reminder>;
}

export class ChangeReminderStatusUseCase implements ChangeReminderStatus {
  constructor(private readonly repository: ReminderRepository) {}

  execute(input: ChangeReminderStatusInput, signal?: AbortSignal): Promise<Reminder> {
    return this.repository.changeStatus(input, signal);
  }
}
