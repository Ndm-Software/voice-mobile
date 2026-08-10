import type { Reminder } from '@/domain/models/reminder';
import type {
  ReminderListFilter,
  ReminderRepository,
} from '@/domain/repositories/reminder-repository';
import type { MockDatabase } from '@/infrastructure/mock/database/persistent-mock-database';
import type { MockNetwork } from '@/infrastructure/mock/mock-network';

export class MockReminderRepository implements ReminderRepository {
  constructor(
    private readonly database: MockDatabase,
    private readonly network: MockNetwork,
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
}
