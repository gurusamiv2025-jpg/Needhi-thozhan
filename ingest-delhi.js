import fs from 'fs';
import pkg from 'pg';
import { pipeline } from '@xenova/transformers';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function ingest() {
  const extractor = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2');
  
  const files = [
    { name: 'delhi-local-services.json', type: 'delhi-services' }
  ];

  const client = await pool.connect();
  try {
    for (const f of files) {
      if (!fs.existsSync(f.name)) continue;
      const data = JSON.parse(fs.readFileSync(f.name, 'utf8'));
      console.log(`Ingesting ${f.name}...`);
      for (const item of data) {
        let content = '';
        if (item.topic) content += item.topic + '. ';
        if (item.detail) content += item.detail + '. ';
        if (item._search) content += item._search;
        
        const output = await extractor(content, { pooling: 'mean', normalize: true });
        const vector = Array.from(output.data);
        
        await client.query(
          "INSERT INTO documents (category, title, content, embedding, metadata) VALUES ($1, $2, $3, $4, $5)",
          [f.type, f.name, content, JSON.stringify(vector), JSON.stringify(item)]
        );
      }
    }
    console.log("Delhi data ingestion complete.");
  } catch (e) {
    console.error("Ingestion failed", e);
  } finally {
    client.release();
  }
}

ingest().then(() => process.exit(0));
