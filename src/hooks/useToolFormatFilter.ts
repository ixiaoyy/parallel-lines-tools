import { useSearchParams } from 'react-router-dom';
import type { ToolFormat } from '@tools/defineTool';

export type ToolFormatFilterValue = ToolFormat | 'all';

/** 将形式筛选放在 URL 中，供首页、分类与搜索共享；不覆盖旧收藏或人群偏好。 */
export function useToolFormatFilter() {
  const [params, setParams] = useSearchParams();
  const value = params.get('format');
  const format: ToolFormatFilterValue =
    value === 'online' || value === 'desktop' || value === 'extension'
      ? value
      : 'all';

  const setFormat = (next: ToolFormatFilterValue) => {
    const updated = new URLSearchParams(params);
    if (next === 'all') updated.delete('format');
    else updated.set('format', next);
    setParams(updated, { replace: true });
  };
  return { format, setFormat };
}
