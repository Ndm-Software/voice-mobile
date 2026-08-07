import { normalizeEmail, throwIfInvalid, validateEmail } from '@/application/auth/auth-validation';
import type {
  AuthRepository,
  PasswordResetRequestResult,
} from '@/domain/repositories/auth-repository';

export interface RequestPasswordReset {
  execute(email: string, signal?: AbortSignal): Promise<PasswordResetRequestResult>;
}

export class RequestPasswordResetUseCase implements RequestPasswordReset {
  constructor(private readonly repository: AuthRepository) {}

  async execute(email: string, signal?: AbortSignal): Promise<PasswordResetRequestResult> {
    throwIfInvalid(validateEmail(email));
    return await this.repository.requestPasswordReset(normalizeEmail(email), signal);
  }
}
