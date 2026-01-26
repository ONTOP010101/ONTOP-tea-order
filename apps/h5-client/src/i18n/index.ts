import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN.json'
import enUS from './locales/en-US.json'
import arSA from './locales/ar-SA.json'
import esES from './locales/es-ES.json'
import ptBR from './locales/pt-BR.json'

const messages = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ar-SA': arSA,
  'es-ES': esES,
  'pt-BR': ptBR
}

// 获取默认语言
const getDefaultLocale = () => {
  const saved = localStorage.getItem('locale')
  if (saved && messages[saved as keyof typeof messages]) {
    return saved
  }
  
  // 浏览器语言
  const browserLang = navigator.language
  if (messages[browserLang as keyof typeof messages]) {
    return browserLang
  }
  
  return 'zh-CN'
}

const i18n = createI18n({
  legacy: false,
  locale: getDefaultLocale(),
  fallbackLocale: 'zh-CN',
  messages
})

export default i18n
