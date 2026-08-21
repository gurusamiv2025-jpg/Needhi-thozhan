import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Pool } = pkg;
import { pipeline } from '@xenova/transformers';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function run() {
  console.log("Loading embedding model...");
  const extractor = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2', {
    quantized: true, // smaller, faster
  });
  
  async function embedText(text) {
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }

  const client = await pool.connect();
  
  try {
    // 1. Ingest IPC Facts
    if (fs.existsSync('ipc-facts.json')) {
      console.log("Ingesting ipc-facts.json...");
      const ipcData = JSON.parse(fs.readFileSync('ipc-facts.json', 'utf8'));
      for (const entry of ipcData) {
        const textToEmbed = `IPC Section ${entry.section}: ${entry.offense}. ${entry.punishment}. ${entry.note || ''}`;
        const embedding = await embedText(textToEmbed);
        await client.query(
          `INSERT INTO documents (category, title, content, metadata, embedding) VALUES ($1, $2, $3, $4, $5)`,
          ['IPC', entry.section, textToEmbed, entry, `[${embedding.join(',')}]`]
        );
      }
    }
    
    // 2. Ingest Constitutional Rights
    if (fs.existsSync('rights-articles.json')) {
      console.log("Ingesting rights-articles.json...");
      const rightsData = JSON.parse(fs.readFileSync('rights-articles.json', 'utf8'));
      for (const entry of rightsData) {
        const textToEmbed = `Constitution ${entry.article}: ${entry.title}. ${entry.detail}. ${entry.note || ''}`;
        const embedding = await embedText(textToEmbed);
        await client.query(
          `INSERT INTO documents (category, title, content, metadata, embedding) VALUES ($1, $2, $3, $4, $5)`,
          ['Constitution', entry.article, textToEmbed, entry, `[${embedding.join(',')}]`]
        );
      }
    }
    
    // 3. Ingest Government Services
    if (fs.existsSync('gov-services.json')) {
      console.log("Ingesting gov-services.json...");
      const govData = JSON.parse(fs.readFileSync('gov-services.json', 'utf8'));
      for (const entry of govData) {
        const textToEmbed = `Service: ${entry.service}. Authority: ${entry.authority}. ${entry.how_to}. Helpline: ${entry.helpline || 'None'}.`;
        const embedding = await embedText(textToEmbed);
        await client.query(
          `INSERT INTO documents (category, title, content, metadata, embedding) VALUES ($1, $2, $3, $4, $5)`,
          ['Government Service', entry.service, textToEmbed, entry, `[${embedding.join(',')}]`]
        );
      }
    }
    
    // 4. Ingest Tamil Nadu Services
    if (fs.existsSync('tn-local-services.json')) {
      console.log("Ingesting tn-local-services.json...");
      const tnData = JSON.parse(fs.readFileSync('tn-local-services.json', 'utf8'));
      for (const entry of tnData) {
        const textToEmbed = `Tamil Nadu: ${entry.topic}. ${entry.detail}. Helpline: ${entry.helpline || 'None'}.`;
        const embedding = await embedText(textToEmbed);
        await client.query(
          `INSERT INTO documents (category, title, content, metadata, embedding) VALUES ($1, $2, $3, $4, $5)`,
          ['Tamil Nadu', entry.topic, textToEmbed, entry, `[${embedding.join(',')}]`]
        );
      }
    }
    
    // 5. Ingest Current Facts
    if (fs.existsSync('current-facts.json')) {
      console.log("Ingesting current-facts.json...");
      const currentFacts = JSON.parse(fs.readFileSync('current-facts.json', 'utf8'));
      for (const entry of currentFacts) {
        await client.query(
          `INSERT INTO current_facts (fact, value, as_of_date, note) VALUES ($1, $2, $3, $4) ON CONFLICT (fact) DO UPDATE SET value = EXCLUDED.value, as_of_date = EXCLUDED.as_of_date`,
          [entry.fact, entry.value, entry.as_of, entry.note]
        );
      }
    }
    
    console.log("Ingestion complete!");
  } catch (err) {
    console.error("Error during ingestion:", err);
  } finally {
    client.release();
    pool.end();
  }
}

run();
