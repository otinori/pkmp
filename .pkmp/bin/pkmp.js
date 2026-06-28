#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import YAML from 'yaml';

import { validateAllSchemas } from '../lib/validators/schema.js';
import { validateRegistry } from '../lib/validators/registry.js';
import { renderModelFile, renderIndexFiles } from '../lib/renderers/markdown.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '../..');

const [,, command] = process.argv;

switch (command) {
  case 'verify':
    runVerify();
    break;
  case 'regenerate':
    runRegenerate();
    break;
  default:
    console.log('Usage: pkmp <command>');
    console.log('  verify      — validate schemas and registry consistency');
    console.log('  regenerate  — render all YAML models to Markdown views');
    process.exit(1);
}

function runVerify() {
  console.log('=== PKMP Verify ===\n');
  let totalErrors = 0;

  // 1. Schema validation
  console.log('--- Schema Validation ---');
  const schemaErrors = validateAllSchemas(workspaceRoot);
  if (schemaErrors.length === 0) {
    console.log('  All schemas valid.\n');
  } else {
    for (const { file, errors } of schemaErrors) {
      console.error(`  [FAIL] ${file}`);
      for (const e of errors) {
        console.error(`         ${e}`);
      }
    }
    totalErrors += schemaErrors.length;
    console.log();
  }

  // 2. Registry validation
  console.log('--- Registry Validation ---');
  const registryResults = validateRegistry(workspaceRoot);
  const registryErrors = registryResults.filter(r => !r.errors.every(e => e.startsWith('[WARN]')));
  const registryWarnings = registryResults.filter(r => r.errors.every(e => e.startsWith('[WARN]')));
  if (registryErrors.length === 0 && registryWarnings.length === 0) {
    console.log('  Registry is consistent with file system.\n');
  } else {
    for (const { file, errors } of registryErrors) {
      console.error(`  [FAIL] ${file}`);
      for (const e of errors) {
        console.error(`         ${e}`);
      }
    }
    for (const { file, errors } of registryWarnings) {
      console.warn(`  [WARN] ${file}`);
      for (const e of errors) {
        console.warn(`         ${e}`);
      }
    }
    totalErrors += registryErrors.length;
    console.log();
  }

  if (totalErrors === 0) {
    console.log('=== All checks passed. ===');
  } else {
    console.error(`=== Verify failed with ${totalErrors} error group(s). ===`);
    process.exit(1);
  }
}

function runRegenerate() {
  console.log('=== PKMP Regenerate ===\n');

  // Ensure views/ directory exists
  const viewsDir = path.join(workspaceRoot, 'views');
  if (!fs.existsSync(viewsDir)) {
    fs.mkdirSync(viewsDir, { recursive: true });
  }

  // 1. Render Document models
  console.log('--- Rendering Documents ---');
  const docsRegPath = path.join(workspaceRoot, 'registry/documents.yaml');
  if (fs.existsSync(docsRegPath)) {
    const docsRegistry = YAML.parse(fs.readFileSync(docsRegPath, 'utf8'));
    for (const doc of (docsRegistry.documents || [])) {
      const yamlPath = path.join(workspaceRoot, doc.canonical);
      const viewPath = doc.views && doc.views[0] ? path.join(workspaceRoot, doc.views[0]) : null;
      if (fs.existsSync(yamlPath)) {
        renderModelFile(yamlPath, viewPath);
      } else {
        console.warn(`  [SKIP] Not found: ${doc.canonical}`);
      }
    }
  }

  // 2. Render Record models
  console.log('\n--- Rendering Records ---');
  const recordsRegPath = path.join(workspaceRoot, 'registry/records.yaml');
  if (fs.existsSync(recordsRegPath)) {
    const recordsRegistry = YAML.parse(fs.readFileSync(recordsRegPath, 'utf8'));
    for (const rec of (recordsRegistry.records || [])) {
      // views: [] は外部ツール管理のエントリ。PKMP は view を生成しない
      if (!rec.views || rec.views.length === 0) {
        console.log(`  [SKIP] ${rec.canonical} (no views defined — external record)`);
        continue;
      }
      const yamlPath = path.join(workspaceRoot, rec.canonical);
      const viewPath = path.join(workspaceRoot, rec.views[0]);
      if (fs.existsSync(yamlPath)) {
        renderModelFile(yamlPath, viewPath, rec.state);
      } else {
        console.warn(`  [SKIP] Not found: ${rec.canonical}`);
      }
    }
  }

  // 3. Generate cross-cutting index views
  console.log('\n--- Generating Index Views ---');
  renderIndexFiles(workspaceRoot);

  console.log('\n=== Regeneration complete. ===');
}
