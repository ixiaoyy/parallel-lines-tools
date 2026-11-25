import type { DefinedTool } from './defineTool';
import downloads from './extensionDownloads.json';

// 默认进入已核的官方入口；仅许可明确且配套源码齐备的扩展提供本站原包。核实于 2026-11-16。
export const externalApps: DefinedTool[] = [
  {
    type: 'office',
    path: 'office/libreoffice',
    externalUrl: 'https://www.libreoffice.org/download/',
    officialWebsite: 'https://www.libreoffice.org/',
    formats: ['desktop'],
    platforms: ['windows', 'macos', 'linux'],
    pricing: 'free',
    publisher: 'The Document Foundation',
    entryAction: 'download',
    name: 'translation:externalApps.libreoffice.title',
    description: 'translation:externalApps.libreoffice.description',
    shortDescription: 'translation:externalApps.libreoffice.shortDescription',
    notice: 'translation:externalApps.libreoffice.notice',
    icon: 'fluent:document-landscape-data-24-filled',
    keywords: [
      'LibreOffice',
      'office',
      'document',
      'spreadsheet',
      'presentation',
      'Writer',
      'Calc',
      'Impress',
      'Windows',
      'macOS',
      'Linux',
      '办公',
      '文档',
      '表格',
      '演示文稿',
      '桌面应用',
      '苹果电脑'
    ],
    userTypes: ['generalUsers']
  },
  {
    type: 'image-generic',
    path: 'image-generic/sharex',
    externalUrl: 'https://getsharex.com/downloads',
    officialWebsite: 'https://getsharex.com/',
    formats: ['desktop'],
    platforms: ['windows'],
    pricing: 'free',
    publisher: 'ShareX Team',
    entryAction: 'download',
    name: 'translation:externalApps.sharex.title',
    description: 'translation:externalApps.sharex.description',
    shortDescription: 'translation:externalApps.sharex.shortDescription',
    notice: 'translation:externalApps.sharex.notice',
    icon: 'material-symbols-light:image-outline-rounded',
    keywords: [
      'ShareX',
      'screenshot',
      'screen capture',
      'screen recording',
      'annotation',
      'GIF',
      'Windows',
      '截图',
      '录屏',
      '标注',
      '图片编辑',
      '桌面应用'
    ],
    userTypes: ['generalUsers']
  },
  {
    type: 'office',
    path: 'office/singlefile',
    // 默认进入 Chrome 商店；离线入口仅取作者的 Chromium 发行包，不使用源码 ZIP。
    externalUrl:
      'https://chromewebstore.google.com/detail/singlefile/mpiodijhokgodhhofbcjdecpffjipkle',
    officialWebsite: 'https://www.getsinglefile.com/',
    formats: ['extension'],
    platforms: ['chrome', 'edge', 'firefox', 'safari'],
    pricing: 'free',
    publisher: 'Gildas Lormeau',
    entryAction: 'extension-store',
    entryBrowser: 'chrome',
    offlineInstall: {
      packageUrl: `/${downloads.singlefile.packagePath}`,
      instructionsUrl:
        'https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked',
      version: downloads.singlefile.version,
      selfHosted: {
        sourceUrl: `/${downloads.singlefile.sourcePath}`,
        licenseUrl: `/${downloads.singlefile.licensePath}`,
        noticeUrl: `/${downloads.singlefile.noticePath}`
      }
    },
    name: 'translation:externalApps.singlefile.title',
    description: 'translation:externalApps.singlefile.description',
    shortDescription: 'translation:externalApps.singlefile.shortDescription',
    notice: 'translation:externalApps.singlefile.notice',
    icon: 'fluent:document-landscape-data-24-filled',
    keywords: [
      'SingleFile',
      'save page',
      'webpage archive',
      'offline',
      'HTML',
      'browser extension',
      'Chrome',
      'Edge',
      'Firefox',
      'Safari',
      '网页保存',
      '网页归档',
      '离线阅读',
      '浏览器扩展',
      '浏览器插件',
      '火狐'
    ],
    userTypes: ['generalUsers']
  },
  {
    type: 'string',
    path: 'string/immersive-translate',
    // 仅收录浏览器扩展，官网的独立应用与其他服务不作为本站能力提供。
    externalUrl:
      'https://chromewebstore.google.com/detail/immersive-translate-ai-we/bpoadfkcbjbfhfodiogcnhhhpibjhbnh',
    officialWebsite: 'https://immersivetranslate.com/zh-Hans/',
    formats: ['extension'],
    platforms: ['chrome', 'edge', 'firefox', 'safari'],
    pricing: 'freemium',
    publisher: 'Immersive Translate / Funstory.ai Limited',
    entryAction: 'extension-store',
    entryBrowser: 'chrome',
    // 尚未核实本站镜像再分发授权；这里只链接官方发布附件，版本变更须重新核实。
    offlineInstall: {
      packageUrl:
        'https://github.com/immersive-translate/immersive-translate/releases/download/v1.35.2/chrome-immersive-translate-1.35.2.zip',
      instructionsUrl:
        'https://immersivetranslate.com/zh-Hans/docs/installation/',
      version: '1.35.2'
    },
    name: 'translation:externalApps.immersiveTranslate.title',
    description: 'translation:externalApps.immersiveTranslate.description',
    shortDescription:
      'translation:externalApps.immersiveTranslate.shortDescription',
    notice: 'translation:externalApps.immersiveTranslate.notice',
    icon: 'solar:text-bold-duotone',
    keywords: [
      'Immersive Translate',
      'translation',
      'bilingual',
      'webpage',
      'subtitles',
      'PDF',
      'EPUB',
      'browser extension',
      'Chrome',
      'Edge',
      'Firefox',
      'Safari',
      '沉浸式翻译',
      '网页翻译',
      '双语对照',
      '字幕翻译',
      '浏览器扩展',
      '浏览器插件',
      '火狐'
    ],
    userTypes: ['generalUsers']
  },
  {
    type: 'string',
    path: 'string/simple-translate',
    externalUrl:
      'https://chromewebstore.google.com/detail/simple-translate/ibplnjkanclpjokhdolnendpplpjiace',
    officialWebsite: 'https://simple-translate.sienori.com/',
    formats: ['extension'],
    platforms: ['chrome', 'edge', 'firefox'],
    pricing: 'free',
    publisher: 'Sienori',
    entryAction: 'extension-store',
    entryBrowser: 'chrome',
    name: 'translation:externalApps.simpleTranslate.title',
    description: 'translation:externalApps.simpleTranslate.description',
    shortDescription:
      'translation:externalApps.simpleTranslate.shortDescription',
    notice: 'translation:externalApps.simpleTranslate.notice',
    icon: 'solar:text-bold-duotone',
    keywords: [
      'Simple Translate',
      'Sienori',
      'selection',
      'translation',
      '划词翻译',
      '右键翻译',
      '翻译插件'
    ],
    userTypes: ['generalUsers']
  },
  {
    type: 'image-generic',
    path: 'image-generic/gofullpage',
    externalUrl:
      'https://chromewebstore.google.com/detail/gofullpage-full-page-scre/fdpohaocaechififmbbbbbknoalclacl',
    officialWebsite: 'https://gofullpage.com/',
    formats: ['extension'],
    platforms: ['chrome', 'edge', 'firefox'],
    pricing: 'freemium',
    publisher: 'Full Page LLC',
    entryAction: 'extension-store',
    entryBrowser: 'chrome',
    name: 'translation:externalApps.gofullpage.title',
    description: 'translation:externalApps.gofullpage.description',
    shortDescription: 'translation:externalApps.gofullpage.shortDescription',
    notice: 'translation:externalApps.gofullpage.notice',
    icon: 'material-symbols-light:image-outline-rounded',
    keywords: [
      'GoFullPage',
      'full page',
      'screenshot',
      '网页截图',
      '整页截图',
      '长截图'
    ],
    userTypes: ['generalUsers']
  },
  {
    type: 'office',
    path: 'office/markdown-reader',
    externalUrl:
      'https://chromewebstore.google.com/detail/markdown-reader/medapdbncneneejhbgcjceippjlfkmkg',
    officialWebsite: 'https://md-reader.github.io/install/',
    formats: ['extension'],
    platforms: ['chrome'],
    pricing: 'freemium',
    publisher: 'Bener',
    entryAction: 'extension-store',
    entryBrowser: 'chrome',
    name: 'translation:externalApps.markdownReader.title',
    description: 'translation:externalApps.markdownReader.description',
    shortDescription:
      'translation:externalApps.markdownReader.shortDescription',
    notice: 'translation:externalApps.markdownReader.notice',
    icon: 'mdi:file-document-edit',
    keywords: [
      'Markdown Reader',
      'Markdown',
      'Bener',
      'preview',
      '阅读',
      '文档预览',
      '本地文件'
    ],
    userTypes: ['generalUsers']
  },
  {
    // 代理服务独立归入网络类别，不混进普通文档工具；未核镜像许可，不提供本站安装包。
    type: 'network',
    path: 'network/ghelper',
    externalUrl:
      'https://chromewebstore.google.com/detail/ghelper/nonmafimegllfoonjgplbabhmgfanaka',
    officialWebsite: 'https://ghelper.net/',
    formats: ['extension'],
    platforms: ['chrome'],
    pricing: 'freemium',
    publisher: 'Ghelper',
    entryAction: 'extension-store',
    entryBrowser: 'chrome',
    name: 'translation:externalApps.ghelper.title',
    description: 'translation:externalApps.ghelper.description',
    shortDescription: 'translation:externalApps.ghelper.shortDescription',
    notice: 'translation:externalApps.ghelper.notice',
    icon: 'mdi:network',
    keywords: ['Ghelper', 'network', 'proxy', '网络', '浏览器代理', '上网助手'],
    userTypes: ['generalUsers']
  },
  // AI 创作条目只打开官方网页；提示词、素材和用量不经过本站。
  {
    type: 'ai-creative',
    path: 'ai-creative/jimeng',
    externalUrl: 'https://jimeng.jianying.com/ai-tool/tools',
    formats: ['online'],
    entryAction: 'online',
    name: 'translation:externalApps.jimeng.title',
    description: 'translation:externalApps.jimeng.description',
    shortDescription: 'translation:externalApps.jimeng.shortDescription',
    notice: 'translation:externalApps.jimeng.notice',
    icon: 'material-symbols-light:image-outline-rounded',
    keywords: [
      'Jimeng',
      'AI image',
      'text to image',
      'image editing',
      'AI图片',
      'AI绘图',
      'AI生图',
      '文生图',
      '局部重绘',
      '扩图',
      '角色立绘',
      '小说封面'
    ],
    userTypes: ['generalUsers']
  },
  {
    type: 'ai-creative',
    path: 'ai-creative/kling',
    externalUrl: 'https://klingai.kuaishou.com/',
    formats: ['online'],
    entryAction: 'online',
    name: 'translation:externalApps.kling.title',
    description: 'translation:externalApps.kling.description',
    shortDescription: 'translation:externalApps.kling.shortDescription',
    notice: 'translation:externalApps.kling.notice',
    icon: 'lets-icons:video-light',
    keywords: [
      'Kling',
      'AI video',
      'text to video',
      'image to video',
      'AI视频',
      '文生视频',
      '图生视频',
      '分镜',
      '短视频'
    ],
    userTypes: ['generalUsers']
  },
  {
    type: 'ai-creative',
    path: 'ai-creative/biling-novel',
    externalUrl: 'https://ibiling.cn/novel-workbench',
    formats: ['online'],
    entryAction: 'online',
    name: 'translation:externalApps.bilingNovel.title',
    description: 'translation:externalApps.bilingNovel.description',
    shortDescription: 'translation:externalApps.bilingNovel.shortDescription',
    notice: 'translation:externalApps.bilingNovel.notice',
    icon: 'mdi:file-document-edit',
    keywords: [
      'Biling',
      'AI novel',
      'fiction writing',
      'AI小说',
      'AI写作',
      '小说大纲',
      '人设',
      '续写'
    ],
    userTypes: ['generalUsers']
  },
  {
    type: 'ai-creative',
    path: 'ai-creative/haimian-music',
    externalUrl: 'https://www.haimian.com/',
    formats: ['online'],
    entryAction: 'online',
    name: 'translation:externalApps.haimianMusic.title',
    description: 'translation:externalApps.haimianMusic.description',
    shortDescription: 'translation:externalApps.haimianMusic.shortDescription',
    notice: 'translation:externalApps.haimianMusic.notice',
    icon: 'tabler:music-plus',
    keywords: [
      'Haimian',
      'AI music',
      'song generator',
      'AI音乐',
      '生成歌曲',
      '歌词',
      '配乐'
    ],
    userTypes: ['generalUsers']
  },
  {
    type: 'ai-creative',
    path: 'ai-creative/hunyuan-3d',
    externalUrl: 'https://3d.hunyuan.tencent.com/',
    formats: ['online'],
    entryAction: 'online',
    name: 'translation:externalApps.hunyuan3d.title',
    description: 'translation:externalApps.hunyuan3d.description',
    shortDescription: 'translation:externalApps.hunyuan3d.shortDescription',
    notice: 'translation:externalApps.hunyuan3d.notice',
    icon: 'ph:sphere-duotone',
    keywords: [
      'Tencent',
      'Hunyuan',
      'text to 3D',
      'image to 3D',
      '文生3D',
      '图生3D',
      '三维建模',
      '游戏道具'
    ],
    userTypes: ['generalUsers']
  },
  {
    type: 'ai-creative',
    path: 'ai-creative/adobe-enhance-speech',
    externalUrl: 'https://podcast.adobe.com/en/enhance',
    formats: ['online'],
    entryAction: 'online',
    name: 'translation:externalApps.adobeEnhanceSpeech.title',
    description: 'translation:externalApps.adobeEnhanceSpeech.description',
    shortDescription:
      'translation:externalApps.adobeEnhanceSpeech.shortDescription',
    notice: 'translation:externalApps.adobeEnhanceSpeech.notice',
    icon: 'ic:twotone-audiotrack',
    keywords: [
      'Adobe Podcast',
      'Enhance Speech',
      'audio denoise',
      'speech enhancement',
      '录音降噪',
      '人声增强',
      '回声',
      '播客'
    ],
    userTypes: ['generalUsers']
  },
  // 日常工具只链接官方编辑器或下载页，不嵌入服务，也不分发安装包。
  {
    type: 'office',
    path: 'office/excalidraw',
    externalUrl: 'https://excalidraw.com/',
    formats: ['online'],
    entryAction: 'online',
    name: 'translation:externalApps.excalidraw.title',
    description: 'translation:externalApps.excalidraw.description',
    shortDescription: 'translation:externalApps.excalidraw.shortDescription',
    notice: 'translation:externalApps.excalidraw.notice',
    icon: 'ph:compass-tool-thin',
    keywords: [
      'Excalidraw',
      'whiteboard',
      'flowchart',
      'diagram',
      '流程图',
      '白板',
      '手绘',
      '草图'
    ],
    userTypes: ['generalUsers', 'developers']
  },
  {
    type: 'image-generic',
    path: 'image-generic/photopea',
    externalUrl: 'https://www.photopea.com/',
    formats: ['online'],
    entryAction: 'online',
    name: 'translation:externalApps.photopea.title',
    description: 'translation:externalApps.photopea.description',
    shortDescription: 'translation:externalApps.photopea.shortDescription',
    notice: 'translation:externalApps.photopea.notice',
    icon: 'mdi:image-edit',
    keywords: [
      'Photopea',
      'PSD editor',
      'layer mask',
      'image editor',
      '在线修图',
      '图层',
      '蒙版',
      '合成'
    ],
    userTypes: ['generalUsers']
  },
  {
    type: 'network',
    path: 'network/localsend',
    externalUrl: 'https://localsend.org/download',
    formats: ['desktop'],
    platforms: ['windows', 'macos', 'linux'],
    pricing: 'free',
    entryAction: 'download',
    name: 'translation:externalApps.localsend.title',
    description: 'translation:externalApps.localsend.description',
    shortDescription: 'translation:externalApps.localsend.shortDescription',
    notice: 'translation:externalApps.localsend.notice',
    icon: 'mdi:network',
    keywords: [
      'LocalSend',
      'local network',
      'file transfer',
      'Android',
      'iOS',
      '局域网',
      '文件互传',
      '手机传电脑'
    ],
    userTypes: ['generalUsers']
  }
];
