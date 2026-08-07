import { AuthRequestError, type AuthFieldErrors } from '@/domain/repositories/auth-repository';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLocaleLowerCase('en-US');
}

export function validateEmail(value: string): AuthFieldErrors {
  const email = normalizeEmail(value);

  if (!email) {
    return { email: 'E-posta adresi zorunludur.' };
  }

  if (!emailPattern.test(email)) {
    return { email: 'Geçerli bir e-posta adresi girin.' };
  }

  return {};
}

export function validateLogin(email: string, password: string): AuthFieldErrors {
  const errors = validateEmail(email);

  if (!password) {
    errors.password = 'Şifre zorunludur.';
  }

  return errors;
}

export function normalizePhoneNumber(value: string): string {
  return value.trim().replace(/[\s()-]/g, '');
}

export function validateRegister(
  firstName: string,
  lastName: string,
  email: string,
  phoneNumber: string,
  password: string,
  passwordConfirmation: string,
): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  if (!firstName.trim()) {
    errors.firstName = 'Ad zorunludur.';
  }
  if (!lastName.trim()) {
    errors.lastName = 'Soyad zorunludur.';
  }
  Object.assign(errors, validateEmail(email));
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  if (!normalizedPhone) {
    errors.phoneNumber = 'Telefon numarası zorunludur.';
  } else if (!/^\+?\d{7,15}$/.test(normalizedPhone)) {
    errors.phoneNumber = 'Geçerli bir telefon numarası girin.';
  }
  Object.assign(errors, validateNewPassword(password, passwordConfirmation));
  return errors;
}

export function validateGoogleCredential(idToken: string): AuthFieldErrors {
  return idToken.trim() ? {} : { form: 'Google kimlik bilgisi alınamadı.' };
}

export function validateNewPassword(
  password: string,
  passwordConfirmation: string,
): AuthFieldErrors {
  const errors: AuthFieldErrors = {};

  if (password.length < 8) {
    errors.password = 'Şifre en az 8 karakter olmalıdır.';
  } else if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    errors.password = 'Şifre büyük harf, küçük harf ve rakam içermelidir.';
  }

  if (!passwordConfirmation) {
    errors.passwordConfirmation = 'Şifre tekrarı zorunludur.';
  } else if (password !== passwordConfirmation) {
    errors.passwordConfirmation = 'Şifreler eşleşmiyor.';
  }

  return errors;
}

export function throwIfInvalid(fieldErrors: AuthFieldErrors): void {
  if (Object.keys(fieldErrors).length > 0) {
    throw new AuthRequestError(
      'VALIDATION_ERROR',
      'Lütfen işaretli alanları kontrol edin.',
      fieldErrors,
    );
  }
}
