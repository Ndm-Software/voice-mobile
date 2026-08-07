import type { HomeOverview } from '@/domain/models/home-overview';
import type { HomeOverviewRepository } from '@/domain/repositories/home-overview-repository';
import type { MockDatabase } from '@/infrastructure/mock/database/persistent-mock-database';
import type { MockNetwork } from '@/infrastructure/mock/mock-network';

export class MockHomeOverviewRepository implements HomeOverviewRepository {
  constructor(
    private readonly database: MockDatabase,
    private readonly network: MockNetwork,
  ) {}

  getOverview(signal?: AbortSignal): Promise<HomeOverview> {
    return this.network.run(async () => {
      const state = await this.database.read();
      const user = state.users[0];

      return {
        applicationName: 'Voia',
        assistantTagline: 'Kişisel asistanın her zaman yanında.',
        readiness: 'ready',
        dataSource: 'mock',
        mockDataSummary: {
          userDisplayName: user ? `${user.firstName} ${user.lastName}` : 'Demo kullanıcı',
          activeReminderCount: state.reminders.filter((reminder) => reminder.status === 'active')
            .length,
          deviceCount: state.devices.filter((device) => device.active).length,
          historyCount: state.reminderHistory.length,
        },
      };
    }, signal);
  }
}
