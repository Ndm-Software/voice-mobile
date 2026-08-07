export interface HttpRequestOptions {
  readonly signal?: AbortSignal;
}

export interface HttpClient {
  get<TResponse>(path: string, options?: HttpRequestOptions): Promise<TResponse>;
  post<TResponse, TBody = unknown>(
    path: string,
    body: TBody,
    options?: HttpRequestOptions,
  ): Promise<TResponse>;
  put<TResponse, TBody = unknown>(
    path: string,
    body: TBody,
    options?: HttpRequestOptions,
  ): Promise<TResponse>;
  patch<TResponse, TBody = unknown>(
    path: string,
    body: TBody,
    options?: HttpRequestOptions,
  ): Promise<TResponse>;
  delete<TResponse>(path: string, options?: HttpRequestOptions): Promise<TResponse>;
}

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
