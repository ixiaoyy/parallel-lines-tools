// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import downloads from '../src/tools/extensionDownloads.json';
import { getExtensionDownloadFiles } from './extension-downloads';

const materialFields = [
  'packagePath',
  'sourcePath',
  'licensePath',
  'noticePath'
] as const;
type MaterialField = (typeof materialFields)[number];
const declaration = downloads.singlefile;
const temporaryParent = path.resolve(os.tmpdir());
const temporaryPrefix = 'toolbox-extension-downloads-';
const temporaryDirectories: string[] = [];

/** 仅构造四份小文本夹具用于发布读取合同；这些文件不是 ZIP、源码或许可验收材料。 */
function fixture() {
  expect(Object.keys(downloads)).toEqual(['singlefile']);
  const root = fs.mkdtempSync(path.join(temporaryParent, temporaryPrefix));
  temporaryDirectories.push(root);
  const files = new Map<string, Buffer>();
  for (const field of materialFields) {
    const name = declaration[field];
    const target = path.join(root, name);
    const bytes = Buffer.from(
      `文本夹具 ${field}\nnot a production artifact\n`,
      'utf8'
    );
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
    files.set(name, bytes);
  }
  return { root, files };
}

const materialFile = (root: string, field: MaterialField) =>
  path.join(root, declaration[field]);

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    // 递归清理前核对绝对父目录与专属前缀，只删除本测试排他创建的系统临时目录。
    const absolute = path.resolve(directory);
    if (
      path.dirname(absolute) !== temporaryParent ||
      !path.basename(absolute).startsWith(temporaryPrefix)
    )
      throw new Error('Unsafe extension-download fixture cleanup path');
    fs.rmSync(absolute, { recursive: true, force: true });
  }
});

describe('declared extension download release files', () => {
  it('returns exactly the four declared files without changing their bytes', () => {
    const { root, files } = fixture();
    const result = getExtensionDownloadFiles(root);
    expect(result).toHaveLength(4);
    expect(result.map((entry) => entry.fileName).sort()).toEqual(
      [...files.keys()].sort()
    );
    for (const entry of result) {
      expect(Buffer.isBuffer(entry.source)).toBe(true);
      expect(entry.source).toEqual(files.get(entry.fileName));
    }
  });

  it.each(['sourcePath', 'licensePath'] as const)(
    'fails clearly when the corresponding %s material is missing',
    (field) => {
      const { root } = fixture();
      const target = materialFile(root, field);
      fs.unlinkSync(target);
      expect(() => getExtensionDownloadFiles(root)).toThrow(
        path.basename(target)
      );
    }
  );

  it.each(materialFields)('rejects an empty declared %s file', (field) => {
    const { root } = fixture();
    const target = materialFile(root, field);
    fs.writeFileSync(target, '');
    expect(() => getExtensionDownloadFiles(root)).toThrow(
      path.basename(target)
    );
  });

  it('does not publish undeclared files beside an official package', () => {
    const { root, files } = fixture();
    const extra = path.join(
      path.dirname(materialFile(root, 'packagePath')),
      'undeclared-extra.zip'
    );
    fs.writeFileSync(extra, 'not a declared release asset');
    const result = getExtensionDownloadFiles(root);
    expect(result.map((entry) => entry.fileName).sort()).toEqual(
      [...files.keys()].sort()
    );
    expect(
      result.some((entry) => entry.fileName.endsWith('undeclared-extra.zip'))
    ).toBe(false);
  });

  it('fails clearly when a declared material is a directory rather than a regular file', () => {
    const { root } = fixture();
    const target = materialFile(root, 'packagePath');
    fs.unlinkSync(target);
    fs.mkdirSync(target);
    expect(() => getExtensionDownloadFiles(root)).toThrow(
      path.basename(target)
    );
  });
});
