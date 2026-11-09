declare const __APP_VERSION__: string;
declare const __COMMIT_HASH__: string;
declare const __MEDIA_CORE_SOURCE_URL__: string | null;

// 仅 translation 全局中文 UI；其他命名空间不作为首屏资源打包。
declare const __DEFAULT_ZH_RESOURCES__: Pick<
  import('i18next').ResourceLanguage,
  'translation'
>;
