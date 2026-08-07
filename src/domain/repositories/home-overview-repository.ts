import type { HomeOverview } from '@/domain/models/home-overview';

export interface HomeOverviewRepository {
  getOverview(signal?: AbortSignal): Promise<HomeOverview>;
}
