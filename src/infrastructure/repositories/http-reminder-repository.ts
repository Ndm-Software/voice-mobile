import type { Reminder } from '@/domain/models/reminder';
import type {
  CreateReminderInput,
  ReminderListFilter,
  ReminderRepository,
} from '@/domain/repositories/reminder-repository';
import type { HttpClient } from '@/infrastructure/http/http-client';

interface ReminderEndpoints {
  readonly list: string;
}

interface ReminderDto extends Omit<
  Reminder,
  'id' | 'userId' | 'eventDateTime' | 'createdAt' | 'updatedAt'
> {
  readonly id: string | number;
  readonly userId: string | number;
  readonly eventDateTime?: string;
  readonly event_date_time?: string;
  readonly createdAt?: string;
  readonly created_at?: string;
  readonly updatedAt?: string;
  readonly updated_at?: string;
}

export class HttpReminderRepository implements ReminderRepository {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly endpoints: ReminderEndpoints,
  ) {}

  async list(
    _userId: string,
    filter: ReminderListFilter = 'active',
    signal?: AbortSignal,
  ): Promise<readonly Reminder[]> {
    const query = filter === 'active' ? '?status=active' : '?status=history';
    const response = await this.httpClient.get<ReminderDto[]>(`${this.endpoints.list}${query}`, {
      signal,
    });

    return response
      .map(mapReminder)
      .sort((left, right) => left.eventDateTime.localeCompare(right.eventDateTime));
  }

  async create(input: CreateReminderInput, signal?: AbortSignal): Promise<Reminder> {
    const response = await this.httpClient.post<ReminderDto, CreateReminderInput>(
      this.endpoints.list,
      input,
      { signal },
    );

    return mapReminder(response);
  }
}

function mapReminder(dto: ReminderDto): Reminder {
  return {
    ...dto,
    id: String(dto.id),
    userId: String(dto.userId),
    eventDateTime: dto.eventDateTime ?? dto.event_date_time ?? '',
    createdAt: dto.createdAt ?? dto.created_at ?? '',
    updatedAt: dto.updatedAt ?? dto.updated_at ?? '',
  };
}
