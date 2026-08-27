import type { HttpClient } from '@/infrastructure/http/http-client';

import { HttpLanguageRepository } from './http-language-repository';

describe('HttpLanguageRepository', () => {
  it('languages responseunu mobil dil modeline eşler', async () => {
    const languageId = '39a92239-8310-4e4f-aa77-f639a8bb95fb';
    const httpClient: HttpClient = {
      get: jest.fn().mockResolvedValue([
        { languageId, code: 'TR', name: 'Türkçe', voiceName: 'Burcu' },
        { languageId: 'english-id', code: 'EN', name: 'English', voiceName: 'Joanna' },
        { languageId: 'german-id', code: 'DE', name: 'Deutsch', voiceName: 'Vicki' },
      ]),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };
    const repository = new HttpLanguageRepository(httpClient, '/languages');

    await expect(repository.list()).resolves.toEqual([
      { id: languageId, code: 'tr', name: 'Türkçe', voiceName: 'Burcu' },
      { id: 'english-id', code: 'en', name: 'English', voiceName: 'Joanna' },
    ]);
    expect(httpClient.get).toHaveBeenCalledWith('/languages', { signal: undefined });
  });
});
