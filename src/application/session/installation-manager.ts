import * as Crypto from 'expo-crypto';

import type { SecureStorage } from '@/core/storage/secure-storage';

export const INSTALLATION_ID_STORAGE_KEY = 'voia.installation-id.v1';

export class InstallationManager {
  constructor(
    private readonly storage: SecureStorage,
    private readonly createId: () => string = () => Crypto.randomUUID(),
  ) {}

  async getOrCreate(): Promise<string> {
    const existing = await this.storage.getItem(INSTALLATION_ID_STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const installationId = this.createId();
    await this.storage.setItem(INSTALLATION_ID_STORAGE_KEY, installationId);
    return installationId;
  }

  getExisting(): Promise<string | null> {
    return this.storage.getItem(INSTALLATION_ID_STORAGE_KEY);
  }
}
