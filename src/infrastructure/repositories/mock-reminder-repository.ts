import type { Reminder } from '@/domain/models/reminder';
import type {
  ChangeReminderStatusInput,
  CreateReminderInput,
  ReminderListCriteria,
  ReminderListQuery,
  ReminderRepository,
  UpdateReminderInput,
} from '@/domain/repositories/reminder-repository';
import { ReminderRequestError } from '@/domain/repositories/reminder-repository';
import type { MockDatabase } from '@/infrastructure/mock/database/persistent-mock-database';
import type { MockNetwork } from '@/infrastructure/mock/mock-network';

export class MockReminderRepository implements ReminderRepository {
  constructor(
    private readonly database: MockDatabase,
    private readonly network: MockNetwork,
    private readonly now: () => Date = () => new Date(),
  ) {}

  list(
    userId: string,
    criteria: ReminderListCriteria = 'active',
    signal?: AbortSignal,
  ): Promise<readonly Reminder[]> {
    return this.network.run(async () => {
      const state = await this.database.read();
      const selectedUserId = userId || state.users[0]?.id;
      const query = normalizeCriteria(criteria);
      const search = query.search?.trim().toLocaleLowerCase('tr-TR');
      const reminders = state.reminders
        .filter((reminder) => reminder.userId === selectedUserId)
        .filter((reminder) =>
          query.filter === 'all'
            ? true
            : query.filter === 'active'
              ? reminder.status === 'active'
              : reminder.status !== 'active',
        )
        .filter(
          (reminder) =>
            !search ||
            reminder.title.toLocaleLowerCase('tr-TR').includes(search) ||
            reminder.description?.toLocaleLowerCase('tr-TR').includes(search),
        )
        .filter((reminder) => query.urgent === undefined || reminder.urgent === query.urgent)
        .filter(
          (reminder) =>
            !query.startDate || Date.parse(reminder.eventDateTime) >= Date.parse(query.startDate),
        )
        .filter(
          (reminder) =>
            !query.endDate || Date.parse(reminder.eventDateTime) <= Date.parse(query.endDate),
        )
        .sort((left, right) => left.eventDateTime.localeCompare(right.eventDateTime));

      return reminders;
    }, signal);
  }

  create(input: CreateReminderInput, signal?: AbortSignal): Promise<Reminder> {
    return this.network.run(async () => {
      const state = await this.database.read();
      ensureUniqueReminder(state.reminders, input.userId, input.title, input.eventDateTime);
      const now = this.now().toISOString();
      const nextId = String(
        Math.max(0, ...state.reminders.map((reminder) => Number(reminder.id) || 0)) + 1,
      );
      const reminder: Reminder = {
        id: nextId,
        userId: input.userId,
        title: input.title,
        description: input.description || undefined,
        eventDateTime: input.eventDateTime,
        repeatType: 'none',
        status: 'active',
        urgent: input.urgent,
        pushSettings: (input.pushMinutesBefore ?? []).map((minutesBefore, index) => ({
          id: `push-${nextId}-${index + 1}`,
          minutesBefore,
          enabled: input.pushEnabled !== false,
        })),
        voiceCallSetting:
          input.voiceEnabled && input.voiceMinutesBefore
            ? {
                id: `voice-${nextId}`,
                minutesBefore: input.voiceMinutesBefore,
                retryCount: 0,
                enabled: true,
                locale: 'tr-TR',
              }
            : undefined,
        createdAt: now,
        updatedAt: now,
      };

      await this.database.replace({
        ...state,
        reminders: [...state.reminders, reminder],
      });

      return reminder;
    }, signal);
  }

  getById(userId: string, reminderId: string, signal?: AbortSignal): Promise<Reminder> {
    return this.network.run(async () => {
      const state = await this.database.read();
      return findOwnedReminder(state.reminders, userId, reminderId);
    }, signal);
  }

  update(input: UpdateReminderInput, signal?: AbortSignal): Promise<Reminder> {
    return this.network.run(async () => {
      const state = await this.database.read();
      const current = findOwnedReminder(state.reminders, input.userId, input.id);
      ensureUniqueReminder(
        state.reminders,
        input.userId,
        input.title,
        input.eventDateTime,
        input.id,
      );
      const updated: Reminder = {
        ...current,
        title: input.title,
        description: input.description,
        eventDateTime: input.eventDateTime,
        urgent: input.urgent,
        updatedAt: this.now().toISOString(),
      };

      await this.database.replace({
        ...state,
        reminders: state.reminders.map((reminder) =>
          reminder.id === input.id && reminder.userId === input.userId ? updated : reminder,
        ),
      });

      return updated;
    }, signal);
  }

  remove(userId: string, reminderId: string, signal?: AbortSignal): Promise<void> {
    return this.network.run(async () => {
      const state = await this.database.read();
      findOwnedReminder(state.reminders, userId, reminderId);
      await this.database.replace({
        ...state,
        reminders: state.reminders.filter(
          (reminder) => reminder.id !== reminderId || reminder.userId !== userId,
        ),
        reminderHistory: state.reminderHistory.filter(
          (history) => history.reminderId !== reminderId,
        ),
      });
    }, signal);
  }

  changeStatus(input: ChangeReminderStatusInput, signal?: AbortSignal): Promise<Reminder> {
    return this.network.run(async () => {
      const state = await this.database.read();
      const current = findOwnedReminder(state.reminders, input.userId, input.id);
      const updated: Reminder = {
        ...current,
        status: input.status,
        updatedAt: this.now().toISOString(),
      };

      await this.database.replace({
        ...state,
        reminders: state.reminders.map((reminder) =>
          reminder.id === input.id && reminder.userId === input.userId ? updated : reminder,
        ),
      });

      return updated;
    }, signal);
  }
}

function normalizeCriteria(
  criteria: ReminderListCriteria,
): Required<Pick<ReminderListQuery, 'filter'>> & ReminderListQuery {
  return typeof criteria === 'string'
    ? { filter: criteria }
    : { filter: criteria.filter ?? 'active', ...criteria };
}

function findOwnedReminder(
  reminders: readonly Reminder[],
  userId: string,
  reminderId: string,
): Reminder {
  const reminder = reminders.find((item) => item.id === reminderId && item.userId === userId);

  if (!reminder) {
    throw new ReminderRequestError('NOT_FOUND', 'Hatırlatıcı bulunamadı.');
  }

  return reminder;
}

function ensureUniqueReminder(
  reminders: readonly Reminder[],
  userId: string,
  title: string,
  eventDateTime: string,
  excludedId?: string,
): void {
  const normalizedTitle = title.trim().toLocaleLowerCase('tr-TR');
  const eventTime = Date.parse(eventDateTime);
  const duplicate = reminders.some(
    (reminder) =>
      reminder.id !== excludedId &&
      reminder.userId === userId &&
      reminder.title.trim().toLocaleLowerCase('tr-TR') === normalizedTitle &&
      Date.parse(reminder.eventDateTime) === eventTime,
  );

  if (duplicate) {
    throw new ReminderRequestError(
      'DUPLICATE',
      'Aynı başlık, tarih ve saate sahip bir hatırlatıcı zaten var.',
      { form: 'Çift kayıt oluşturulmadı.' },
    );
  }
}
