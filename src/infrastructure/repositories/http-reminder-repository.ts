import type { Reminder } from '@/domain/models/reminder';
import {
  ReminderRequestError,
  type ChangeReminderStatusInput,
  type CreateReminderInput,
  type ReminderListCriteria,
  type ReminderListQuery,
  type ReminderRepository,
  type UpdateReminderInput,
} from '@/domain/repositories/reminder-repository';
import type { HttpClient } from '@/infrastructure/http/http-client';

interface ReminderEndpoints {
  readonly list: string;
}

interface ReminderDto {
  readonly id?: string | number;
  readonly reminderId?: string | number;
  readonly userId?: string | number;
  readonly parentReminderId?: string | number | null;
  readonly eventDatetime?: string;
  readonly eventDateTime?: string;
  readonly event_date_time?: string;
  readonly createdAt?: string;
  readonly created_at?: string;
  readonly updatedAt?: string;
  readonly updated_at?: string;
  readonly title: string;
  readonly description?: string;
  readonly urgent?: boolean;
  readonly pushSettings?: readonly {
    readonly id: string;
    readonly minutesBefore: number;
    readonly enabled: boolean;
  }[];
  readonly voiceCallSetting?: {
    readonly id: string;
    readonly minutesBefore: number;
    readonly retryCount: number;
    readonly enabled: boolean;
    readonly locale: string;
  };
  readonly repeatType?: string;
  readonly repeatUntil?: string | null;
  readonly status?: string;
  readonly isUrgent?: boolean;
  readonly pushNotifications?: readonly {
    readonly pushId: string | number;
    readonly minutesBefore: number;
    readonly enabled: boolean;
  }[];
  readonly voiceCallSettings?: readonly {
    readonly callId: string | number;
    readonly minutesBefore: number;
    readonly retryCount: number;
    readonly enabled: boolean;
    readonly locale?: string | null;
  }[];
}

export class HttpReminderRepository implements ReminderRepository {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly endpoints: ReminderEndpoints,
  ) {}

  async list(
    _userId: string,
    criteria: ReminderListCriteria = 'active',
    signal?: AbortSignal,
  ): Promise<readonly Reminder[]> {
    const query = normalizeCriteria(criteria);
    const response = await this.httpClient.get<ReminderDto[]>(
      buildListUrl(this.endpoints.list, query),
      {
        signal,
      },
    );

    return response
      .map(mapReminder)
      .filter((reminder) =>
        query.filter === 'all'
          ? true
          : query.filter === 'active'
            ? reminder.status === 'active'
            : reminder.status !== 'active',
      )
      .sort((left, right) => left.eventDateTime.localeCompare(right.eventDateTime));
  }

  async create(input: CreateReminderInput, signal?: AbortSignal): Promise<Reminder> {
    const pushMinutesBefore =
      input.pushEnabled === false ? undefined : input.pushMinutesBefore?.[0];
    const voiceMinutesBefore = input.voiceEnabled ? input.voiceMinutesBefore : undefined;
    const response = await this.httpClient.post<ReminderDto, Record<string, unknown>>(
      this.endpoints.list,
      {
        title: input.title,
        ...(input.description ? { description: input.description } : {}),
        eventDatetime: input.eventDateTime,
        repeatType: 'NONE',
        isUrgent: input.urgent,
        ...(pushMinutesBefore !== undefined ? { pushMinutesBefore } : {}),
        ...(voiceMinutesBefore !== undefined ? { voiceMinutesBefore } : {}),
      },
      { signal },
    );

    return mapReminder(response);
  }

  async getById(_userId: string, reminderId: string, signal?: AbortSignal): Promise<Reminder> {
    const response = await this.httpClient.get<ReminderDto>(
      `${this.endpoints.list}/${encodeURIComponent(reminderId)}`,
      { signal },
    );

    return mapReminder(response);
  }

  async update(input: UpdateReminderInput, signal?: AbortSignal): Promise<Reminder> {
    const response = await this.httpClient.patch<ReminderDto, Record<string, unknown>>(
      `${this.endpoints.list}/${encodeURIComponent(input.id)}`,
      {
        title: input.title,
        description: input.description,
        eventDatetime: input.eventDateTime,
        isUrgent: input.urgent,
      },
      { signal },
    );

    return mapReminder(response);
  }

  async remove(_userId: string, reminderId: string, signal?: AbortSignal): Promise<void> {
    await this.httpClient.delete<{ readonly message: string }>(
      `${this.endpoints.list}/${encodeURIComponent(reminderId)}`,
      { signal },
    );
  }

  changeStatus(_input: ChangeReminderStatusInput, _signal?: AbortSignal): Promise<Reminder> {
    return Promise.reject(
      new ReminderRequestError(
        'BACKEND_UNSUPPORTED',
        'Tamamlama ve yeniden açma işlemi backend tarafından henüz desteklenmiyor.',
      ),
    );
  }
}

function normalizeCriteria(
  criteria: ReminderListCriteria,
): Required<Pick<ReminderListQuery, 'filter'>> & ReminderListQuery {
  return typeof criteria === 'string'
    ? { filter: criteria }
    : { filter: criteria.filter ?? 'active', ...criteria };
}

function buildListUrl(endpoint: string, query: ReminderListQuery): string {
  const params: string[] = [];
  const search = query.search?.trim();

  if (search) params.push(`search=${encodeURIComponent(search)}`);
  if (query.urgent !== undefined) params.push(`isUrgent=${String(query.urgent)}`);
  if (query.startDate) params.push(`startDate=${encodeURIComponent(query.startDate)}`);
  if (query.endDate) params.push(`endDate=${encodeURIComponent(query.endDate)}`);

  return params.length > 0 ? `${endpoint}?${params.join('&')}` : endpoint;
}

function mapReminder(dto: ReminderDto): Reminder {
  const id = dto.reminderId ?? dto.id;
  const userId = dto.userId;
  if (id === undefined || userId === undefined) {
    throw new Error('Hatırlatıcı response alanları eksik.');
  }
  const repeatType = (dto.repeatType ?? 'none').toLowerCase() as Reminder['repeatType'];
  const status = (dto.status ?? 'active').toLowerCase() as Reminder['status'];
  const pushSettings = (dto.pushNotifications ?? dto.pushSettings ?? []).map((setting) => ({
    id: String('pushId' in setting ? setting.pushId : setting.id),
    minutesBefore: setting.minutesBefore,
    enabled: setting.enabled,
  }));
  const voice = dto.voiceCallSettings?.[0] ?? dto.voiceCallSetting;
  return {
    ...dto,
    id: String(id),
    userId: String(userId),
    parentReminderId:
      dto.parentReminderId === null || dto.parentReminderId === undefined
        ? undefined
        : String(dto.parentReminderId),
    eventDateTime: dto.eventDatetime ?? dto.eventDateTime ?? dto.event_date_time ?? '',
    repeatType,
    repeatUntil: dto.repeatUntil ?? undefined,
    status,
    urgent: dto.isUrgent ?? dto.urgent ?? false,
    pushSettings,
    voiceCallSetting: voice
      ? {
          id: String('callId' in voice ? voice.callId : voice.id),
          minutesBefore: voice.minutesBefore,
          retryCount: voice.retryCount,
          enabled: voice.enabled,
          locale: ('locale' in voice && voice.locale) || 'tr-TR',
        }
      : undefined,
    createdAt: dto.createdAt ?? dto.created_at ?? '',
    updatedAt: dto.updatedAt ?? dto.updated_at ?? '',
  };
}
