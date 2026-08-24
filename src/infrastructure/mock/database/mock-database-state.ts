import type {
  Device,
  Language,
  OtpVerification,
  RefreshSession,
  User,
  UserSettings,
} from '@/domain/models/account';
import type { Reminder, ReminderHistory } from '@/domain/models/reminder';
import type { QuietHour } from '@/domain/models/quiet-hour';

export const MOCK_DATABASE_SCHEMA_VERSION = 2;

export interface MockDatabaseState {
  readonly schemaVersion: typeof MOCK_DATABASE_SCHEMA_VERSION;
  readonly seededAt: string;
  readonly languages: readonly Language[];
  readonly users: readonly User[];
  readonly userSettings: readonly UserSettings[];
  readonly devices: readonly Device[];
  readonly refreshSessions: readonly RefreshSession[];
  readonly otpVerifications: readonly OtpVerification[];
  readonly reminders: readonly Reminder[];
  readonly reminderHistory: readonly ReminderHistory[];
  readonly quietHours: readonly QuietHour[];
}
