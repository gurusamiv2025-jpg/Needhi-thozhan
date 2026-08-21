import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Initialize Postgres connection
// Expecting DATABASE_URL in .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  console.log("Starting migration...");
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Enable pgvector
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');
    
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        title TEXT,
        content TEXT NOT NULL,
        metadata JSONB,
        embedding vector(384) -- For paraphrase-multilingual-MiniLM-L12-v2
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS current_facts (
        id SERIAL PRIMARY KEY,
        fact VARCHAR(255) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        as_of_date DATE NOT NULL,
        note TEXT
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_feedback (
        id SERIAL PRIMARY KEY,
        query TEXT NOT NULL,
        response_summary TEXT,
        feedback_type VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create index for fast vector search
    await client.query(`
      CREATE INDEX IF NOT EXISTS docs_embedding_idx ON documents USING hnsw (embedding vector_cosine_ops);
    `);
    
    console.log("Schema created successfully.");
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Migration failed:", err);
  } finally {
    client.release();
  }
}

migrate().then(() => pool.end());
