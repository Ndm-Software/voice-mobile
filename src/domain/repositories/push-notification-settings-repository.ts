export interface PushNotificationSettingRecord {
  readonly id: string;
  readonly reminderId: string;
  readonly minutesBefore: number;
  readonly enabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreatePushNotificationSettingInput {
  readonly reminderId: string;
  readonly minutesBefore: number;
}

export interface UpdatePushNotificationSettingInput {
  readonly minutesBefore?: number;
  readonly enabled?: boolean;
}

export interface PushNotificationSettingsRepository {
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
