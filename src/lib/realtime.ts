/**
 * Realtime layer — uses BroadcastChannel for cross-tab communication
 * to simulate Socket.io behavior in the browser.
 * In production this would be replaced by actual Socket.io client connections.
 */

export type RealtimeEvent =
  | 'nuevo_pedido'
  | 'update_pedido'
  | 'mesa_actualizada'
  | 'corte_cerrado';

interface RealtimeMessage {
  event: RealtimeEvent;
  data: unknown;
}

type Listener = (data: unknown) => void;

class RealtimeSimulator {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<RealtimeEvent, Set<Listener>> = new Map();

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('taqueria-pos');
      this.channel.onmessage = (e: MessageEvent<RealtimeMessage>) => {
        this.dispatchLocal(e.data.event, e.data.data);
      };
    }
  }

  emit(event: RealtimeEvent, data: unknown) {
    this.dispatchLocal(event, data);
    if (this.channel) {
      this.channel.postMessage({ event, data } as RealtimeMessage);
    }
  }

  on(event: RealtimeEvent, listener: Listener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  private dispatchLocal(event: RealtimeEvent, data: unknown) {
    this.listeners.get(event)?.forEach((fn) => fn(data));
  }
}

export const realtime = new RealtimeSimulator();
