import { SavedBingoBoard } from '../types';

interface StorageEngine {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

const memoryStore = new Map<string, string>();
let storageEngine: StorageEngine | null = null;

try {
  // Safe lazy require to prevent top-level native module throw
  const AsyncStorageModule = require('@react-native-async-storage/async-storage');
  const instance = AsyncStorageModule.default || AsyncStorageModule;
  if (instance && typeof instance.getItem === 'function') {
    storageEngine = instance;
  }
} catch (e) {
  console.warn('AsyncStorage native module unavailable, using in-memory persistence fallback:', e);
}

export const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (storageEngine) {
      try {
        return await storageEngine.getItem(key);
      } catch (e) {
        console.warn(`safeStorage.getItem error for ${key}:`, e);
      }
    }
    return memoryStore.get(key) ?? null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (storageEngine) {
      try {
        await storageEngine.setItem(key, value);
        return;
      } catch (e) {
        console.warn(`safeStorage.setItem error for ${key}:`, e);
      }
    }
    memoryStore.set(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (storageEngine) {
      try {
        await storageEngine.removeItem(key);
        return;
      } catch (e) {
        console.warn(`safeStorage.removeItem error for ${key}:`, e);
      }
    }
    memoryStore.delete(key);
  },
};
