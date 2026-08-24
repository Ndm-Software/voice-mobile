import type { Language } from '@/domain/models/account';
import type { LanguageRepository } from '@/domain/repositories/language-repository';

const languages: readonly Language[] = [
  { id: '1', code: 'tr', name: 'Türkçe' },
  { id: '2', code: 'en', name: 'English' },
  { id: '3', code: 'de', name: 'Deutsch' },
  { id: '4', code: 'fr', name: 'Français' },
  { id: '5', code: 'es', name: 'Español' },
  { id: '6', code: 'ar', name: 'العربية' },
];

export class MockLanguageRepository implements LanguageRepository {
  list(): Promise<readonly Language[]> {
    return Promise.resolve(languages);
  }
}
