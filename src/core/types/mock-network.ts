export type MockScenario = 'success' | 'intermittent-error' | 'always-error';

export interface MockNetworkOptions {
  readonly minimumDelayMs: number;
  readonly maximumDelayMs: number;
  readonly scenario: MockScenario;
}
