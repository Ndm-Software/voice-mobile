import { HttpError, type HttpClient } from '@/infrastructure/http/http-client';

import { HttpHomeOverviewRepository } from './http-home-overview-repository';

describe('HttpHomeOverviewRepository', () => {
  it('dashboard endpointi backendde yoksa API ana sayfası için güvenli fallback döner', async () => {
    const httpClient: HttpClient = {
      get: jest.fn().mockRejectedValue(new HttpError('not found', 404)),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };

    await expect(
      new HttpHomeOverviewRepository(httpClient, '/mobile/home-overview').getOverview(),
    ).resolves.toEqual({
      applicationName: 'Voia',
      assistantTagline: 'Kişisel asistanın her zaman yanında.',
      readiness: 'ready',
      dataSource: 'api',
    });
  });
});
