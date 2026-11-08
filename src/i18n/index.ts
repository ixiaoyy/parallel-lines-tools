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
      // 未选择语言时默认中文，仅恢复用户保存的语言，不由浏览器语言覆盖。
      order: ['localStorage'],
      lookupLocalStorage: 'lang',
      caches: ['localStorage'] // cache the detected lang back to localStorage
    }
  });

// 页面语言与实际界面同步，供读屏和浏览器正确识别。
i18n.on('languageChanged', (language) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : language;
  }
});

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
