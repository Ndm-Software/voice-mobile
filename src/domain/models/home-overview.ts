import type { DataSource } from '@/core/types/data-source';

export type ReadinessStatus = 'ready' | 'degraded';

export interface HomeOverview {
  readonly applicationName: string;
  readonly assistantTagline: string;
  readonly readiness: ReadinessStatus;
  readonly dataSource: DataSource;
  readonly mockDataSummary?: {
    readonly userDisplayName: string;
    readonly activeReminderCount: number;
    readonly deviceCount: number;
    readonly historyCount: number;
  };
}
