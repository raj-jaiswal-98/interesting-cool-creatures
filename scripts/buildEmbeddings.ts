import { pipeline } from '@huggingface/transformers';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CREATURE_CATALOG } from '../src/data/creatureCatalog';
import { creatureToEmbeddingText, MODEL_ID, TEXT_VERSION } from '../src/services/ai/embeddingText';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function run() {
  console.log(`Loading Transformers.js feature-extraction model: ${MODEL_ID}...`);
  const extractor: any = await pipeline('feature-extraction', MODEL_ID);

  const ids: string[] = [];
  const vectors: number[][] = [];

  console.log(`Generating precomputed embeddings for ${CREATURE_CATALOG.length} catalog creatures...`);

  for (let i = 0; i < CREATURE_CATALOG.length; i++) {
    const c = CREATURE_CATALOG[i];
    const text = creatureToEmbeddingText(c);
    const out = await extractor(text, { pooling: 'mean', normalize: true });
    ids.push(c.id);
    vectors.push(Array.from(out.data as Float32Array, (n) => Math.round(n * 1e4) / 1e4));
    if ((i + 1) % 5 === 0 || i === CREATURE_CATALOG.length - 1) {
      console.log(`  [${i + 1}/${CREATURE_CATALOG.length}] Embedded "${c.commonName}"`);
    }
  }

  const outputPath = resolve(__dirname, '../src/data/creatureEmbeddings.json');
  mkdirSync(dirname(outputPath), { recursive: true });

  const payload = {
    header: {
      model: MODEL_ID,
      dim: vectors[0]?.length ?? 384,
      textVersion: TEXT_VERSION,
      createdAt: new Date().toISOString(),
    },
    ids,
    vectors,
  };

  writeFileSync(outputPath, JSON.stringify(payload));
  console.log(`\nSuccessfully created ${outputPath} with ${ids.length} vector embeddings (dimension: ${payload.header.dim})`);
}

run().catch((err) => {
  console.error('Error generating embeddings:', err);
  process.exit(1);
});
