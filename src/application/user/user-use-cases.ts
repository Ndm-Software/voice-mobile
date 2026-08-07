import { normalizeEmail, normalizePhoneNumber } from '@/application/auth/auth-validation';
import type { User, UserSettings } from '@/domain/models/account';
import {
  UserRequestError,
  type UpdatePreferencesInput,
  type UpdateProfileInput,
  type UserRepository,
} from '@/domain/repositories/user-repository';

export interface GetProfile {
  execute(userId: string): Promise<User>;
}

export interface UpdateProfile {
  execute(userId: string, input: UpdateProfileInput): Promise<User>;
}

export interface GetPreferences {
  execute(userId: string): Promise<UserSettings>;
}

export interface UpdatePreferences {
  execute(userId: string, input: UpdatePreferencesInput): Promise<UserSettings>;
}

export interface DeleteAccount {
  execute(userId: string): Promise<void>;
}

export class GetProfileUseCase implements GetProfile {
  constructor(private readonly repository: UserRepository) {}

  execute(userId: string): Promise<User> {
    return this.repository.getProfile(userId);
  }
}

export class UpdateProfileUseCase implements UpdateProfile {
  constructor(private readonly repository: UserRepository) {}

  execute(userId: string, input: UpdateProfileInput): Promise<User> {
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    const email = normalizeEmail(input.email);
    const phoneNumber = normalizePhoneNumber(input.phoneNumber);
    const fieldErrors: UpdateProfileInput = {
      firstName: firstName ? '' : 'Ad zorunludur.',
      lastName: lastName ? '' : 'Soyad zorunludur.',
      email: email.includes('@') ? '' : 'Geçerli bir e-posta girin.',
      phoneNumber: phoneNumber.length >= 10 ? '' : 'Geçerli bir telefon girin.',
    };
    const errors = Object.fromEntries(
      Object.entries(fieldErrors).filter(([, message]) => Boolean(message)),
    );
    if (Object.keys(errors).length > 0) {
      throw new UserRequestError('VALIDATION_ERROR', 'Bilgileri kontrol edin.', errors);
    }

    return this.repository.updateProfile(userId, { firstName, lastName, email, phoneNumber });
  }
}

export class GetPreferencesUseCase implements GetPreferences {
  constructor(private readonly repository: UserRepository) {}

  execute(userId: string): Promise<UserSettings> {
    return this.repository.getPreferences(userId);
  }
}

export class UpdatePreferencesUseCase implements UpdatePreferences {
  constructor(private readonly repository: UserRepository) {}

  execute(userId: string, input: UpdatePreferencesInput): Promise<UserSettings> {
    const errors: Partial<Record<keyof UpdatePreferencesInput, string>> = {};
    if (!input.languageId) errors.languageId = 'Dil seçin.';
    if (!input.timezone.trim()) errors.timezone = 'Timezone zorunludur.';
    if (!isValidOffset(input.defaultPushBeforeMinutes)) {
      errors.defaultPushBeforeMinutes = '0-1440 dakika arasında bir değer girin.';
    }
    if (!isValidOffset(input.defaultCallBeforeMinutes)) {
      errors.defaultCallBeforeMinutes = '0-1440 dakika arasında bir değer girin.';
    }
    if (Object.keys(errors).length > 0) {
      throw new UserRequestError('VALIDATION_ERROR', 'Tercihleri kontrol edin.', errors);
    }

    return this.repository.updatePreferences(userId, {
      ...input,
      timezone: input.timezone.trim(),
      province: input.province?.trim() || undefined,
    });
  }
}

export class DeleteAccountUseCase implements DeleteAccount {
  constructor(private readonly repository: UserRepository) {}

  execute(userId: string): Promise<void> {
    return this.repository.deleteAccount(userId);
  }
}

function isValidOffset(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 1440;
}
