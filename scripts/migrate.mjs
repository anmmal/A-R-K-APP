#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const migrationsDir = path.join(rootDir, 'db', 'migrations');
const baselineSchema = path.join(rootDir, 'db', 'schema.sql');

function usage() {
  console.log(`Usage:\n  node scripts/migrate.mjs [up|status|baseline]\n\nCommands:\n  up        Apply all pending migrations from db/migrations\n  status    Show pending/applied migration files (requires DB)\n  baseline  Apply db/schema.sql one-time baseline schema\n\nEnvironment:\n  DATABASE_URL   required for psql connection\n`);
}

function ensureDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required.');
    process.exit(1);
  }
}

function psql(sql) {
  const cmd = `psql "${process.env.DATABASE_URL}" -v ON_ERROR_STOP=1 -t -A -c ${JSON.stringify(sql)}`;
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim();
}

function runFile(filePath) {
  const cmd = `psql "${process.env.DATABASE_URL}" -v ON_ERROR_STOP=1 -f ${JSON.stringify(filePath)}`;
  execSync(cmd, { stdio: 'inherit' });
}

function ensureMigrationsTable() {
  psql(`
    create table if not exists schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    );
  `);
}

function migrationFiles() {
  if (!fs.existsSync(migrationsDir)) return [];
  return fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort();
}

function appliedMigrationsSet() {
  const rows = psql('select id from schema_migrations order by id asc;')
    .split('\n')
    .map((v) => v.trim())
    .filter(Boolean);
  return new Set(rows);
}

function applyPending() {
  ensureMigrationsTable();
  const files = migrationFiles();
  const applied = appliedMigrationsSet();
  const pending = files.filter((name) => !applied.has(name));

  if (!pending.length) {
    console.log('No pending migrations.');
    return;
  }

  for (const fileName of pending) {
    const filePath = path.join(migrationsDir, fileName);
    console.log(`Applying ${fileName} ...`);
    runFile(filePath);
    psql(`insert into schema_migrations (id) values (${JSON.stringify(fileName)}) on conflict (id) do nothing;`);
  }

  console.log(`Applied ${pending.length} migration(s).`);
}

function status() {
  ensureMigrationsTable();
  const files = migrationFiles();
  const applied = appliedMigrationsSet();
  if (!files.length) {
    console.log('No migration files found in db/migrations.');
    return;
  }

  for (const fileName of files) {
    const state = applied.has(fileName) ? 'applied' : 'pending';
    console.log(`${state.padEnd(8)} ${fileName}`);
  }
}

function baseline() {
  if (!fs.existsSync(baselineSchema)) {
    console.error('db/schema.sql was not found.');
    process.exit(1);
  }
  runFile(baselineSchema);
  console.log('Baseline schema applied from db/schema.sql.');
}

const command = process.argv[2];
if (!command || command === '--help' || command === '-h') {
  usage();
  process.exit(0);
}

ensureDatabaseUrl();

if (command === 'up') applyPending();
else if (command === 'status') status();
else if (command === 'baseline') baseline();
else {
  usage();
  process.exit(1);
}
