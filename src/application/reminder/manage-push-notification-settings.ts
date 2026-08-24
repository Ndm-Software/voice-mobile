import type {
  CreatePushNotificationSettingInput,
  PushNotificationSettingRecord,
  PushNotificationSettingsRepository,
  UpdatePushNotificationSettingInput,
} from '@/domain/repositories/push-notification-settings-repository';

export interface ManagePushNotificationSettings {
  list(signal?: AbortSignal): Promise<readonly PushNotificationSettingRecord[]>;
  create(
    input: CreatePushNotificationSettingInput,
    signal?: AbortSignal,
  ): Promise<PushNotificationSettingRecord>;
  update(
    id: string,
    input: UpdatePushNotificationSettingInput,
    signal?: AbortSignal,
  ): Promise<PushNotificationSettingRecord>;
  remove(id: string, signal?: AbortSignal): Promise<void>;
}

export class ManagePushNotificationSettingsUseCase implements ManagePushNotificationSettings {
  constructor(private readonly repository: PushNotificationSettingsRepository) {}

  list(signal?: AbortSignal): Promise<readonly PushNotificationSettingRecord[]> {
    return this.repository.list(signal);
  }

  create(
    input: CreatePushNotificationSettingInput,
    signal?: AbortSignal,
  ): Promise<PushNotificationSettingRecord> {
    return this.repository.create(input, signal);
  }

  update(
    id: string,
    input: UpdatePushNotificationSettingInput,
    signal?: AbortSignal,
  ): Promise<PushNotificationSettingRecord> {
    return this.repository.update(id, input, signal);
  }

  remove(id: string, signal?: AbortSignal): Promise<void> {
    return this.repository.remove(id, signal);
  }
}
