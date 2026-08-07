import type { HttpClient } from '@/infrastructure/http/http-client';

import { HttpLanguageRepository } from './http-language-repository';

describe('HttpLanguageRepository', () => {
  it('languages responseunu mobil dil modeline eşler', async () => {
    const httpClient: HttpClient = {
      get: jest
        .fn()
        .mockResolvedValue([{ languageId: 1, code: 'tr', name: 'Türkçe', voiceName: 'tr-TR' }]),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };
    const repository = new HttpLanguageRepository(httpClient, '/languages');

    await expect(repository.list()).resolves.toEqual([
      { id: '1', code: 'tr', name: 'Türkçe', voiceName: 'tr-TR' },
    ]);
    expect(httpClient.get).toHaveBeenCalledWith('/languages', { signal: undefined });
  });
});
