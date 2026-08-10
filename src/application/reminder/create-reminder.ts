import type { Reminder } from '@/domain/models/reminder';
import {
  ReminderRequestError,
  type CreateReminderInput,
  type ReminderRepository,
} from '@/domain/repositories/reminder-repository';

export interface CreateReminder {
  execute(input: CreateReminderInput, signal?: AbortSignal): Promise<Reminder>;
}

export class CreateReminderUseCase implements CreateReminder {
  constructor(private readonly repository: ReminderRepository) {}

  execute(input: CreateReminderInput, signal?: AbortSignal): Promise<Reminder> {
    const title = input.title.trim();
    const description = input.description?.trim() || undefined;
    const errors: Partial<Record<'title' | 'eventDateTime', string>> = {};

    if (!title) {
      errors.title = 'Başlık zorunludur.';
    } else if (title.length > 255) {
      errors.title = 'Başlık 255 karakterden kısa olmalıdır.';
    }

    const eventTime = Date.parse(input.eventDateTime);
    if (!Number.isFinite(eventTime)) {
      errors.eventDateTime = 'Geçerli bir tarih ve saat girin.';
    } else if (eventTime <= Date.now()) {
      errors.eventDateTime = 'Geçmiş bir tarih veya saat seçemezsiniz.';
    }

    if (Object.keys(errors).length > 0) {
      throw new ReminderRequestError('VALIDATION_ERROR', 'Hatırlatıcı bilgilerini kontrol edin.', {
        title: errors.title,
        eventDateTime: errors.eventDateTime,
      });
    }

    return this.repository.create(
      {
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
