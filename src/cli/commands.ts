/**
 * MINERADOR PRO - CLI Commands
 * Entry point for command-line operations
 */

import { initializeDatabase, getDatabase, closeDatabase } from '../core/database/connection';
import { runMigrations } from '../core/database/migrate';
import { MiningPipeline } from '../mining/pipeline/MiningPipeline';
import { GoogleSearchSource } from '../mining/sources/GoogleSearchSource';
import { SystemHealth } from '../utils/SystemHealth';

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case 'setup':
      await cmdSetup();
      break;
    case 'start':
      await cmdStart();
      break;
    case 'doctor':
      await cmdDoctor();
      break;
    case 'mine':
      await cmdMine();
      break;
    case 'migrate':
      await cmdMigrate();
      break;
    case 'worker':
      await cmdWorker();
      break;
    default:
      showHelp();
  }
}

async function cmdSetup() {
  console.log('MINERADOR PRO - Setup\n');
  
  // Check Node.js version
  const nodeVersion = process.version;
  console.log(`✓ Node.js version: ${nodeVersion}`);
  
  // Initialize database
  console.log('\nInitializing database...');
  initializeDatabase();
  console.log('✓ Database initialized');
  
  // Run migrations
  console.log('\nRunning migrations...');
  await runMigrations();
  console.log('✓ Migrations completed');
  
  // Check environment
  console.log('\nChecking environment...');
  const envVars = ['DATABASE_URL', 'GEMINI_API_KEY'];
  for (const envVar of envVars) {
    if (process.env[envVar]) {
      console.log(`✓ ${envVar} is set`);
    } else {
      console.log(`⚠ ${envVar} is not set`);
    }
  }
  
  console.log('\n✓ Setup completed!');
  console.log('\nNext steps:');
  console.log('  1. Configure .env file with your API keys');
  console.log('  2. Run: npm run start');
}

async function cmdStart() {
  console.log('MINERADOR PRO - Starting...\n');
  
  initializeDatabase();
  
  // Start mining loop
  const googleSource = new GoogleSearchSource({
    apiKey: process.env.GOOGLE_API_KEY,
    searchEngineId: process.env.GOOGLE_CX
  });
  
  const pipeline = new MiningPipeline({
    sources: [googleSource],
    concurrency: 5,
    rateLimitPerMinute: 30,
    enableValidation: true,
    enableDeduplication: true,
    enableScoring: true
  });
  
  console.log('Mining pipeline started...');
  console.log('Press Ctrl+C to stop\n');
  
  // Run mining cycles
  setInterval(async () => {
    try {
      const stats = await pipeline.runCycle();
      console.log('\nCycle completed:', stats);
    } catch (error) {
      console.error('Mining cycle error:', error);
    }
  }, 60000); // Every minute
  
  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    closeDatabase();
    process.exit(0);
  });
}

async function cmdDoctor() {
  console.log('MINERADOR PRO - Diagnostic Report\n');
  
  const health = new SystemHealth();
  const report = await health.runDiagnostics();
  
  console.log('Database:', report.database ? '✓ OK' : '✗ FAILED');
  console.log('Filesystem:', report.filesystem ? '✓ OK' : '✗ FAILED');
  console.log('Queues:', report.queues ? '✓ OK' : '✗ FAILED');
  console.log('Workers:', report.workers ? '✓ OK' : '✗ FAILED');
  console.log('Sources:', report.sources ? '✓ OK' : '✗ FAILED');
  console.log('AI Providers:', report.aiProviders ? '✓ OK' : '✗ FAILED');
  console.log('Messaging:', report.messaging ? '✓ OK' : '✗ FAILED');
  
  const allHealthy = Object.values(report).every(v => v === true);
  console.log(`\nOverall: ${allHealthy ? '✓ HEALTHY' : '⚠ ISSUES DETECTED'}`);
}

async function cmdMine() {
  console.log('MINERADOR PRO - Manual Mining Run\n');
  
  initializeDatabase();
  
  const googleSource = new GoogleSearchSource();
  
  const pipeline = new MiningPipeline({
    sources: [googleSource],
    concurrency: 3,
    rateLimitPerMinute: 20,
    enableValidation: true,
    enableDeduplication: true,
    enableScoring: true
  });
  
  const stats = await pipeline.runCycle();
  
  console.log('\nMining completed:');
  console.log(`  Queries: ${stats.queriesExecuted}`);
  console.log(`  Results: ${stats.resultsFound}`);
  console.log(`  Ads: ${stats.advertisementsExtracted}`);
  console.log(`  Opportunities: ${stats.opportunitiesFound}`);
  console.log(`  Duplicates: ${stats.duplicatesRemoved}`);
  console.log(`  Errors: ${stats.errors}`);
  
  closeDatabase();
}

async function cmdMigrate() {
  console.log('MINERADOR PRO - Running migrations...\n');
  
  initializeDatabase();
  await runMigrations();
  
  console.log('\n✓ Migrations completed');
  
  closeDatabase();
}

async function cmdWorker() {
  console.log('MINERADOR PRO - Starting worker...\n');
  
  initializeDatabase();
  
  // Worker logic would go here
  // Process queue items, handle background tasks, etc.
  
  console.log('Worker started');
  
  process.on('SIGINT', () => {
    console.log('\nShutting down worker...');
    closeDatabase();
    process.exit(0);
  });
}

function showHelp() {
  console.log(`
MINERADOR PRO - Brazilian Opportunity Intelligence Engine

Usage: npm run <command>

Commands:
  setup     Initialize database and run migrations
  start     Start the mining engine
  doctor    Run system diagnostics
  mine      Run one manual mining cycle
  migrate   Run database migrations
  worker    Start background worker
  help      Show this help message

Examples:
  npm run setup
  npm run start
  npm run doctor
  npm run mine
`);
}

main().catch(console.error);
