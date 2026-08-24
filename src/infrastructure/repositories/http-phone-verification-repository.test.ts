import type { HttpClient } from '@/infrastructure/http/http-client';

import { HttpPhoneVerificationRepository } from './http-phone-verification-repository';

describe('HttpPhoneVerificationRepository', () => {
  it('OTP request ve verify payloadlarını backend sözleşmesine eşler', async () => {
    const httpClient: HttpClient = {
      get: jest.fn(),
      post: jest.fn().mockResolvedValue({
        message: 'Doğrulama kodu gönderildi.',
        expiresInSeconds: 600,
      }),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };
    const repository = new HttpPhoneVerificationRepository(httpClient, {
      request: '/auth/register/resend',
      verify: '/auth/register/verify',
    });

    const challenge = await repository.request('+905551112233');
    expect(challenge).toMatchObject({
      id: '+905551112233',
      maskedPhoneNumber: '+90 ••• ••• •• 33',
    });
    expect(Date.parse(challenge.expiresAt)).toBeGreaterThan(Date.now());
    await repository.verify('+905551112233', '123456');

    expect(httpClient.post).toHaveBeenNthCalledWith(
      1,
      '/auth/register/resend',
      { phoneNumber: '+905551112233' },
      { signal: undefined },
    );
    expect(httpClient.post).toHaveBeenNthCalledWith(
      2,
      '/auth/register/verify',
      { phoneNumber: '+905551112233', code: '123456' },
      { signal: undefined },
    );
  });
});
