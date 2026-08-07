import type { KeyValueStorage } from '@/core/storage/key-value-storage';
import { createMockDatabaseFixture } from '@/fixtures/mock-database.fixture';

import { MOCK_DATABASE_SCHEMA_VERSION, type MockDatabaseState } from './mock-database-state';

export const MOCK_DATABASE_STORAGE_KEY = '@voia/mock-database/v1';

export interface MockDatabase {
  read(): Promise<MockDatabaseState>;
  replace(state: MockDatabaseState): Promise<void>;
  reset(): Promise<MockDatabaseState>;
}

function cloneState(state: MockDatabaseState): MockDatabaseState {
  return JSON.parse(JSON.stringify(state)) as MockDatabaseState;
}

function isMockDatabaseState(value: unknown): value is MockDatabaseState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<MockDatabaseState>;

  return (
    candidate.schemaVersion === MOCK_DATABASE_SCHEMA_VERSION &&
    Array.isArray(candidate.languages) &&
    Array.isArray(candidate.users) &&
    Array.isArray(candidate.userSettings) &&
    Array.isArray(candidate.devices) &&
    Array.isArray(candidate.refreshSessions) &&
    Array.isArray(candidate.otpVerifications) &&
    Array.isArray(candidate.reminders) &&
    Array.isArray(candidate.reminderHistory)
  );
}

export class PersistentMockDatabase implements MockDatabase {
  private state?: MockDatabaseState;
  private loading?: Promise<MockDatabaseState>;

  constructor(private readonly storage: KeyValueStorage) {}

  async read(): Promise<MockDatabaseState> {
    if (this.state) {
      return cloneState(this.state);
    }

    this.loading ??= this.load();
    this.state = await this.loading;
    this.loading = undefined;

    return cloneState(this.state);
  }

  async replace(state: MockDatabaseState): Promise<void> {
    const nextState = cloneState(state);
    await this.storage.setItem(MOCK_DATABASE_STORAGE_KEY, JSON.stringify(nextState));
    this.state = nextState;
  }

  async reset(): Promise<MockDatabaseState> {
    const fixture = createMockDatabaseFixture();
    await this.replace(fixture);
    return cloneState(fixture);
  }

  private async load(): Promise<MockDatabaseState> {
    const storedValue = await this.storage.getItem(MOCK_DATABASE_STORAGE_KEY);

    if (storedValue) {
      try {
        const parsed: unknown = JSON.parse(storedValue);
        if (isMockDatabaseState(parsed)) {
          return parsed;
        }
      } catch {
        // Bozuk veya eski mock veri güvenli başlangıç fixture'ıyla yenilenir.
      }
    }

    const fixture = createMockDatabaseFixture();
    await this.storage.setItem(MOCK_DATABASE_STORAGE_KEY, JSON.stringify(fixture));
    return fixture;
  }
}
