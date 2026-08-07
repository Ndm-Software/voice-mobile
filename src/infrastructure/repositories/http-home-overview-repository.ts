import type { HomeOverview, ReadinessStatus } from '@/domain/models/home-overview';
import type { HomeOverviewRepository } from '@/domain/repositories/home-overview-repository';
import type { HttpClient } from '@/infrastructure/http/http-client';

interface HomeOverviewDto {
  readonly application_name: string;
  readonly assistant_tagline: string;
  readonly readiness: ReadinessStatus;
}

export class HttpHomeOverviewRepository implements HomeOverviewRepository {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly endpoint: string,
  ) {}

  async getOverview(signal?: AbortSignal): Promise<HomeOverview> {
    const dto = await this.httpClient.get<HomeOverviewDto>(this.endpoint, { signal });

    return {
      applicationName: dto.application_name,
      assistantTagline: dto.assistant_tagline,
      readiness: dto.readiness,
      dataSource: 'api',
    };
  }
}
