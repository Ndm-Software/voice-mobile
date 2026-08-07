import { HttpError, type HttpClient, type HttpRequestOptions } from './http-client';

export class FetchHttpClient implements HttpClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
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

  private async request<TResponse>(path: string, init: RequestInit): Promise<TResponse> {
    const normalizedPath = path.replace(/^\/+/, '');
    const response = await fetch(`${this.baseUrl}/${normalizedPath}`, {
      ...init,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new HttpError('Sunucu isteği tamamlanamadı.', response.status);
    }

    return (await response.json()) as TResponse;
  }
}
