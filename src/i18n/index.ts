import i18n, { Namespace, ParseKeys } from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import {
  AnyMessageParams,
  defaultLocale,
  Message,
  setLocale,
  ValidationError
} from 'yup';

export const validNamespaces = [
  'string',
  'number',
  'video',
  'list',
  'json',
  'time',
  'csv',
  'pdf',
  'audio',
  'xml',
  'translation',
  'image',
  'converters'
] as const satisfies readonly Namespace[];

export type I18nNamespaces = (typeof validNamespaces)[number];
export type FullI18nKey = {
  [K in I18nNamespaces]: `${K}:${ParseKeys<K>}`;
}[I18nNamespaces];

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // 中英全局 UI 随首屏提供，避免首次按浏览器语言进入时先出现中文或空白导航。
    resources: { zh: __DEFAULT_ZH_RESOURCES__, en: __DEFAULT_EN_RESOURCES__ },
    // 工具词条及其他语言继续使用原 HTTP backend，保持唯一翻译来源。
    partialBundledLanguages: true,
    supportedLngs: [
      'en',
      'de',
      'es',
      'fr',
      'pt',
      'ja',
      'hi',
      'nl',
      'ru',
      'uk',
      'zh'
    ],
    fallbackLng: 'zh',
    load: 'languageOnly',
    interpolation: {
      escapeValue: false // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json'
    },
    detection: {
      // 手动选择优先于浏览器语言；不支持的语言仍回退中文，不保存工具输入。
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'lang',
      caches: ['localStorage'] // cache the detected lang back to localStorage
    }
  });

/** 同步初次检测和后续手动切换的页面语言，供读屏及原生日期控件识别。 */
function updateDocumentLanguage(language: string) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : language;
  }
}
i18n.on('languageChanged', updateDocumentLanguage);
// 已内联的中英资源可同步初始化；监听器注册前发生的首次检测也必须同步。
updateDocumentLanguage(i18n.resolvedLanguage || i18n.language || 'zh');

// 复制原始模板，避免 setLocale 修改共享对象后丢失英文校验行为。
const originalValidation = {
  mixed: { ...defaultLocale.mixed },
  string: { ...defaultLocale.string },
  number: { ...defaultLocale.number },
  array: { ...defaultLocale.array }
};

/** 根据实际校验时的界面语言显示提示；仅改文案，不改任何校验规则。 */
type ValidationKey =
  keyof (typeof import('../../public/locales/en/translation.json'))['validation'];

function localizedValidation(
  key: ValidationKey,
  original: Message | undefined
): Message {
  return (params: AnyMessageParams) => {
    if (i18n.resolvedLanguage === 'zh') {
      return i18n.t(`translation:validation.${key}`, params);
    }
    return ValidationError.formatError(original, params);
  };
}

setLocale({
  mixed: {
    default: localizedValidation('invalid', originalValidation.mixed.default),
    required: localizedValidation(
      'required',
      originalValidation.mixed.required
    ),
    defined: localizedValidation('defined', originalValidation.mixed.defined),
    notNull: localizedValidation('notNull', originalValidation.mixed.notNull),
    oneOf: localizedValidation('oneOf', originalValidation.mixed.oneOf),
    notOneOf: localizedValidation(
      'notOneOf',
      originalValidation.mixed.notOneOf
    ),
    notType: localizedValidation('notType', originalValidation.mixed.notType)
  },
  string: {
    length: localizedValidation(
      'stringLength',
      originalValidation.string.length
    ),
    min: localizedValidation('stringMin', originalValidation.string.min),
    max: localizedValidation('stringMax', originalValidation.string.max),
    email: localizedValidation('email', originalValidation.string.email),
    url: localizedValidation('url', originalValidation.string.url),
    matches: localizedValidation('matches', originalValidation.string.matches)
  },
  number: {
    min: localizedValidation('numberMin', originalValidation.number.min),
    max: localizedValidation('numberMax', originalValidation.number.max),
    lessThan: localizedValidation(
      'numberLess',
      originalValidation.number.lessThan
    ),
    moreThan: localizedValidation(
      'numberMore',
      originalValidation.number.moreThan
    ),
    positive: localizedValidation(
      'numberPositive',
      originalValidation.number.positive
    ),
    negative: localizedValidation(
      'numberNegative',
      originalValidation.number.negative
    ),
    integer: localizedValidation(
      'numberInteger',
      originalValidation.number.integer
    )
  },
  array: {
    min: localizedValidation('arrayMin', originalValidation.array.min),
    max: localizedValidation('arrayMax', originalValidation.array.max),
    length: localizedValidation('arrayLength', originalValidation.array.length)
  }
});

export default i18n;
