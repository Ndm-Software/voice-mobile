import { HttpError, type HttpClient, type HttpRequestOptions } from './http-client';

export class FetchHttpClient implements HttpClient {
  private readonly baseUrl: string;
  private readonly getAccessToken?: () => Promise<string | null>;
  private readonly refreshAccessToken?: () => Promise<boolean>;
  private refreshPromise?: Promise<boolean>;

  constructor(
    baseUrl: string,
    options: {
      readonly getAccessToken?: () => Promise<string | null>;
      readonly refreshAccessToken?: () => Promise<boolean>;
    } = {},
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.getAccessToken = options.getAccessToken;
    this.refreshAccessToken = options.refreshAccessToken;
  }

  async get<TResponse>(path: string, options?: HttpRequestOptions): Promise<TResponse> {
    return this.request<TResponse>(path, { method: 'GET', signal: options?.signal });
  }

  post<TResponse, TBody = unknown>(
    path: string,
    body: TBody,
    options?: HttpRequestOptions,
  ): Promise<TResponse> {
    return this.request<TResponse>(path, {
      body: JSON.stringify(body),
      method: 'POST',
      signal: options?.signal,
    });
  }

  put<TResponse, TBody = unknown>(
    path: string,
    body: TBody,
    options?: HttpRequestOptions,
  ): Promise<TResponse> {
    return this.request<TResponse>(path, {
      body: JSON.stringify(body),
      method: 'PUT',
      signal: options?.signal,
    });
  }

  patch<TResponse, TBody = unknown>(
    path: string,
    body: TBody,
    options?: HttpRequestOptions,
  ): Promise<TResponse> {
    return this.request<TResponse>(path, {
      body: JSON.stringify(body),
      method: 'PATCH',
      signal: options?.signal,
    });
  }

  delete<TResponse>(path: string, options?: HttpRequestOptions): Promise<TResponse> {
    return this.request<TResponse>(path, { method: 'DELETE', signal: options?.signal });
  }

  private async request<TResponse>(
    path: string,
    init: RequestInit,
    allowRefreshRetry = true,
  ): Promise<TResponse> {
    const accessToken = this.getAccessToken ? await this.getAccessToken() : null;
    const normalizedPath = path.replace(/^\/+/, '');
    const method = init.method ?? 'GET';
    const response = await fetch(`${this.baseUrl}/${normalizedPath}`, {
      ...init,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });

    if (process.env.NODE_ENV !== 'production') {
      console.info(`[Voia HTTP] ${method} /${normalizedPath} -> ${response.status}`);
    }

    if (
      response.status === 401 &&
      allowRefreshRetry &&
      this.refreshAccessToken &&
      !normalizedPath.endsWith('auth/refresh') &&
      (await this.refreshOnce())
    ) {
      return this.request<TResponse>(path, init, false);
    }

    if (!response.ok) {
      throw await createHttpError(response);
    }

    return (await response.json()) as TResponse;
  }

  private async refreshOnce(): Promise<boolean> {
    this.refreshPromise ??= this.refreshAccessToken!().finally(() => {
      this.refreshPromise = undefined;
    });
    return this.refreshPromise;
  }
}

interface ApiErrorBody {
  readonly code?: unknown;
  readonly message?: unknown;
  readonly fields?: unknown;
  readonly requestId?: unknown;
}

async function createHttpError(response: Response): Promise<HttpError> {
  const fallbackMessage = 'Sunucu isteği tamamlanamadı.';

  try {
    const body = (await response.text()).trim();
    if (!body) return new HttpError(fallbackMessage, response.status);

    const parsed: unknown = JSON.parse(body);
    if (!isApiErrorBody(parsed)) return new HttpError(fallbackMessage, response.status);

    const message = typeof parsed.message === 'string' ? parsed.message : fallbackMessage;
    const code = typeof parsed.code === 'string' ? parsed.code : undefined;
    const requestId = typeof parsed.requestId === 'string' ? parsed.requestId : undefined;
    const fields = isErrorFields(parsed.fields) ? parsed.fields : undefined;
    return new HttpError(message, response.status, code, fields, requestId);
  } catch {
    return new HttpError(fallbackMessage, response.status);
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isErrorFields(
  value: unknown,
): value is Readonly<Record<string, string | readonly string[]>> {
  if (typeof value !== 'object' || value === null) return false;
  return Object.values(value).every(
    (message) =>
      typeof message === 'string' ||
      (Array.isArray(message) && message.every((item) => typeof item === 'string')),
  );
}
