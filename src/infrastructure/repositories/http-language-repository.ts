import type { Language } from '@/domain/models/account';
import type { LanguageRepository } from '@/domain/repositories/language-repository';
import type { HttpClient } from '@/infrastructure/http/http-client';

interface LanguageDto {
  readonly languageId: string | number;
  readonly code: string;
  readonly name: string;
  readonly voiceName?: string | null;
}

const supportedMvpLanguageCodes = new Set(['tr', 'en']);

export class HttpLanguageRepository implements LanguageRepository {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly endpoint: string,
  ) {}

  async list(signal?: AbortSignal): Promise<readonly Language[]> {
    const response = await this.httpClient.get<LanguageDto[] | { languages: LanguageDto[] }>(
      this.endpoint,
      { signal },
    );
    const languages = Array.isArray(response) ? response : response.languages;

    return languages
      .filter((language) => supportedMvpLanguageCodes.has(language.code.toLocaleLowerCase('en-US')))
      .map((language) => ({
        id: String(language.languageId),
        code: language.code.toLocaleLowerCase('en-US'),
        name: language.name,
        voiceName: language.voiceName ?? undefined,
      }));
  }
}
