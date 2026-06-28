import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

/**
 * registry/ の定義とファイルシステムの実態が一致しているかを検証する
 * @param {string} workspaceRoot
 * @returns {Array} 検出されたエラーオブジェクトのリスト
 */
export function validateRegistry(workspaceRoot) {
  const errors = [];

  // views は生成物（再生成可能）のため canonical のみチェックする
  // capabilities は設定エントリのためファイルチェック不要
  const registryFiles = [
    { registry: 'registry/documents.yaml', key: 'documents', fields: ['canonical'] },
    { registry: 'registry/records.yaml', key: 'records', fields: ['canonical'] },
    { registry: 'registry/schemas.yaml', key: 'schemas', fields: ['path'] },
  ];

  for (const { registry, key, fields } of registryFiles) {
    const regPath = path.join(workspaceRoot, registry);
    if (!fs.existsSync(regPath)) {
      errors.push({ file: registry, errors: [`Registry file not found: ${registry}`] });
      continue;
    }

    let data;
    try {
      data = YAML.parse(fs.readFileSync(regPath, 'utf8'));
    } catch (e) {
      errors.push({ file: registry, errors: [`YAML parse error: ${e.message}`] });
      continue;
    }

    const entries = data[key] || [];
    for (const entry of entries) {
      const entryId = entry.id || '(unknown)';

      for (const field of fields) {
        const value = entry[field];
        if (!value) continue;

        const paths = Array.isArray(value) ? value : [value];
        for (const relPath of paths) {
          const absPath = path.join(workspaceRoot, relPath);
          if (!fs.existsSync(absPath)) {
            errors.push({
              file: registry,
              errors: [`[${entryId}] Referenced file not found: ${relPath}`],
            });
          }
        }
      }
    }
  }

  // 逆チェック: docs/ にある .yaml ファイルがすべて registry/documents.yaml に登録されているか
  errors.push(...checkUnregisteredFiles(workspaceRoot, 'docs', 'registry/documents.yaml', 'documents'));
  // 逆チェック: records/ にある .yaml ファイルがすべて registry/records.yaml に登録されているか
  errors.push(...checkUnregisteredFiles(workspaceRoot, 'records', 'registry/records.yaml', 'records'));

  // Stale-reference チェック: docs/ の content フィールドが Superseded レコードを参照していないか（警告のみ）
  errors.push(...checkStaleReferences(workspaceRoot));

  // ガバナンスチェック: Human のみが行える状態遷移が AI によって実行されていないか（警告のみ）
  errors.push(...checkGovernanceViolations(workspaceRoot));

  return errors;
}

function checkGovernanceViolations(workspaceRoot) {
  const warnings = [];

  // Human のみが設定できる状態（ドキュメントライフサイクル）
  const humanOnlyStates = new Set(['Published', 'Approved', 'Archived']);

  const docsRegPath = path.join(workspaceRoot, 'registry/documents.yaml');
  if (!fs.existsSync(docsRegPath)) return warnings;

  let docsData;
  try {
    docsData = YAML.parse(fs.readFileSync(docsRegPath, 'utf8'));
  } catch {
    return warnings;
  }

  for (const doc of (docsData.documents || [])) {
    if (!humanOnlyStates.has(doc.state)) continue;

    const yamlPath = path.join(workspaceRoot, doc.canonical);
    if (!fs.existsSync(yamlPath)) continue;

    let model;
    try {
      model = YAML.parse(fs.readFileSync(yamlPath, 'utf8'));
    } catch {
      continue;
    }

    // reviewed_at または published_at がない場合は人間の承認証跡がない
    const prov = model.provenance || {};
    if (!prov.reviewed_at && !prov.published_at) {
      warnings.push({
        file: doc.canonical,
        errors: [
          `[WARN] state is "${doc.state}" (Human-only) but provenance.reviewed_at/published_at is missing.`,
        ],
      });
    }
  }

  return warnings;
}

function checkStaleReferences(workspaceRoot) {
  const warnings = [];

  const recordsRegPath = path.join(workspaceRoot, 'registry/records.yaml');
  const docsRegPath = path.join(workspaceRoot, 'registry/documents.yaml');
  if (!fs.existsSync(recordsRegPath) || !fs.existsSync(docsRegPath)) return warnings;

  let recordsData, docsData;
  try {
    recordsData = YAML.parse(fs.readFileSync(recordsRegPath, 'utf8'));
    docsData = YAML.parse(fs.readFileSync(docsRegPath, 'utf8'));
  } catch {
    return warnings;
  }

  // Superseded レコードの id セットを作成
  const supersededIds = new Set(
    (recordsData.records || [])
      .filter(r => r.state === 'Superseded')
      .map(r => r.id)
  );
  if (supersededIds.size === 0) return warnings;

  // 各ドキュメントの content をスキャンして Superseded id の参照を検出
  for (const doc of (docsData.documents || [])) {
    const yamlPath = path.join(workspaceRoot, doc.canonical);
    if (!fs.existsSync(yamlPath)) continue;

    let model;
    try {
      model = YAML.parse(fs.readFileSync(yamlPath, 'utf8'));
    } catch {
      continue;
    }

    const content = JSON.stringify(model);
    for (const id of supersededIds) {
      if (content.includes(id)) {
        warnings.push({
          file: doc.canonical,
          errors: [`[WARN] references ${id} which is Superseded. Consider updating.`],
        });
      }
    }
  }

  return warnings;
}

function checkUnregisteredFiles(workspaceRoot, dir, registryFile, key) {
  const errors = [];
  const dirPath = path.join(workspaceRoot, dir);
  if (!fs.existsSync(dirPath)) return errors;

  const regPath = path.join(workspaceRoot, registryFile);
  if (!fs.existsSync(regPath)) return errors;

  let data;
  try {
    data = YAML.parse(fs.readFileSync(regPath, 'utf8'));
  } catch {
    return errors;
  }

  const registeredCanonicals = new Set(
    (data[key] || []).map(e => e.canonical)
  );

  const yamlFiles = fs.readdirSync(dirPath)
    .filter(f => f.endsWith('.yaml'))
    .map(f => path.join(dir, f));

  for (const relPath of yamlFiles) {
    if (!registeredCanonicals.has(relPath)) {
      errors.push({
        file: registryFile,
        errors: [`File exists on disk but not registered in registry: ${relPath}`],
      });
    }
  }

  return errors;
}
