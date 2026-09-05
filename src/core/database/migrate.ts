import { getDatabase } from './connection';
import fs from 'fs';
import path from 'path';

export async function runMigrations(): Promise<void> {
  const db = getDatabase();
  const migrationsDir = path.join(__dirname, 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found');
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const migrationName = file.replace('.sql', '');
    
    const exists = db.prepare(
      'SELECT 1 FROM schema_migrations WHERE migration_name = ?'
    ).get(migrationName);

    if (exists) {
      console.log(`✓ Migration ${migrationName} already applied`);
      continue;
    }

    console.log(`Applying migration: ${migrationName}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    
    db.exec(sql);
    
    db.prepare(
      'INSERT INTO schema_migrations (migration_name) VALUES (?)'
    ).run(migrationName);
    
    console.log(`✓ Migration ${migrationName} applied`);
  }
}
