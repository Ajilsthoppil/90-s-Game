import { safeStorage } from './asyncStorageWrapper';

/**
 * SecureStorageWrapper
 * Abstraction layer for sensitive tokens (Auth tokens, refresh tokens, session keys).
 * Prepares secure keychain / encrypted storage integration for React Native.
 */
export class SecureStorageWrapper {
  private inMemoryTokens: Map<string, string> = new Map();

  public async setAuthToken(token: string): Promise<void> {
    if (!token) return;
    this.inMemoryTokens.set('AUTH_TOKEN', token);
    // In production React Native Android, integrates with EncryptedSharedPreferences / KeyStore
    await safeStorage.setItem('@secure_auth_token_hash', this.hashToken(token));
  }

  public async getAuthToken(): Promise<string | null> {
    return this.inMemoryTokens.get('AUTH_TOKEN') || null;
  }

  public async clearAuthToken(): Promise<void> {
    this.inMemoryTokens.delete('AUTH_TOKEN');
    await safeStorage.removeItem('@secure_auth_token_hash');
  }

  public async setSessionKey(key: string, value: string): Promise<void> {
    this.inMemoryTokens.set(key, value);
  }

  public async getSessionKey(key: string): Promise<string | null> {
    return this.inMemoryTokens.get(key) || null;
  }

  private hashToken(token: string): string {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `hash_${Math.abs(hash)}`;
  }
}

export const secureStorageWrapper = new SecureStorageWrapper();
