import type { HomeOverview } from '@/domain/models/home-overview';
import type { HomeOverviewRepository } from '@/domain/repositories/home-overview-repository';

export interface GetHomeOverview {
  execute(signal?: AbortSignal): Promise<HomeOverview>;
}

export class GetHomeOverviewUseCase implements GetHomeOverview {
  constructor(private readonly repository: HomeOverviewRepository) {}

  execute(signal?: AbortSignal): Promise<HomeOverview> {
    return this.repository.getOverview(signal);
  }
}
