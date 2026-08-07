import AsyncStorage from '@react-native-async-storage/async-storage';

import type { KeyValueStorage } from '@/core/storage/key-value-storage';

export class AsyncStorageAdapter implements KeyValueStorage {
  getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  setItem(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  }

  removeItem(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  }
}
