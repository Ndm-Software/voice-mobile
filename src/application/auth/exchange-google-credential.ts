import { throwIfInvalid, validateGoogleCredential } from '@/application/auth/auth-validation';
import type { Session } from '@/domain/models/session';
import type { AuthRepository } from '@/domain/repositories/auth-repository';

export interface ExchangeGoogleCredential {
  execute(idToken: string, signal?: AbortSignal): Promise<Session>;
}

export class ExchangeGoogleCredentialUseCase implements ExchangeGoogleCredential {
  constructor(private readonly repository: AuthRepository) {}

  async execute(idToken: string, signal?: AbortSignal): Promise<Session> {
    throwIfInvalid(validateGoogleCredential(idToken));
    return await this.repository.exchangeGoogleCredential(
      { provider: 'google', idToken: idToken.trim() },
      signal,
    );
  }
}
