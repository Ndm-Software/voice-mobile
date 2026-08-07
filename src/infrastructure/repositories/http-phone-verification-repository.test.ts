import type { HttpClient } from '@/infrastructure/http/http-client';

import { HttpPhoneVerificationRepository } from './http-phone-verification-repository';

describe('HttpPhoneVerificationRepository', () => {
  it('OTP request ve verify payloadlarını backend sözleşmesine eşler', async () => {
    const httpClient: HttpClient = {
      get: jest.fn(),
      post: jest.fn().mockResolvedValue({
        challenge_id: 5001,
        masked_phone_number: '+90 ••• ••• •• 33',
        expires_at: '2026-08-06T09:05:00.000Z',
        resend_available_at: '2026-08-06T09:00:30.000Z',
        remaining_attempts: 5,
        max_attempts: 5,
      }),
    };
    const repository = new HttpPhoneVerificationRepository(httpClient, {
      request: '/auth/phone/otp/request',
      verify: '/auth/phone/otp/verify',
    });

    await expect(repository.request('1001', '+905551112233')).resolves.toEqual({
      id: '5001',
      maskedPhoneNumber: '+90 ••• ••• •• 33',
      expiresAt: '2026-08-06T09:05:00.000Z',
      resendAvailableAt: '2026-08-06T09:00:30.000Z',
      remainingAttempts: 5,
      maxAttempts: 5,
    });
    await repository.verify('1001', '5001', '123456');

    expect(httpClient.post).toHaveBeenNthCalledWith(
      1,
      '/auth/phone/otp/request',
      { phone_number: '+905551112233', purpose: 'phone-verification' },
      { signal: undefined },
    );
    expect(httpClient.post).toHaveBeenNthCalledWith(
      2,
      '/auth/phone/otp/verify',
      { challenge_id: '5001', code: '123456', purpose: 'phone-verification' },
      { signal: undefined },
    );
  });
});
