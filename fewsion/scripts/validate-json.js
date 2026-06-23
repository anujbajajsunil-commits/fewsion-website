#!/usr/bin/env node
/**
 * validate-json.js
 * Validates all JSON files under /data/ are well-formed.
 * Run: node scripts/validate-json.js
 * Used in: npm run lint:json
 */

const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
let   errors   = 0;

function walkDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walkDir(full);
    } else if (file.endsWith('.json')) {
      const rel = path.relative(process.cwd(), full);
      try {
        JSON.parse(fs.readFileSync(full, 'utf8'));
        console.log(`  ✓  ${rel}`);
      } catch (e) {
        console.error(`  ✗  ${rel} — ${e.message}`);
        errors++;
      }
    }
  });
}

console.log('\nValidating JSON data files…\n');
walkDir(DATA_DIR);
console.log('');

if (errors > 0) {
  console.error(`\n${errors} JSON file(s) failed validation.\n`);
  process.exit(1);
} else {
  console.log('All JSON files are valid.\n');
}
