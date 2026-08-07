import { MockNetwork, MockNetworkError } from './mock-network';

describe('MockNetwork', () => {
  afterEach(() => jest.useRealTimers());

  it('300-800 ms aralığında belirlenen sahte gecikmeden sonra sonucu verir', async () => {
    jest.useFakeTimers();
    const network = new MockNetwork(
      { minimumDelayMs: 300, maximumDelayMs: 800, scenario: 'success' },
      () => 0.5,
    );

    const result = network.run(() => 'hazır');
    await jest.advanceTimersByTimeAsync(549);

    let settled = false;
    void result.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);

    await jest.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toBe('hazır');
  });

  it('zorunlu hata senaryosunda kontrollü ağ hatası üretir', async () => {
    const network = new MockNetwork({
      minimumDelayMs: 0,
      maximumDelayMs: 0,
      scenario: 'always-error',
    });

    await expect(network.run(() => 'çalışmamalı')).rejects.toBeInstanceOf(MockNetworkError);
  });

  it('iptal edilen isteği AbortError olarak sonlandırır', async () => {
    const controller = new AbortController();
    controller.abort();
    const network = new MockNetwork({
      minimumDelayMs: 300,
      maximumDelayMs: 800,
      scenario: 'success',
    });

    await expect(network.run(() => 'çalışmamalı', controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});
