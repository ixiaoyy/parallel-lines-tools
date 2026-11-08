import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import type { MediaCoreInfo } from './media-core-info';

const forbidden =
  /\/node_modules\/(?:@imgly\/|@embedpdf\/|heic2any\/|onnxruntime-web\/|tesseract\.js\/|react-pdf\/|react-filerobot-image-editor\/)/;

/** 约束实际发布模块与静态资产；以打包模块图生成归属，不把审计副本当成发行清单。 */
export function releasePolicy(
  collectedModules: Set<string>,
  emitManifest = true,
  mediaCore: MediaCoreInfo | null = null
): Plugin {
  return {
    name: 'toolbox-release-policy',
    apply: 'build',
    generateBundle() {
      // Vite 的 Worker 有独立 Rollup 图；共享集合，不能漏掉仅在 Worker 内使用的 DOCX/KaTeX 等组件。
      for (const id of this.getModuleIds())
        collectedModules.add(id.replaceAll('\\', '/'));
      const modules = [...collectedModules];
      const rejected = modules.filter(
        (id) => forbidden.test(id) || id.includes('/src/lib/ghostscript/')
      );
      if (rejected.length)
        this.error(`发布包含延期组件：\n${rejected.join('\n')}`);
      if (!emitManifest) return;
      const packages = new Map<
        string,
        { name: string; version: string; license: string; text: string }
      >();
      for (const id of modules) {
        if (!id.includes('/node_modules/')) continue;
        let directory = path.dirname(id.split('?')[0]);
        while (directory.includes('node_modules')) {
          const manifest = path.join(directory, 'package.json');
          if (fs.existsSync(manifest)) {
            const pkg = JSON.parse(fs.readFileSync(manifest, 'utf8'));
            if (pkg.name && pkg.version) {
              if (!packages.has(directory)) {
                const files = fs
                  .readdirSync(directory)
                  .filter(
                    (file) =>
                      /^(?:(license|licence|copying|notice)([-_.]|$)|third.?party.?notice)/i.test(
                        file
                      ) && fs.statSync(path.join(directory, file)).isFile()
                  );
                const provenance = JSON.parse(
                  fs.readFileSync('licenses/vendor/provenance.json', 'utf8')
                );
                const declared = provenance[`${pkg.name}@${pkg.version}`] as
                  | { file: string; source: string }[]
                  | undefined;
                const vendorLicense =
                  pkg.name === '@ffmpeg/core'
                    ? fs.readFileSync(
                        'licenses/vendor/ffmpeg-core-COPYING.GPLv2',
                        'utf8'
                      )
                    : (declared ?? [])
                        .map(
                          (notice) =>
                            `${notice.source}\n${fs.readFileSync(
                              path.join('licenses/vendor', notice.file),
                              'utf8'
                            )}`
                        )
                        .join('\n');
                packages.set(directory, {
                  name: pkg.name,
                  version: pkg.version,
                  license:
                    typeof pkg.license === 'string'
                      ? pkg.license
                      : 'UNRESOLVED',
                  text:
                    files
                      .map(
                        (file) =>
                          `${file}\n${fs.readFileSync(
                            path.join(directory, file),
                            'utf8'
                          )}`
                      )
                      .join('\n') + vendorLicense
                });
              }
              break;
            }
          }
          directory = path.dirname(directory);
        }
      }
      const inventory = [
        ...packages.values(),
        ...(mediaCore
          ? [
              {
                name: '@parallellines/media-core',
                version: mediaCore.version,
                license: mediaCore.license,
                text: mediaCore.notices
              }
            ]
          : [])
      ].sort((a, b) => a.name.localeCompare(b.name));
      // GPL/AGPL 属于可采用的开源许可；仅来源/许可文件缺失才阻断，不能把非 MIT 当作禁用理由。
      const unresolved = inventory.filter(
        (pkg) => !pkg.text || pkg.license === 'UNRESOLVED'
      );
      if (unresolved.length)
        this.error(
          `需要核实实际发行组件许可：${unresolved
            .map((p) => `${p.name}@${p.version} (${p.license})`)
            .join(', ')}`
        );
      const projectLicense = fs.readFileSync('LICENSE', 'utf8');
      this.emitFile({
        type: 'asset',
        fileName: 'THIRD_PARTY_NOTICES.txt',
        source:
          `平行线工具箱 / Derived from OmniTools\n${projectLicense}\n\n` +
          inventory
            .map(
              (pkg) =>
                `\n=== ${pkg.name}@${pkg.version} — ${pkg.license} ===\n${pkg.text}`
            )
            .join('\n') +
          '\n\nIcon artwork attribution\n' +
          fs.readFileSync('src/assets/local-icon-licenses.json', 'utf8') +
          '\n' +
          fs
            .readdirSync('licenses/icons')
            .filter(
              (file) => file.endsWith('.txt') || file === 'ATTRIBUTIONS.md'
            )
            .sort()
            .map(
              (file) =>
                `\n=== ${file} ===\n${fs.readFileSync(
                  path.join('licenses/icons', file),
                  'utf8'
                )}`
            )
            .join('\n')
      });
      this.emitFile({
        type: 'asset',
        fileName: 'release-components.json',
        source: JSON.stringify(
          inventory.map(({ name, version, license }) => ({
            name,
            version,
            license
          })),
          null,
          2
        )
      });
      if (mediaCore)
        this.emitFile({
          type: 'asset',
          fileName: 'media-core-receipt.json',
          source: mediaCore.receipt
        });
      // public 仅发布允许的语言包、背景与自有 SVG，排除 gs.js、未核实字体和旧站点品牌资产。
      const copy = (directory: string) => {
        for (const entry of fs.readdirSync(directory, {
          withFileTypes: true
        })) {
          const file = path.join(directory, entry.name);
          if (entry.isDirectory()) copy(file);
          else {
            const relative = path
              .relative('public', file)
              .replaceAll('\\', '/');
            if (
              /^locales\/[^/]+\/.*\.json$/.test(relative) ||
              [
                'toolbox.svg',
                'robots.txt',
                'assets/background.svg',
                'assets/background-dark.png'
              ].includes(relative)
            )
              this.emitFile({
                type: 'asset',
                fileName: relative,
                source: fs.readFileSync(file)
              });
          }
        }
      };
      copy('public');
    }
  };
}
