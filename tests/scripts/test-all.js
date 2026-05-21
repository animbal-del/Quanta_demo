#!/usr/bin/env node
/**
 * test-all.js
 *
 * Runs all three submission flow tests in sequence and summarises results.
 *
 * Run: node tests/scripts/test-all.js
 */

import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const TESTS = [
  { name: "Voice Flow",    file: "test-voice-flow.js" },
  { name: "Document Flow", file: "test-document-flow.js" },
  { name: "Manual Flow",   file: "test-manual-flow.js" },
];

const results = [];

console.log("\n🧪  Quanta Scout OS — Full Flow Test Suite");
console.log("═".repeat(50) + "\n");

for (const test of TESTS) {
  const filePath = join(__dirname, test.file);
  const start = Date.now();
  try {
    execSync(`node ${filePath}`, { stdio: "inherit" });
    results.push({ name: test.name, status: "✅", ms: Date.now() - start });
  } catch {
    results.push({ name: test.name, status: "❌", ms: Date.now() - start });
  }
  console.log();
}

console.log("═".repeat(50));
console.log("📊  Results:\n");
results.forEach((r) => {
  console.log(`   ${r.status}  ${r.name.padEnd(20)} ${r.ms}ms`);
});

const passed = results.filter((r) => r.status === "✅").length;
console.log(`\n   ${passed}/${results.length} tests passed`);
console.log("═".repeat(50) + "\n");

if (passed < results.length) process.exit(1);
