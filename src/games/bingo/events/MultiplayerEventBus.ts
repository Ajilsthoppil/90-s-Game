import {
  MultiplayerEvent,
  MultiplayerEventListener,
  MultiplayerEventType,
} from '../types/bingo.types';

export class MultiplayerEventBus {
  private listeners: Map<MultiplayerEventType | '*', Set<MultiplayerEventListener>> = new Map();

  public subscribe(
    eventType: MultiplayerEventType | '*',
    listener: MultiplayerEventListener
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    return () => {
      this.listeners.get(eventType)?.delete(listener);
    };
  }

  public publish<T = any>(event: MultiplayerEvent<T>): void {
    const typeListeners = this.listeners.get(event.eventType);
    if (typeListeners) {
      typeListeners.forEach((fn) => fn(event));
    }

    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach((fn) => fn(event));
    }
  }

  public createAndPublish<T = any>(
    eventType: MultiplayerEventType,
    roomId: string,
    playerId: string,
    payload: T,
    matchId?: string
  ): MultiplayerEvent<T> {
    const event: MultiplayerEvent<T> = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      eventType,
      roomId,
      matchId,
      playerId,
      timestamp: Date.now(),
      payload,
    };

    this.publish(event);
    return event;
  }
}

export const multiplayerEventBus = new MultiplayerEventBus();
