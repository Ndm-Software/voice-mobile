import type {
  DeviceSessionBinding,
  DeviceSessionRepository,
} from '@/domain/repositories/device-session-repository';
import type { HttpClient } from '@/infrastructure/http/http-client';

interface DeviceSessionEndpoints {
  readonly currentDevice: string;
  readonly logout: string;
}

export class HttpDeviceSessionRepository implements DeviceSessionRepository {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly endpoints: DeviceSessionEndpoints,
  ) {}

  async bind(binding: DeviceSessionBinding): Promise<void> {
    await this.httpClient.post<unknown>(this.endpoints.currentDevice, {
      installation_id: binding.installationId,
      platform: binding.platform,
    });
  }

  async revoke(binding: DeviceSessionBinding): Promise<void> {
    await this.httpClient.post<unknown>(this.endpoints.logout, {
      installation_id: binding.installationId,
      refresh_token: binding.refreshToken,
    });
  }
}
