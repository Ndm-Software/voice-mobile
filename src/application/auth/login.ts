import { normalizeEmail, throwIfInvalid, validateLogin } from '@/application/auth/auth-validation';
import type { Session } from '@/domain/models/session';
import type { AuthRepository } from '@/domain/repositories/auth-repository';

export interface Login {
  execute(email: string, password: string, signal?: AbortSignal): Promise<Session>;
}

export class LoginUseCase implements Login {
  constructor(private readonly repository: AuthRepository) {}

  async execute(email: string, password: string, signal?: AbortSignal): Promise<Session> {
    throwIfInvalid(validateLogin(email, password));
    return await this.repository.login({ email: normalizeEmail(email), password }, signal);
  }
}
