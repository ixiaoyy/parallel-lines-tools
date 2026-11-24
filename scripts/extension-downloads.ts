import fs from 'node:fs';
import path from 'node:path';
import downloads from '../src/tools/extensionDownloads.json';

/** 只读取已声明的扩展原包及配套源码/许可；缺项时中止构建，不发布孤立安装包。 */
export function getExtensionDownloadFiles(
  publicDirectory: string
): { fileName: string; source: Buffer }[] {
  return Object.values(downloads).flatMap((entry) =>
    [
      entry.packagePath,
      entry.sourcePath,
      entry.licensePath,
      entry.noticePath
    ].map((fileName) => {
      const file = path.join(publicDirectory, fileName);
      if (!fs.existsSync(file))
        throw new Error(`扩展下载材料缺失：${fileName}`);
      const stat = fs.lstatSync(file);
      if (!stat.isFile() || stat.size === 0)
        throw new Error(`扩展下载材料不是非空普通文件：${fileName}`);
      return { fileName, source: fs.readFileSync(file) };
    })
  );
}
