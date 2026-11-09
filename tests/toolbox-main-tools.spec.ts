import { test, expect, errors, type BrowserContext, type Locator, type Page } from '@playwright/test';
import zh from '../public/locales/zh/translation.json';
import en from '../public/locales/en/translation.json';

const MAIN = 'https://pingxingxian.space';
const DIRECTORY = MAIN + '/tools';
const toolboxOrigin = 'http://127.0.0.1:5180';
const cases = [
  { id: 'office/excel-formulas', url: MAIN + '/tools/excel-formulas', category: 'office', zhQuery: '公式', enQuery: 'Excel', name: /Excel/i },
  { id: 'image-generic/bead-pattern', url: MAIN + '/tools/bead-pattern', category: 'image-generic', zhQuery: '拼豆', enQuery: 'bead', name: /拼豆|bead/i }
] as const;
const allowedMainURLs = new Set<string>([DIRECTORY, ...cases.map((tool) => tool.url)]);
interface NavigationState { mainRequests: { url: string; method: string }[]; blockedRequests: string[]; pageErrors: string[] }
const states = new WeakMap<BrowserContext, NavigationState>();

test.use({ viewport: { width: 1280, height: 900 } });

test.beforeEach(async ({ context, page }) => {
  const state: NavigationState = { mainRequests: [], blockedRequests: [], pageErrors: [] };
  states.set(context, state);
  page.on('pageerror', (error) => state.pageErrors.push(error.message));
  await page.addInitScript((origin) => {
    if (location.origin === origin) localStorage.setItem('lang', 'zh');
  }, toolboxOrigin);
  // 主站请求全部使用安全替身；错误目的地也不放行，不能让回归测试误处理真实文件/会话。
  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!['http:', 'https:'].includes(url.protocol) || url.origin === toolboxOrigin) {
      await route.continue();
      return;
    }
    if (url.origin === MAIN) {
      if (url.pathname === '/favicon.ico' && request.method() === 'GET') {
        await route.fulfill({ status: 204, body: '' });
        return;
      }
      state.mainRequests.push({ url: request.url(), method: request.method() });
      if (!allowedMainURLs.has(request.url()) || !['GET', 'HEAD'].includes(request.method())) state.blockedRequests.push(request.method() + ' ' + request.url());
      await route.fulfill({ status: ['GET', 'HEAD'].includes(request.method()) ? 200 : 405, contentType: 'text/html; charset=utf-8', headers: { 'Cache-Control': 'no-store' }, body: '<!doctype html><html lang="zh-CN"><title>主站入口安全替身</title><h1>主站入口安全替身</h1></html>' });
      return;
    }
    state.blockedRequests.push(request.method() + ' ' + url.origin + url.pathname);
    await route.abort('blockedbyclient');
  });
});

test.afterEach(async ({ context }) => {
  const state = states.get(context);
  expect(state?.blockedRequests).toEqual([]);
  expect(state?.pageErrors).toEqual([]);
  // 显式打开的替身标签都由测试关闭；注册外链不能在渲染时额外自行弹窗。
  expect(context.pages()).toHaveLength(1);
  expect(state?.mainRequests.every((request) => ['GET', 'HEAD'].includes(request.method) && allowedMainURLs.has(request.url))).toBe(true);
});

/** 在现有语言选择器切换，不能只预装英文缓存而漏测实际切换后的搜索计算。 */
async function english(page: Page): Promise<void> {
  await page.getByRole('combobox', { name: zh.navbar.language, exact: true }).click();
  await page.getByRole('option', { name: 'English', exact: true }).click();
  await expect(page.getByRole('combobox', { name: en.hero.search.placeholder, exact: true })).toBeVisible();
}

