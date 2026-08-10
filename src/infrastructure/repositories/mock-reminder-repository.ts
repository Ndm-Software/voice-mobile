import type { Reminder } from '@/domain/models/reminder';
import type {
  CreateReminderInput,
  ReminderListFilter,
  ReminderRepository,
} from '@/domain/repositories/reminder-repository';
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
    filter: ReminderListFilter = 'active',
    signal?: AbortSignal,
  ): Promise<readonly Reminder[]> {
    return this.network.run(async () => {
      const state = await this.database.read();
      const selectedUserId = userId || state.users[0]?.id;
      const reminders = state.reminders
        .filter((reminder) => reminder.userId === selectedUserId)
        .filter((reminder) =>
          filter === 'active' ? reminder.status === 'active' : reminder.status !== 'active',
        )
        .sort((left, right) => left.eventDateTime.localeCompare(right.eventDateTime));

      return reminders;
    }, signal);
  }

  create(input: CreateReminderInput, signal?: AbortSignal): Promise<Reminder> {
    return this.network.run(async () => {
      const state = await this.database.read();
      const now = this.now().toISOString();
      const nextId = String(
        Math.max(0, ...state.reminders.map((reminder) => Number(reminder.id) || 0)) + 1,
      );
      const reminder: Reminder = {
        id: nextId,
        userId: input.userId,
        title: input.title,
        description: input.description,
        eventDateTime: input.eventDateTime,
        repeatType: 'none',
        status: 'active',
        urgent: input.urgent,
        pushSettings: [],
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
}
