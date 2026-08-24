import type { AccountDevice, Device, RefreshSession } from '@/domain/models/account';
import type {
  DeviceSessionBinding,
  DeviceSessionRepository,
} from '@/domain/repositories/device-session-repository';
import type { MockDatabase } from '@/infrastructure/mock/database/persistent-mock-database';

export class MockDeviceSessionRepository implements DeviceSessionRepository {
  constructor(
    private readonly database: MockDatabase,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async list(): Promise<readonly AccountDevice[]> {
    const state = await this.database.read();
    return [...state.devices]
      .sort((left, right) => {
        if (left.active !== right.active) return left.active ? -1 : 1;
        return Date.parse(right.lastActiveAt) - Date.parse(left.lastActiveAt);
      })
      .map((device) => ({
        id: device.id,
        platform: device.platform,
        name: device.name ?? 'Voia Mobile',
        lastActiveAt: device.lastActiveAt,
        active: device.active,
        createdAt: device.createdAt,
      }));
  }

  async bind(binding: DeviceSessionBinding): Promise<void> {
    const state = await this.database.read();
    const now = this.now().toISOString();
    const existing = state.devices.find((device) => device.id === binding.installationId);
    const device: Device = existing
      ? {
          ...existing,
          userId: binding.userId,
          platform: binding.platform,
          name: binding.deviceName,
          notificationPermission:
            binding.pushToken === null
              ? 'denied'
              : binding.pushToken
                ? 'granted'
                : existing.notificationPermission,
          active: true,
          lastActiveAt: now,
        }
      : {
          id: binding.installationId,
          userId: binding.userId,
          platform: binding.platform,
          name: binding.deviceName,
          notificationPermission: binding.pushToken ? 'granted' : 'not-determined',
          lastActiveAt: now,
          active: true,
          createdAt: now,
        };
    const refreshSession: RefreshSession = {
      id: `installation-session-${binding.installationId}`,
      deviceId: binding.installationId,
      expiresAt: binding.refreshTokenExpiresAt,
      createdAt: now,
    };

    await this.database.replace({
      ...state,
      devices: [...state.devices.filter((candidate) => candidate.id !== device.id), device],
      refreshSessions: [
        ...state.refreshSessions.filter((session) => session.deviceId !== device.id),
        refreshSession,
      ],
    });
  }

  async revoke(binding: DeviceSessionBinding): Promise<void> {
    const state = await this.database.read();
    const revokedAt = this.now().toISOString();
    await this.database.replace({
      ...state,
      devices: state.devices.map((device) =>
        device.id === binding.installationId
          ? { ...device, active: false, lastActiveAt: revokedAt }
          : device,
      ),
      refreshSessions: state.refreshSessions.map((session) =>
        session.deviceId === binding.installationId ? { ...session, revokedAt } : session,
      ),
    });
  }
}
