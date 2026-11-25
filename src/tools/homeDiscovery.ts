import type { DefinedTool } from './defineTool';

// 首页精选参考公开市场关注度与创作成果，不读取站内行为，也不生成热度分数。
const creativePaths = [
  'ai-creative/jimeng',
  'ai-creative/kling',
  'ai-creative/haimian-music',
  'image-generic/photopea'
] as const;

export const illustratedTools = {
  'image-generic/bead-pattern': 'bead',
  'ai-creative/hunyuan-3d': 'model'
} as const;

const illustratedPaths = Object.keys(illustratedTools);
const dayMs = 86_400_000;
const shanghaiOffsetMs = 8 * 60 * 60 * 1000;

const byPaths = (catalog: DefinedTool[], paths: readonly string[]) =>
  paths.flatMap((path) => {
    const tool = catalog.find((entry) => entry.path === path);
    return tool ? [tool] : [];
  });

/** 从当前公开且符合筛选的目录读出首页策展顺序，不改原目录排序。 */
export const getCreativeHighlights = (catalog: DefinedTool[]) =>
  byPaths(catalog, creativePaths);

/** 返回北京时间自然日编号。同一候选目录当天刷新结果不变。 */
export const workbenchDay = (now = Date.now()) =>
  Math.floor((now + shanghaiOffsetMs) / dayMs);

/** 下一次北京时间换日间隔，用于保持已打开的首页与刷新后相同。 */
export const untilWorkbenchDayChanges = (now = Date.now()) =>
  (workbenchDay(now) + 1) * dayMs - shanghaiOffsetMs - now;

/**
 * 每天最多选两种真实可用的工具。样品轮换居首；另一席用日期产生的稳定索引选取，
 * 这样不靠流量统计也有变化，切回同样的目录和日期时仍是同一组。
 */
export function pickWorkbenchTools(catalog: DefinedTool[], day: number) {
  const candidates = byPaths(catalog, [...illustratedPaths, ...creativePaths]);
  if (candidates.length < 2) return candidates;
  const illustrated = candidates.filter((tool) =>
    illustratedPaths.includes(tool.path)
  );
  const leads = illustrated.length ? illustrated : candidates;
  const first = leads[(day + 1) % leads.length];
  const rest = candidates.filter((tool) => tool.path !== first.path);
  const seed = Math.imul(day ^ (day >>> 11), 0x9e3779b1) >>> 0;
  return [first, rest[seed % rest.length]];
}
