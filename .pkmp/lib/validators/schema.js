import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { Validator } from 'jsonschema';

const v = new Validator();

/**
 * YAMLファイルをスキーマファイルで検証する
 * @param {string} yamlFilePath 検証対象のYAMLモデルファイルの絶対パス
 * @param {string} schemaFilePath スキーマファイルの絶対パス
 * @returns {object} { valid: boolean, errors: Array }
 */
export function validateFileWithSchema(yamlFilePath, schemaFilePath) {
  if (!fs.existsSync(yamlFilePath)) {
    return { valid: false, errors: [`File not found: ${yamlFilePath}`] };
  }
  if (!fs.existsSync(schemaFilePath)) {
    return { valid: false, errors: [`Schema file not found: ${schemaFilePath}`] };
  }

  try {
    const model = YAML.parse(fs.readFileSync(yamlFilePath, 'utf8'));
    const schema = YAML.parse(fs.readFileSync(schemaFilePath, 'utf8'));

    const result = v.validate(model, schema);
    
    if (result.valid) {
      return { valid: true, errors: [] };
    } else {
      return {
        valid: false,
        errors: result.errors.map(err => `${err.property}: ${err.message}`)
      };
    }
  } catch (error) {
    return { valid: false, errors: [`Parsing error: ${error.message}`] };
  }
}

/**
 * プロジェクト内のすべてのスキーマ定義を元に一括でスキーマ検証を実行する
 * @param {string} workspaceRoot
 * @returns {Array} 検出されたエラーオブジェクトのリスト
 */
export function validateAllSchemas(workspaceRoot) {
  const errors = [];
  
  // 1. documents.yaml のドキュメントモデルを検証
  const docsRegPath = path.join(workspaceRoot, 'registry/documents.yaml');
  if (fs.existsSync(docsRegPath)) {
    const docsRegistry = YAML.parse(fs.readFileSync(docsRegPath, 'utf8'));
    (docsRegistry.documents || []).forEach(doc => {
      const yamlPath = path.join(workspaceRoot, doc.canonical);
      const schemaPath = path.join(workspaceRoot, doc.schema);
      const res = validateFileWithSchema(yamlPath, schemaPath);
      if (!res.valid) {
        errors.push({ file: doc.canonical, errors: res.errors });
      }
    });
  }

  // 2. records.yaml のレコードモデルを検証
  const recordsRegPath = path.join(workspaceRoot, 'registry/records.yaml');
  if (fs.existsSync(recordsRegPath)) {
    const recordsRegistry = YAML.parse(fs.readFileSync(recordsRegPath, 'utf8'));
    (recordsRegistry.records || []).forEach(rec => {
      // external/ スキーマ（UDR等の外部ツール）はバリデーションをスキップ
      if (rec.schema && rec.schema.startsWith('external/')) {
        return;
      }
      const yamlPath = path.join(workspaceRoot, rec.canonical);
      const schemaPath = path.join(workspaceRoot, rec.schema);
      const res = validateFileWithSchema(yamlPath, schemaPath);
      if (!res.valid) {
        errors.push({ file: rec.canonical, errors: res.errors });
      }
    });
  }

  // 3. レジストリファイル自体のスキーマ検証
  const registryFiles = [
    { file: 'registry/repository.yaml', schema: '.pkmp/schemas/registry/repository.schema.yaml' },
    { file: 'registry/documents.yaml', schema: '.pkmp/schemas/registry/documents.schema.yaml' },
    { file: 'registry/records.yaml', schema: '.pkmp/schemas/registry/records.schema.yaml' },
    { file: 'registry/capabilities.yaml', schema: '.pkmp/schemas/registry/capabilities.schema.yaml' },
    { file: 'registry/schemas.yaml', schema: '.pkmp/schemas/registry/schemas.schema.yaml' },
    { file: 'registry/lifecycles.yaml', schema: '.pkmp/schemas/registry/lifecycles.schema.yaml' },
    { file: 'registry/workflows.yaml', schema: '.pkmp/schemas/registry/workflows.schema.yaml' }
  ];
  
  registryFiles.forEach(reg => {
    const yamlPath = path.join(workspaceRoot, reg.file);
    const schemaPath = path.join(workspaceRoot, reg.schema);
    const res = validateFileWithSchema(yamlPath, schemaPath);
    if (!res.valid) {
      errors.push({ file: reg.file, errors: res.errors });
    }
  });

  return errors;
}
