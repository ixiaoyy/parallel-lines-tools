/** 显式开启后在首屏空闲加载第一方采集器；不触碰工具输入、文件或结果内容。 */
export function installTrafficAnalytics(): void {
  if (import.meta.env.VITE_TRAFFIC_ANALYTICS_ENABLED !== 'true') return;
  const load = () => {
    const script = document.createElement('script');
    script.src = 'https://pingxingxian.space/traffic-collector.v1.js';
    script.dataset.site = 'tools';
    script.async = true;
    script.referrerPolicy = 'no-referrer';
    document.head.append(script);
  };
  const schedule = () => {
    if (typeof window.requestIdleCallback === 'function')
      window.requestIdleCallback(load, { timeout: 2000 });
    else window.setTimeout(load, 1000);
  };
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
}
