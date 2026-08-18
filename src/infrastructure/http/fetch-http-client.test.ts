import { FetchHttpClient } from './fetch-http-client';

describe('FetchHttpClient auth retry', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('401 sonrasında tokenı bir kez yenileyip ilk isteği tekrarlar', async () => {
    let accessToken = 'expired-token';
    const refreshAccessToken = jest.fn(async () => {
      accessToken = 'renewed-token';
      return true;
    });
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(new Response('{}', { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ userId: 'user-1' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    const client = new FetchHttpClient('https://api.voia.test/api', {
      getAccessToken: async () => accessToken,
      refreshAccessToken,
    });

    await expect(client.get('/auth/me')).resolves.toEqual({ userId: 'user-1' });
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      2,
      'https://api.voia.test/api/auth/me',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer renewed-token' }),
      }),
    );
  });

  it('refresh endpointinin 401 cevabında yeniden refresh döngüsü oluşturmaz', async () => {
    const refreshAccessToken = jest.fn(async () => true);
    globalThis.fetch = jest.fn().mockResolvedValue(new Response('{}', { status: 401 }));
    const client = new FetchHttpClient('https://api.voia.test/api', {
      getAccessToken: async () => 'expired-token',
      refreshAccessToken,
    });

    await expect(client.post('/auth/refresh', { refreshToken: 'invalid' })).rejects.toMatchObject({
      status: 401,
    });
    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});
