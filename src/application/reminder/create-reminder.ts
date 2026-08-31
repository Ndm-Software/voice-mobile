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

    const repeatType = input.repeatType ?? 'none';
    const repeatUntilTime = input.repeatUntil ? Date.parse(input.repeatUntil) : undefined;
    if (repeatType !== 'none' && input.repeatUntil && !Number.isFinite(repeatUntilTime)) {
      errors.eventDateTime = 'Tekrar bitiş tarihi geçerli değil.';
    } else if (
      repeatType !== 'none' &&
      repeatUntilTime !== undefined &&
      Number.isFinite(eventTime) &&
      repeatUntilTime < eventTime
    ) {
      errors.eventDateTime = 'Tekrar bitişi, hatırlatıcı tarihinden önce olamaz.';
    }

    if (Object.keys(errors).length > 0) {
      throw new ReminderRequestError('VALIDATION_ERROR', 'Hatırlatıcı bilgilerini kontrol edin.', {
        title: errors.title,
        eventDateTime: errors.eventDateTime,
      });
    }

    const pushMinutesBefore = input.pushEnabled === false ? [] : input.pushMinutesBefore;
    const voiceMinutesBefore = input.voiceEnabled ? input.voiceMinutesBefore : undefined;
    if (
      pushMinutesBefore?.some((minutes) => !Number.isInteger(minutes) || minutes <= 0) ||
      (pushMinutesBefore?.length ?? 0) > 1 ||
      (input.pushEnabled === true && (pushMinutesBefore?.length ?? 0) === 0) ||
      (input.voiceEnabled &&
        (!Number.isInteger(voiceMinutesBefore) || (voiceMinutesBefore ?? 0) <= 0))
    ) {
      throw new ReminderRequestError('VALIDATION_ERROR', 'Bildirim sürelerini kontrol edin.', {
        form:
          (pushMinutesBefore?.length ?? 0) > 1
            ? 'Şimdilik yalnızca bir push bildirim zamanı seçilebilir.'
            : 'Bildirim süreleri sıfırdan büyük tam sayı olmalıdır.',
      });
    }

    return this.repository.create(
      {
        userId: input.userId,
        title,
        ...(description ? { description } : {}),
        eventDateTime: input.eventDateTime,
        urgent: input.urgent,
        repeatType,
        ...(repeatType !== 'none' && input.repeatUntil ? { repeatUntil: input.repeatUntil } : {}),
        ...(input.pushEnabled !== undefined ? { pushEnabled: input.pushEnabled } : {}),
        ...(pushMinutesBefore ? { pushMinutesBefore } : {}),
        ...(input.voiceEnabled !== undefined ? { voiceEnabled: input.voiceEnabled } : {}),
        ...(voiceMinutesBefore !== undefined ? { voiceMinutesBefore } : {}),
      },
      signal,
    );
  }
}
