import type { AccountDevice, MobilePlatform } from '@/domain/models/account';
import type { Session } from '@/domain/models/session';
import type { DeviceSessionRepository } from '@/domain/repositories/device-session-repository';

import { InstallationManager } from './installation-manager';

export class DeviceSessionManager {
  constructor(
    private readonly installationManager: InstallationManager,
    private readonly repository: DeviceSessionRepository,
    private readonly platform: MobilePlatform,
    private readonly deviceName = 'Voia Mobile',
  ) {}

  listDevices(signal?: AbortSignal): Promise<readonly AccountDevice[]> {
    return this.repository.list(signal);
  }

  prepare(): Promise<string> {
    return this.installationManager.getOrCreate();
  }

  async bind(session: Session): Promise<void> {
    const installationId = await this.installationManager.getOrCreate();
    await this.repository.bind({
      deviceName: this.deviceName,
      installationId,
      platform: this.platform,
      refreshToken: session.refreshToken,
      refreshTokenExpiresAt: session.refreshTokenExpiresAt,
      userId: session.userId,
    });
  }

  async updatePushToken(session: Session, pushToken: string | null): Promise<void> {
    const installationId = await this.installationManager.getOrCreate();
    await this.repository.bind({
      deviceName: this.deviceName,
      installationId,
      platform: this.platform,
      pushToken,
      refreshToken: session.refreshToken,
      refreshTokenExpiresAt: session.refreshTokenExpiresAt,
      userId: session.userId,
    });
  }

  async revoke(session: Session): Promise<void> {
    const installationId = await this.installationManager.getExisting();
    if (!installationId) {
      return;
    }

    await this.repository.revoke({
      deviceName: this.deviceName,
      installationId,
      platform: this.platform,
      refreshToken: session.refreshToken,
      refreshTokenExpiresAt: session.refreshTokenExpiresAt,
      userId: session.userId,
    });
  }
}
