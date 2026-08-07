import type { Language } from '@/domain/models/account';
import type { LanguageRepository } from '@/domain/repositories/language-repository';

export interface GetLanguages {
  execute(): Promise<readonly Language[]>;
}

export class GetLanguagesUseCase implements GetLanguages {
  constructor(private readonly repository: LanguageRepository) {}

  execute(): Promise<readonly Language[]> {
    return this.repository.list();
  }
}
