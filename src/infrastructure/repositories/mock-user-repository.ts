import type { User, UserSettings } from '@/domain/models/account';
import type {
  UpdatePreferencesInput,
  UpdateProfileInput,
  UserRepository,
} from '@/domain/repositories/user-repository';
import type { MockAuthAccountStore } from '@/infrastructure/mock/auth/mock-auth-account-store';
import type { MockDatabase } from '@/infrastructure/mock/database/persistent-mock-database';
import type { MockNetwork } from '@/infrastructure/mock/mock-network';

export class MockUserRepository implements UserRepository {
  constructor(
    private readonly database: MockDatabase,
    private readonly accountStore: MockAuthAccountStore,
    private readonly network: MockNetwork,
    private readonly now: () => Date = () => new Date(),
  ) {}

  getProfile(userId: string, signal?: AbortSignal): Promise<User> {
    return this.network.run(() => this.ensureUser(userId).then(({ user }) => user), signal);
  }

  updateProfile(userId: string, input: UpdateProfileInput, signal?: AbortSignal): Promise<User> {
    return this.network.run(async () => {
      const account = await this.accountStore.updateProfile(userId, input);
      const { user } = await this.ensureUser(userId);
      const updatedUser = {
        ...user,
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        phoneNumber: account.phoneNumber,
        phoneVerified: account.phoneVerified,
        updatedAt: this.now().toISOString(),
      };
      const state = await this.database.read();
      await this.database.replace({
        ...state,
        users: state.users.map((candidate) => (candidate.id === userId ? updatedUser : candidate)),
      });
      return updatedUser;
    }, signal);
  }

  getPreferences(userId: string, signal?: AbortSignal): Promise<UserSettings> {
    return this.network.run(() => this.ensureUser(userId).then(({ settings }) => settings), signal);
  }

  updatePreferences(
    userId: string,
    input: UpdatePreferencesInput,
    signal?: AbortSignal,
  ): Promise<UserSettings> {
    return this.network.run(async () => {
      const { settings } = await this.ensureUser(userId);
      const updated = { ...settings, ...input, updatedAt: this.now().toISOString() };
      const state = await this.database.read();
      await this.database.replace({
        ...state,
        userSettings: state.userSettings.map((candidate) =>
          candidate.id === settings.id ? updated : candidate,
        ),
      });
      return updated;
    }, signal);
  }

  deleteAccount(userId: string, signal?: AbortSignal): Promise<void> {
    return this.network.run(async () => {
      await this.accountStore.deleteAccount(userId);
      const state = await this.database.read();
      const deviceIds = new Set(
        state.devices.filter((device) => device.userId === userId).map((device) => device.id),
      );
      const reminderIds = new Set(
        state.reminders
          .filter((reminder) => reminder.userId === userId)
          .map((reminder) => reminder.id),
      );
      await this.database.replace({
        ...state,
        users: state.users.filter((user) => user.id !== userId),
        userSettings: state.userSettings.filter((settings) => settings.userId !== userId),
        devices: state.devices.filter((device) => device.userId !== userId),
        refreshSessions: state.refreshSessions.filter(
          (session) => !deviceIds.has(session.deviceId),
        ),
        otpVerifications: state.otpVerifications.filter((otp) => otp.userId !== userId),
        reminders: state.reminders.filter((reminder) => reminder.userId !== userId),
        reminderHistory: state.reminderHistory.filter(
          (history) => !reminderIds.has(history.reminderId),
        ),
      });
    }, signal);
  }

  private async ensureUser(userId: string): Promise<{ settings: UserSettings; user: User }> {
    const account = await this.accountStore.findByUserId(userId);
    if (!account) {
      throw new Error('Hesap bulunamadı.');
    }
    const state = await this.database.read();
    const now = this.now().toISOString();
    const existingUser = state.users.find((user) => user.id === userId);
    const user: User = existingUser ?? {
      id: userId,
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      phoneNumber: account.phoneNumber,
      phoneVerified: account.phoneVerified,
      createdAt: now,
      updatedAt: now,
    };
    const existingSettings = state.userSettings.find((settings) => settings.userId === userId);
    const settings: UserSettings = existingSettings ?? {
      id: `settings-${userId}`,
      userId,
      languageId: '1',
      timezone: 'Europe/Istanbul',
      province: undefined,
      notificationsEnabled: true,
      defaultPushBeforeMinutes: 15,
      defaultCallBeforeMinutes: 10,
      silentStart: undefined,
      silentEnd: undefined,
      createdAt: now,
      updatedAt: now,
    };
    if (!existingUser || !existingSettings) {
      await this.database.replace({
        ...state,
        users: existingUser ? state.users : [...state.users, user],
        userSettings: existingSettings ? state.userSettings : [...state.userSettings, settings],
      });
    }
    return { settings, user };
  }
}
