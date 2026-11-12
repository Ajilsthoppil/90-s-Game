export interface RateLimitRule {
  windowMs: number;
  maxRequests: number;
}

export class RateLimiter {
  private requestLogs: Map<string, number[]> = new Map();

  /**
   * Checks if an action key (e.g. `join_${playerId}`, `call_${playerId}`) exceeds its rate limit.
   * Returns true if request is ALLOWED.
   * Returns false if request is RATE LIMITED.
   */
  public isAllowed(key: string, rule: RateLimitRule): boolean {
    const now = Date.now();
    const timestamps = this.requestLogs.get(key) || [];

    // Filter out timestamps outside current window
    const validTimestamps = timestamps.filter((t) => now - t < rule.windowMs);

    if (validTimestamps.length >= rule.maxRequests) {
      this.requestLogs.set(key, validTimestamps);
      return false; // Rate limit exceeded!
    }

    validTimestamps.push(now);
    this.requestLogs.set(key, validTimestamps);
    return true;
  }

  public reset(key?: string): void {
    if (key) {
      this.requestLogs.delete(key);
    } else {
      this.requestLogs.clear();
    }
  }
}

export const rateLimiter = new RateLimiter();

export const DEFAULT_SECURITY_RATE_LIMITS = {
  joinAttempt: { windowMs: 60000, maxRequests: 10 }, // 10 joins per minute
  createRoom: { windowMs: 60000, maxRequests: 5 }, // 5 room creations per minute
  callNumber: { windowMs: 1000, maxRequests: 30 }, // 30 calls per second
  markNumber: { windowMs: 1000, maxRequests: 50 }, // 50 marks per second
  claimBingo: { windowMs: 5000, maxRequests: 5 }, // 5 claims per 5 seconds
  sendReaction: { windowMs: 10000, maxRequests: 10 }, // 10 reactions per 10 seconds
};
