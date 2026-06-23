#!/usr/bin/env node
/**
 * export-seed.js
 * Exports seed JSON data files to CSV for spreadsheet review.
 * Run: node scripts/export-seed.js
 */

const fs   = require('fs');
const path = require('path');

function jsonToCsv(items) {
  if (!items || !items.length) return '';
  const keys = Object.keys(flattenObject(items[0]));
  const header = keys.join(',');
  const rows = items.map(item => {
    const flat = flattenObject(item);
    return keys.map(k => {
      const val = flat[k] ?? '';
      const str = typeof val === 'string' ? val : JSON.stringify(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(',');
  });
  return [header, ...rows].join('\n');
}

function flattenObject(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, k) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && !Array.isArray(obj[k]) && obj[k] !== null) {
      Object.assign(acc, flattenObject(obj[k], key));
    } else {
      acc[key] = Array.isArray(obj[k]) ? obj[k].join('|') : obj[k];
    }
    return acc;
  }, {});
}

const exports = [
  { file: 'data/creators/seed.json',  key: 'creators'  },
  { file: 'data/brands/seed.json',    key: 'brands'    },
  { file: 'data/editors/seed.json',   key: 'editors'   },
  { file: 'data/campaigns/seed.json', key: 'campaigns' },
];

const outDir = path.join(__dirname, '..', 'data', 'exports');
fs.mkdirSync(outDir, { recursive: true });

exports.forEach(({ file, key }) => {
  const data  = JSON.parse(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'));
  const items = data[key] || [];
  const csv   = jsonToCsv(items);
  const out   = path.join(outDir, `${key}.csv`);
  fs.writeFileSync(out, csv, 'utf8');
  console.log(`Exported ${items.length} ${key} → ${out}`);
});

console.log('\nDone.');
