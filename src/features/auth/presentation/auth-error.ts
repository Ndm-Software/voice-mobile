import { AuthRequestError, type AuthFieldErrors } from '@/domain/repositories/auth-repository';

export function getAuthFieldErrors(error: unknown): AuthFieldErrors {
  if (error instanceof AuthRequestError) {
    return Object.keys(error.fieldErrors).length > 0 ? error.fieldErrors : { form: error.message };
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return {};
  }

  return { form: 'İşlem tamamlanamadı. Lütfen yeniden deneyin.' };
}
