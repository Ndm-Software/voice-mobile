import {
  resolveDataSource,
  resolveEnvironment,
  resolveMockDelay,
  resolveMockScenario,
} from './environment';

describe('resolveEnvironment', () => {
  it.each(['development', 'staging', 'production'] as const)('%s değerini kabul eder', (value) => {
    expect(resolveEnvironment(value)).toBe(value);
  });

  it('bilinmeyen veya boş değerlerde development kullanır', () => {
    expect(resolveEnvironment(undefined)).toBe('development');
    expect(resolveEnvironment('test')).toBe('development');
  });
});

describe('resolveDataSource', () => {
  it('yalnız api değerinde gerçek veri kaynağını seçer', () => {
    expect(resolveDataSource('api')).toBe('api');
  });

  it('diğer değerlerde güvenli biçimde mock kullanır', () => {
    expect(resolveDataSource(undefined)).toBe('mock');
    expect(resolveDataSource('test')).toBe('mock');
  });
});

describe('mock ağ yapılandırması', () => {
  it('desteklenen hata senaryolarını kabul eder', () => {
    expect(resolveMockScenario('intermittent-error')).toBe('intermittent-error');
    expect(resolveMockScenario('always-error')).toBe('always-error');
    expect(resolveMockScenario('bilinmeyen')).toBe('success');
  });

  it('geçersiz gecikmelerde güvenli varsayılanı kullanır', () => {
    expect(resolveMockDelay('450', 300)).toBe(450);
    expect(resolveMockDelay('-1', 300)).toBe(300);
    expect(resolveMockDelay('abc', 300)).toBe(300);
  });
});
