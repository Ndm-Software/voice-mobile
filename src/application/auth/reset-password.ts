import { throwIfInvalid, validateNewPassword } from '@/application/auth/auth-validation';
import type { AuthRepository } from '@/domain/repositories/auth-repository';

export interface ResetPassword {
  execute(
    token: string,
    password: string,
    passwordConfirmation: string,
    signal?: AbortSignal,
  ): Promise<void>;
}

export class ResetPasswordUseCase implements ResetPassword {
  constructor(private readonly repository: AuthRepository) {}

  async execute(
    token: string,
    password: string,
    passwordConfirmation: string,
    signal?: AbortSignal,
  ): Promise<void> {
    throwIfInvalid(validateNewPassword(password, passwordConfirmation));
    return await this.repository.resetPassword({ password, token }, signal);
  }
}
