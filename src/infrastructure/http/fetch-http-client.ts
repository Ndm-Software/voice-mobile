import { HttpError, type HttpClient, type HttpRequestOptions } from './http-client';

export class FetchHttpClient implements HttpClient {
  private readonly baseUrl: string;
  private readonly getAccessToken?: () => Promise<string | null>;

  constructor(
    baseUrl: string,
    options: { readonly getAccessToken?: () => Promise<string | null> } = {},
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.getAccessToken = options.getAccessToken;
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

  private async request<TResponse>(path: string, init: RequestInit): Promise<TResponse> {
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

    if (!response.ok) {
      throw new HttpError('Sunucu isteği tamamlanamadı.', response.status);
    }

    return (await response.json()) as TResponse;
  }
}
