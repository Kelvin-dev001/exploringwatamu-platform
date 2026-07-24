'use strict';

// Dependency-free load tester.
// Usage: node scripts/loadtest.js <url> <concurrency> <durationSeconds>
// Example: node scripts/loadtest.js http://localhost:5000/api/health 200 15

const http = require('http');
const https = require('https');

const url = process.argv[2] || 'http://localhost:5000/api/health';
const concurrency = parseInt(process.argv[3], 10) || 200;
const durationSec = parseInt(process.argv[4], 10) || 15;
const lib = url.startsWith('https') ? https : http;

let done = 0;
let errors = 0;
let stop = false;
const latencies = [];

function hit() {
  if (stop) return;
  const start = Date.now();
  const req = lib.get(url, (res) => {
    res.on('data', () => {});
    res.on('end', () => {
      latencies.push(Date.now() - start);
      done += 1;
      hit();
    });
  });
  req.on('error', () => {
    errors += 1;
    hit();
  });
  req.setTimeout(10000, () => req.destroy());
}

function pct(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

function report() {
  const total = done + errors;
  console.log(`\nRequests:   ${total}  (ok ${done}, errors ${errors})`);
  console.log(`Throughput: ~${(done / durationSec).toFixed(1)} req/s`);
  console.log(
    `Latency ms: p50 ${pct(latencies, 50)} | p95 ${pct(latencies, 95)} | p99 ${pct(latencies, 99)} | max ${latencies.length ? Math.max(...latencies) : 0}`
  );
  process.exit(0);
}

console.log(`Load test -> ${url}`);
console.log(`concurrency=${concurrency}  duration=${durationSec}s\n`);
for (let i = 0; i < concurrency; i += 1) hit();
setTimeout(() => {
  stop = true;
  setTimeout(report, 500);
}, durationSec * 1000);
