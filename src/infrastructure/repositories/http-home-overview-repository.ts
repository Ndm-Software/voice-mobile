import type { HomeOverview, ReadinessStatus } from '@/domain/models/home-overview';
import type { HomeOverviewRepository } from '@/domain/repositories/home-overview-repository';
import { HttpError, type HttpClient } from '@/infrastructure/http/http-client';

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
    try {
      const dto = await this.httpClient.get<HomeOverviewDto>(this.endpoint, { signal });

      return {
        applicationName: dto.application_name,
        assistantTagline: dto.assistant_tagline,
        readiness: dto.readiness,
        dataSource: 'api',
      };
    } catch (error) {
      // Backend'de dashboard summary endpointi henüz bulunmadığında auth sonrası
      // ana sayfa yine açılır; reminder kartları gerçek /reminders endpointinden gelir.
      if (error instanceof HttpError && error.status === 404) {
        return {
          applicationName: 'Voia',
          assistantTagline: 'Kişisel asistanın her zaman yanında.',
          readiness: 'ready',
          dataSource: 'api',
        };
      }

      throw error;
    }
  }
}
