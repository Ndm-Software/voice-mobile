import type { ReminderHistoryRepository } from '@/domain/repositories/reminder-history-repository';
import type { MockDatabase } from '@/infrastructure/mock/database/persistent-mock-database';

export class MockReminderHistoryRepository implements ReminderHistoryRepository {
  constructor(private readonly database: MockDatabase) {}

  async list(reminderId?: string) {
    const state = await this.database.read();
    return state.reminderHistory
      .filter((history) => !reminderId || history.reminderId === reminderId)
      .sort((left, right) => Date.parse(right.sentAt ?? '') - Date.parse(left.sentAt ?? ''));
  }

  async getById(historyId: string) {
    const state = await this.database.read();
    const history = state.reminderHistory.find((candidate) => candidate.id === historyId);
    if (!history) throw new Error('Geçmiş kaydı bulunamadı.');
    return history;
  }

  async remove(historyId: string): Promise<void> {
    const state = await this.database.read();
    await this.database.replace({
      ...state,
      reminderHistory: state.reminderHistory.filter((history) => history.id !== historyId),
    });
  }
}
