import type { EmbeddingStatus } from '../../types/ai';

type Pending = { resolve: (v: Float32Array) => void; reject: (e: Error) => void };

class EmbeddingService {
  status: EmbeddingStatus = 'idle';
  progress = 0;
  private worker?: Worker;
  private pending = new Map<number, Pending>();
  private seq = 0;
  private listeners = new Set<() => void>();

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getStatus = () => this.status;
  getProgress = () => this.progress;

  private set(s: EmbeddingStatus) {
    this.status = s;
    this.listeners.forEach((l) => l());
  }

  init() {
    if (this.worker || typeof Worker === 'undefined') {
      if (typeof Worker === 'undefined') this.set('unsupported');
      return;
    }
    this.set('loading');
    try {
      this.worker = new Worker(new URL('./embedding.worker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = (e: MessageEvent) => {
        const m = e.data;
        if (m.type === 'progress') {
          this.progress = m.value;
          this.listeners.forEach((l) => l());
        } else if (m.type === 'ready') {
          this.set('ready');
        } else if (m.type === 'result') {
          this.pending.get(m.id)?.resolve(m.vec);
          this.pending.delete(m.id);
        } else if (m.type === 'error') {
          if (m.id === undefined) {
            this.set('unsupported');
          } else {
            this.pending.get(m.id)?.reject(new Error(m.message));
            this.pending.delete(m.id);
          }
        }
      };
      this.worker.onerror = () => this.set('unsupported');
      this.worker.postMessage({ type: 'init' });
    } catch {
      this.set('unsupported');
    }
  }

  embed(text: string): Promise<Float32Array> {
    if (!this.worker || this.status !== 'ready') {
      return Promise.reject(new Error('Embedding service is not ready'));
    }
    const id = ++this.seq;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker!.postMessage({ type: 'embed', id, text });
    });
  }
}

export const embeddingService = new EmbeddingService();
