import type {
  CreatePushNotificationSettingInput,
  PushNotificationSettingRecord,
  PushNotificationSettingsRepository,
  UpdatePushNotificationSettingInput,
} from '@/domain/repositories/push-notification-settings-repository';
import type { HttpClient } from '@/infrastructure/http/http-client';

interface PushNotificationSettingDto {
  readonly pushId: string;
  readonly reminderId: string;
  readonly minutesBefore: number;
  readonly enabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export class HttpPushNotificationSettingsRepository implements PushNotificationSettingsRepository {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly endpoint: string,
  ) {}

  async list(signal?: AbortSignal): Promise<readonly PushNotificationSettingRecord[]> {
    const response = await this.httpClient.get<PushNotificationSettingDto[]>(this.endpoint, {
      signal,
    });
    return response.map(mapSetting);
  }

  async create(
    input: CreatePushNotificationSettingInput,
    signal?: AbortSignal,
  ): Promise<PushNotificationSettingRecord> {
    const response = await this.httpClient.post<PushNotificationSettingDto>(this.endpoint, input, {
      signal,
    });
    return mapSetting(response);
  }

  async update(
    id: string,
    input: UpdatePushNotificationSettingInput,
    signal?: AbortSignal,
  ): Promise<PushNotificationSettingRecord> {
    const response = await this.httpClient.patch<PushNotificationSettingDto>(
      `${this.endpoint}/${encodeURIComponent(id)}`,
      input,
      { signal },
    );
    return mapSetting(response);
  }

  async remove(id: string, signal?: AbortSignal): Promise<void> {
    await this.httpClient.delete<unknown>(`${this.endpoint}/${encodeURIComponent(id)}`, {
      signal,
    });
  }
}

function mapSetting(dto: PushNotificationSettingDto): PushNotificationSettingRecord {
  return {
    id: dto.pushId,
    reminderId: dto.reminderId,
    minutesBefore: dto.minutesBefore,
    enabled: dto.enabled,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}
