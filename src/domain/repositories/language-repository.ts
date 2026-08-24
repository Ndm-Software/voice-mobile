import type { Language } from '@/domain/models/account';

export interface LanguageRepository {
  list(signal?: AbortSignal): Promise<readonly Language[]>;
}
