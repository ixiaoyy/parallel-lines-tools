import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export interface MediaCoreInfo {
  directory: string;
  version: string;
  license: string;
  source: { file: string; sha256: string; bytes: number; url: string };
  notices: string;
  receipt: string;
  validated: boolean;
}

/** 读取自建媒体核心回执并核对实际二进制；未指定目录时保留原版本的本地开发入口。 */
export function readMediaCoreInfo(directory?: string): MediaCoreInfo | null {
  if (!directory) return null;
  const resolved = path.resolve(directory);
  const receipt = fs.readFileSync(
    path.join(resolved, 'core-receipt.json'),
    'utf8'
  );
  const data = JSON.parse(receipt);
  if (
    typeof data.version !== 'string' ||
    data.license !== 'GPL-2.0-or-later' ||
    !data.source ||
    !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/releases\/download\//.test(
      data.source.url
    ) ||
    !/^[a-f0-9]{64}$/.test(data.source.sha256) ||
    !Number.isSafeInteger(data.source.bytes) ||
    data.source.bytes <= 0
  )
    throw new Error('Invalid media core source receipt');
  for (const [key, file] of [
    ['js', 'ffmpeg-core.js'],
    ['wasm', 'ffmpeg-core.wasm']
  ]) {
    const expected = data.binaries?.[key];
    if (
      !expected ||
      expected.file !== file ||
      !/^[a-f0-9]{64}$/.test(expected.sha256)
    )
      throw new Error(`Invalid media core receipt: ${file}`);
    const bytes = fs.readFileSync(path.join(resolved, file));
    if (
      bytes.length !== expected.bytes ||
      createHash('sha256').update(bytes).digest('hex') !== expected.sha256
    )
      throw new Error(
        `Media core does not match its source/build receipt: ${file}`
      );
  }
  const notices = fs.readFileSync(
    path.join(resolved, 'media-core-NOTICES.txt'),
    'utf8'
  );
  if (!notices.trim()) throw new Error('Missing media core license notices');
  return {
    directory: resolved,
    version: data.version,
    license: data.license,
    source: data.source,
    notices,
    receipt,
    validated: data.validation?.status === 'passed'
  };
}
