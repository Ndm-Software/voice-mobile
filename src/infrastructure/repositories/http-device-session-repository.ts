import type {
  DeviceSessionBinding,
  DeviceSessionRepository,
} from '@/domain/repositories/device-session-repository';
import type { AccountDevice, AccountDevicePlatform } from '@/domain/models/account';
import type { HttpClient } from '@/infrastructure/http/http-client';

interface DeviceSessionEndpoints {
  readonly currentDevice: string;
  readonly logout: string;
}

interface DeviceDto {
  readonly deviceId: string | number;
  readonly platform: string;
  readonly deviceName: string;
  readonly lastActive: string;
  readonly isActive: boolean;
  readonly createdAt: string;
}

export class HttpDeviceSessionRepository implements DeviceSessionRepository {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly endpoints: DeviceSessionEndpoints,
  ) {}

  async list(signal?: AbortSignal): Promise<readonly AccountDevice[]> {
    const devices = await this.httpClient.get<readonly DeviceDto[]>(this.endpoints.currentDevice, {
      signal,
    });
    return devices.map(mapDevice);
  }

  async bind(binding: DeviceSessionBinding): Promise<void> {
    await this.httpClient.put<unknown>(this.endpoints.currentDevice, {
      installationId: binding.installationId,
      platform: binding.platform.toUpperCase(),
      deviceName: binding.deviceName,
      ...(binding.pushToken !== undefined ? { pushToken: binding.pushToken } : {}),
    });
  }

  async revoke(binding: DeviceSessionBinding): Promise<void> {
    await this.httpClient.post<unknown>(this.endpoints.logout, {
      refreshToken: binding.refreshToken,
    });
  }
}

function mapDevice(dto: DeviceDto): AccountDevice {
  return {
    id: String(dto.deviceId),
    platform: mapPlatform(dto.platform),
    name: dto.deviceName,
    lastActiveAt: dto.lastActive,
    active: dto.isActive,
    createdAt: dto.createdAt,
  };
}

function mapPlatform(value: string): AccountDevicePlatform {
  const normalized = value.toLowerCase();
  if (
    normalized === 'android' ||
    normalized === 'ios' ||
    normalized === 'web' ||
    normalized === 'windows'
  ) {
    return normalized;
  }
  return 'unknown';
}
