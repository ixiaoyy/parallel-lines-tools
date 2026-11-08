import { createRoot } from 'react-dom/client';
import 'tailwindcss/tailwind.css';
import App from 'components/App';
import { addCollection } from '@iconify/react/offline';
import type { IconifyJSON } from '@iconify/types';
import localIcons from './assets/local-icons.json';

// 在首屏渲染前注册随站点打包的图标；离线组件从不请求 Iconify 的公共 API。
for (const collection of localIcons) {
  const icons: IconifyJSON['icons'] = {};
  const aliases: NonNullable<IconifyJSON['aliases']> = {};
  for (const [name, icon] of Object.entries(collection.icons))
    if (icon) icons[name] = icon;
  for (const [name, alias] of Object.entries(collection.aliases))
    if (alias) aliases[name] = alias;
  addCollection({
    prefix: collection.prefix,
    width: collection.width,
    height: collection.height,
    icons,
    aliases
  });
}

const container = document.getElementById('root') as HTMLDivElement;
const root = createRoot(container);

root.render(<App />);
