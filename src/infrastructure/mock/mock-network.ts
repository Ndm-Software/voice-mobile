import type { MockNetworkOptions } from '@/core/types/mock-network';

export class MockNetworkError extends Error {
  readonly code = 'MOCK_NETWORK_ERROR';

  constructor() {
    super('Mock ağ senaryosu isteği başarısız yaptı.');
    this.name = 'MockNetworkError';
  }
}

function createAbortError(): Error {
  const error = new Error('İstek iptal edildi.');
  error.name = 'AbortError';
  return error;
}

export class MockNetwork {
  constructor(
    private readonly options: MockNetworkOptions,
    private readonly random: () => number = Math.random,
  ) {}

  async run<T>(operation: () => Promise<T> | T, signal?: AbortSignal): Promise<T> {
    await this.delay(signal);

    const fails =
      this.options.scenario === 'always-error' ||
      (this.options.scenario === 'intermittent-error' && this.random() < 0.25);

    if (fails) {
      throw new MockNetworkError();
    }

    return operation();
  }

  private delay(signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) {
      return Promise.reject(createAbortError());
    }

    const range = this.options.maximumDelayMs - this.options.minimumDelayMs;
    const duration = this.options.minimumDelayMs + Math.round(this.random() * range);

    return new Promise((resolve, reject) => {
      const onAbort = () => {
        clearTimeout(timer);
        reject(createAbortError());
      };
      const timer = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        resolve();
      }, duration);

      signal?.addEventListener('abort', onAbort, { once: true });
    });
  }
}
