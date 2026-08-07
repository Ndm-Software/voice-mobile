import {
  normalizeEmail,
  normalizePhoneNumber,
  throwIfInvalid,
  validateRegister,
} from '@/application/auth/auth-validation';
import type { Session } from '@/domain/models/session';
import type { AuthRepository } from '@/domain/repositories/auth-repository';

export interface Register {
  execute(
    firstName: string,
    lastName: string,
    email: string,
    phoneNumber: string,
    password: string,
    passwordConfirmation: string,
    signal?: AbortSignal,
  ): Promise<Session>;
}

export class RegisterUseCase implements Register {
  constructor(private readonly repository: AuthRepository) {}

  async execute(
    firstName: string,
    lastName: string,
    email: string,
    phoneNumber: string,
    password: string,
    passwordConfirmation: string,
    signal?: AbortSignal,
  ): Promise<Session> {
    throwIfInvalid(
      validateRegister(firstName, lastName, email, phoneNumber, password, passwordConfirmation),
    );
    return await this.repository.register(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizeEmail(email),
        phoneNumber: normalizePhoneNumber(phoneNumber),
        password,
      },
      signal,
    );
  }
}