/** 对同一私有浏览器上下文观察真实新标签；只断言安全替身 URL，不冒充主站 Vue 工具验收。 */
async function newTab(context: BrowserContext, source: Page, control: Locator, expectedURL: string): Promise<void> {
  const before = source.url();
  const count = context.pages().length;
  const pending = context.waitForEvent('page', { timeout: 10000 });
  await control.click();
  const popup = await pending;
  await expect(popup).toHaveURL(expectedURL);
  await expect(popup.getByRole('heading', { name: '主站入口安全替身', exact: true })).toBeVisible();
  await expect(source).toHaveURL(before);
  expect(await popup.evaluate(() => window.opener === null)).toBe(true);
  expect(context.pages()).toHaveLength(count + 1);
  await popup.close();
  await source.bringToFront();
}

/** 负向交互用有界事件观察，不用只检查按钮属性代替没有触发 popup 的事实。 */
async function noNewTab(context: BrowserContext, action: () => Promise<unknown>): Promise<void> {
  const unexpected = context.waitForEvent('page', { timeout: 500 }).then((page) => page, (error: unknown) => {
    if (error instanceof errors.TimeoutError) return null;
    throw error;
  });
  await action();
  expect(await unexpected).toBeNull();
}

/** 收藏只沿用原 bookmarkedTools 的稳定路径，不根据显示名称或用户输入生成记录。 */
async function bookmarks(page: Page): Promise<string[]> {
  return page.evaluate(() => (localStorage.getItem('bookmarkedTools') ?? '').split(',').filter(Boolean).sort());
}

for (const language of ['zh', 'en'] as const) {
  test(`${language} 搜索旧 Excel/拼豆，点击仍在主站原址新标签打开`, async ({ page, context }) => {
    const locale = language === 'zh' ? zh : en;
    await page.goto('/');
    if (language === 'en') await english(page);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(language === 'zh' ? '平行线工具箱' : 'Parallel Lines Toolbox');
    const search = page.getByRole('combobox', { name: locale.hero.search.placeholder, exact: true });
    for (const tool of cases) {
      await search.fill(language === 'zh' ? tool.zhQuery : tool.enQuery);
      const option = page.getByRole('option').filter({ hasText: tool.name }).first();
      await expect(option).toBeVisible();
      await newTab(context, page, option, tool.url);
    }
  });
}

test('拼豆唯一搜索结果的 Enter 选择也新开标签，不走工具箱内部路由', async ({ page, context }) => {
  await page.goto('/');
  const search = page.getByRole('combobox', { name: zh.hero.search.placeholder, exact: true });
  await search.fill('拼豆');
  await expect(page.getByRole('option')).toHaveCount(1);
  const before = page.url();
  const popupEvent = context.waitForEvent('page', { timeout: 10000 });
  await search.press('Enter');
  const popup = await popupEvent;
  await expect(popup).toHaveURL(cases[1].url);
  await expect(popup.getByRole('heading', { name: '主站入口安全替身', exact: true })).toBeVisible();
  await expect(page).toHaveURL(before);
  await popup.close();
});

test('新办公分类与原图片分类真正收录外链，筛选后卡片仍新标签打开', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: '办公工具', exact: true })).toHaveAttribute('href', '/categories/office');
  for (const tool of cases) {
    await page.goto('/categories/' + tool.category);
    const filter = page.getByPlaceholder(zh.hero.search.placeholder, { exact: true }).last();
    await filter.fill(tool.zhQuery);
    const links = page.locator(`a[href="${tool.url}"]`);
    await expect(links.last()).toBeVisible();
    const matched = await links.count();
    // Hero 快捷入口可能同 URL，使用分类独立筛选前后的差异确认不是只看到了全局快捷入口。
    await filter.fill('NO_CATEGORY_TOOL_MATCH_20261109');
    await expect(page.getByText(zh.toolsByCategory.noResultsTitle, { exact: true })).toBeVisible();
    await expect.poll(() => links.count()).toBeLessThan(matched);
    await filter.fill(tool.zhQuery);
    await expect(links).toHaveCount(matched);
    await expect(links.last()).toHaveAttribute('target', '_blank');
    await newTab(context, page, links.last(), tool.url);
  }
});

