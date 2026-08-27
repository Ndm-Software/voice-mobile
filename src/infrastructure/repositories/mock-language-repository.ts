import type { Language } from '@/domain/models/account';
import type { LanguageRepository } from '@/domain/repositories/language-repository';

const languages: readonly Language[] = [
  { id: '1', code: 'tr', name: 'Türkçe', voiceName: 'Burcu' },
  { id: '2', code: 'en', name: 'English', voiceName: 'Joanna' },
];

export class MockLanguageRepository implements LanguageRepository {
  list(): Promise<readonly Language[]> {
    return Promise.resolve(languages);
  }
}
