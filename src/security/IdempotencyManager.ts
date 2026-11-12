/**
 * IdempotencyManager
 * Tracks processed event IDs in a sliding window to prevent event replay attacks.
 */
export class IdempotencyManager {
  private processedEvents: Map<string, number> = new Map();
  private readonly ttlMs: number;
  private readonly maxWindowSize: number;

  constructor(ttlMs: number = 300000, maxWindowSize: number = 1000) {
    this.ttlMs = ttlMs; // 5 minutes TTL
    this.maxWindowSize = maxWindowSize;
  }

  /**
   * Checks if an eventId has already been processed.
   * Returns true if event is NEW (not replayed).
   * Returns false if event is DUPLICATE (replayed).
   */
  public registerEvent(eventId: string): boolean {
    if (!eventId || typeof eventId !== 'string') {
      return false;
    }

    this.cleanupOldEvents();

    if (this.processedEvents.has(eventId)) {
      return false; // Duplicate replayed event!
    }

    if (this.processedEvents.size >= this.maxWindowSize) {
      // Remove oldest entry
      const oldestKey = this.processedEvents.keys().next().value;
      if (oldestKey) {
        this.processedEvents.delete(oldestKey);
      }
    }

    this.processedEvents.set(eventId, Date.now());
    return true;
  }

  public hasEvent(eventId: string): boolean {
    return this.processedEvents.has(eventId);
  }

  public clear(): void {
    this.processedEvents.clear();
  }

  private cleanupOldEvents(): void {
    const now = Date.now();
    this.processedEvents.forEach((timestamp, id) => {
      if (now - timestamp > this.ttlMs) {
        this.processedEvents.delete(id);
      }
    });
  }
}

export const idempotencyManager = new IdempotencyManager();
