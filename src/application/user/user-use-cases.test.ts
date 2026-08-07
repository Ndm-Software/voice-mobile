import { UpdatePreferencesUseCase, UpdateProfileUseCase } from './user-use-cases';
import type { UserRepository } from '@/domain/repositories/user-repository';

const repository: UserRepository = {
  getProfile: jest.fn(),
  updateProfile: jest.fn(async (_userId, input) => ({
    id: '1',
    ...input,
    phoneVerified: true,
    createdAt: '2026-08-07T00:00:00.000Z',
    updatedAt: '2026-08-07T00:00:00.000Z',
  })),
  getPreferences: jest.fn(),
  updatePreferences: jest.fn(async (_userId, input) => ({
    id: 'settings-1',
    userId: '1',
    ...input,
    createdAt: '2026-08-07T00:00:00.000Z',
    updatedAt: '2026-08-07T00:00:00.000Z',
  })),
  deleteAccount: jest.fn(),
};

describe('10. gün kullanıcı use-case doğrulamaları', () => {
  beforeEach(() => jest.clearAllMocks());

  it('profil alanlarını normalize ederek repository sınırına gönderir', async () => {
    const useCase = new UpdateProfileUseCase(repository);

    await useCase.execute('1', {
      firstName: ' Selin ',
      lastName: ' Aydın ',
      email: ' SELIN@EXAMPLE.COM ',
      phoneNumber: '+90 555 111 22 33',
    });

    expect(repository.updateProfile).toHaveBeenCalledWith('1', {
      firstName: 'Selin',
      lastName: 'Aydın',
      email: 'selin@example.com',
      phoneNumber: '+905551112233',
    });
  });

  it('boş profil alanlarını güvenli field error ile reddeder', async () => {
    const useCase = new UpdateProfileUseCase(repository);

    await expect(
      Promise.resolve().then(() =>
        useCase.execute('1', { firstName: '', lastName: '', email: '', phoneNumber: '' }),
      ),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      fieldErrors: expect.objectContaining({ firstName: 'Ad zorunludur.' }),
    });
  });

  it('tercih sürelerini sınırlar', async () => {
    const useCase = new UpdatePreferencesUseCase(repository);

    await expect(
      Promise.resolve().then(() =>
        useCase.execute('1', {
          languageId: '1',
          timezone: 'Europe/Istanbul',
          notificationsEnabled: true,
          defaultPushBeforeMinutes: 1441,
          defaultCallBeforeMinutes: -1,
        }),
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});