test('收藏按钮不弹窗，只存外链工具 ID，刷新后收藏入口仍精确新开原址', async ({ page, context }) => {
  await page.goto('/');
  const search = page.getByRole('combobox', { name: zh.hero.search.placeholder, exact: true });
  const inputSentinel = 'PRIVATE_SEARCH_INPUT_NOT_TO_BE_STORED_20261109';
  await search.fill(inputSentinel);
  await search.press('Escape');
  const before = page.url();
  for (const tool of cases) {
    await search.fill(tool.zhQuery);
    const option = page.getByRole('option').filter({ hasText: tool.name }).first();
    await noNewTab(context, () => option.getByRole('button', { name: zh.toolHeader.bookmark, exact: true }).click());
    await expect.poll(() => bookmarks(page)).toContain(tool.id);
    await expect(page).toHaveURL(before);
  }
  expect(await bookmarks(page)).toEqual(cases.map((tool) => tool.id).sort());
  const stored = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((key) => [key, localStorage.getItem(key)])));
  expect(JSON.stringify(stored)).not.toContain(inputSentinel);
  expect(stored.bookmarkedTools).not.toContain('https://');
  await page.reload();
  expect(await bookmarks(page)).toEqual(cases.map((tool) => tool.id).sort());
  for (const tool of cases) {
    const remove = page.getByRole('button', { name: tool.id.startsWith('office/') ? /^取消收藏：.*Excel/i : /^取消收藏：.*拼豆/ });
    const link = remove.locator('..').getByRole('link', { name: tool.name });
    await expect(link).toHaveAttribute('href', tool.url);
    await expect(link).toHaveAttribute('target', '_blank');
    await newTab(context, page, link, tool.url);
  }
  const removeBead = page.getByRole('button', { name: /^取消收藏：.*拼豆/ });
  await noNewTab(context, () => removeBead.click());
  await expect.poll(() => bookmarks(page)).toEqual([cases[0].id]);
});

test('旧内置 Markdown 与图片压缩入口仍在当前标签，不被外链规则统一改开新页', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('combobox', { name: zh.hero.search.placeholder, exact: true }).fill('Markdown');
  await noNewTab(context, () => page.getByRole('option').filter({ hasText: /Markdown/ }).first().click());
  await expect(page).toHaveURL(toolboxOrigin + '/converters/markdown-to-docx');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Markdown');
  await page.goto('/categories/image-generic');
  const image = page.locator('a[href="/image-generic/compress"]').last();
  await expect(image).not.toHaveAttribute('target', '_blank');
  await noNewTab(context, () => image.click());
  await expect(page).toHaveURL(toolboxOrigin + '/image-generic/compress');
});

test('桌面顶栏保留工具收录页文字与 URL，页脚平行线也明确新开标签', async ({ page, context }) => {
  await page.goto('/');
  for (const language of ['zh', 'en'] as const) {
    if (language === 'en') await english(page);
    const label = language === 'zh' ? '工具收录页' : en.navbar.mainTools;
    const header = page.getByRole('link', { name: label, exact: true });
    await expect(header).toHaveAttribute('href', DIRECTORY);
    await expect(header).toHaveAttribute('target', '_blank');
    await newTab(context, page, header, DIRECTORY);
    const footer = page.getByRole('contentinfo').getByRole('link', { name: '平行线', exact: true });
    await expect(footer).toHaveAttribute('href', DIRECTORY);
    await expect(footer).toHaveAttribute('target', '_blank');
    await newTab(context, page, footer, DIRECTORY);
  }
});

test('手机 Drawer 保留工具收录页入口与名称，新标签打开不替换工具箱', async ({ page, context }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByRole('button', { name: zh.navbar.menu, exact: true }).click();
  const directory = page.getByRole('link', { name: '工具收录页', exact: true });
  await expect(directory).toBeVisible();
  await expect(directory).toHaveAttribute('href', DIRECTORY);
  await expect(directory).toHaveAttribute('target', '_blank');
  await newTab(context, page, directory, DIRECTORY);
  await page.keyboard.press('Escape');
  const footer = page.getByRole('contentinfo').getByRole('link', { name: '平行线', exact: true });
  await expect(footer).toHaveAttribute('target', '_blank');
  await newTab(context, page, footer, DIRECTORY);
});
