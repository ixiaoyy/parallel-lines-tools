import 'monaco-editor/esm/nls.messages.zh-cn.js';
import englishMessages from 'monaco-editor/esm/nls.messages.json';
import i18n from '../i18n';

// Monaco 0.53 的官方 ESM NLS 启动模块通过这两个全局属性读取消息表。
const nlsEnvironment: typeof globalThis & {
  _VSCODE_NLS_MESSAGES?: string[];
  _VSCODE_NLS_LANGUAGE?: string;
} = globalThis;

/** 首次装载编辑器时使用工具箱当前语言；初始化未完成时恢复已保存选择，无记录默认中文。 */
function currentLanguage(): 'zh' | 'en' {
  const active = i18n.language || i18n.resolvedLanguage;
  if (active) return active.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  try {
    const saved = window.localStorage.getItem('lang');
    return !saved || saved.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  } catch {
    // 浏览器禁止语言缓存时仍可使用编辑器；仅放弃可选缓存，默认中文，不读取或保存编辑内容。
    return 'zh';
  }
}

export const initialMonacoLanguage = currentLanguage();

// 此模块必须先于 monaco-editor 本体求值；菜单注册会捕获文案，之后切换页面语言需用户保存后刷新。
if (initialMonacoLanguage === 'en') {
  nlsEnvironment._VSCODE_NLS_MESSAGES = englishMessages;
  nlsEnvironment._VSCODE_NLS_LANGUAGE = 'en';
}
