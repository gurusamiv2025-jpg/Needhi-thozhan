import Database from "better-sqlite3";
import * as sqliteVec from "sqlite-vec";

try {
  const db = new Database(":memory:");
  sqliteVec.load(db);

  db.exec(`
    CREATE VIRTUAL TABLE vec_test USING vec0(
      embedding float[4]
    );
  `);
  
  const insert = db.prepare("INSERT INTO vec_test (rowid, embedding) VALUES (?, ?)");
  insert.run(1, new Float32Array([0.1, 0.2, 0.3, 0.4]));
  insert.run(2, new Float32Array([0.5, 0.6, 0.7, 0.8]));

  const rows = db.prepare(`
    SELECT rowid, distance
    FROM vec_test
    WHERE embedding MATCH '[0.1, 0.2, 0.3, 0.4]'
    ORDER BY distance
    LIMIT 2;
  `).all();
  
  console.log("SUCCESS:", rows);
} catch (err) {
  console.error("ERROR:", err);
}
