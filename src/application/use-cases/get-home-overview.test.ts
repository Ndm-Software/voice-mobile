import type { HomeOverviewRepository } from '@/domain/repositories/home-overview-repository';

import { GetHomeOverviewUseCase } from './get-home-overview';

describe('GetHomeOverviewUseCase', () => {
  it('repository sonucunu değiştirmeden döndürür', async () => {
    const overview = {
      applicationName: 'Voia',
      assistantTagline: 'Kişisel asistanın her zaman yanında.',
      readiness: 'ready' as const,
      dataSource: 'mock' as const,
    };
    const repository: HomeOverviewRepository = {
      getOverview: jest.fn().mockResolvedValue(overview),
    };

    const useCase = new GetHomeOverviewUseCase(repository);

    await expect(useCase.execute()).resolves.toEqual(overview);
    expect(repository.getOverview).toHaveBeenCalledTimes(1);
  });
});
