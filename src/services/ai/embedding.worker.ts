import { pipeline, env } from '@huggingface/transformers';
import { MODEL_ID } from './embeddingText';

env.allowLocalModels = false;

let extractor: any = null;

async function load() {
  const hasGPU = typeof navigator !== 'undefined' && 'gpu' in navigator;
  const opts = (device: string, dtype: string) => ({
    device,
    dtype,
    progress_callback: (p: any) =>
      self.postMessage({ type: 'progress', value: p.progress ?? 0 }),
  });
  try {
    extractor = await pipeline('feature-extraction', MODEL_ID, opts(hasGPU ? 'webgpu' : 'wasm', hasGPU ? 'fp32' : 'q8') as any);
  } catch {
    extractor = await pipeline('feature-extraction', MODEL_ID, opts('wasm', 'q8') as any);
  }
}

self.onmessage = async (e: MessageEvent) => {
  const { type, id, text } = e.data;
  try {
    if (type === 'init') {
      await load();
      self.postMessage({ type: 'ready' });
    } else if (type === 'embed') {
      if (!extractor) {
        await load();
      }
      const out = await extractor(text, { pooling: 'mean', normalize: true });
      const vec = new Float32Array(out.data);
      (self.postMessage as any)({ type: 'result', id, vec }, [vec.buffer]);
    }
  } catch (err) {
    self.postMessage({ type: 'error', id, message: String(err) });
  }
};
