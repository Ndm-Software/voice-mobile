import type { MobilePlatform } from '@/domain/models/account';

export interface DeviceSessionBinding {
  readonly installationId: string;
  readonly platform: MobilePlatform;
  readonly refreshToken: string;
  readonly refreshTokenExpiresAt: string;
  readonly userId: string;
}

export interface DeviceSessionRepository {
  bind(binding: DeviceSessionBinding): Promise<void>;
  revoke(binding: DeviceSessionBinding): Promise<void>;
}
