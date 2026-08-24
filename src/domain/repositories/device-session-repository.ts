import type { AccountDevice, MobilePlatform } from '@/domain/models/account';

export interface DeviceSessionBinding {
  readonly deviceName: string;
  readonly installationId: string;
  readonly platform: MobilePlatform;
  readonly pushToken?: string | null;
  readonly refreshToken: string;
  readonly refreshTokenExpiresAt: string;
  readonly userId: string;
}

export interface DeviceSessionRepository {
  list(signal?: AbortSignal): Promise<readonly AccountDevice[]>;
  bind(binding: DeviceSessionBinding): Promise<void>;
  revoke(binding: DeviceSessionBinding): Promise<void>;
}
