<template>
  <div class="language-select-page">
    <div class="logo-section">
      <div class="logo">🍵</div>
      <h1 class="app-name">悦享茶歇 / Tea Break</h1>
      <p class="subtitle">Please select your language / يرجى اختيار اللغة</p>
    </div>

    <div class="language-list">
      <div 
        v-for="lang in languages" 
        :key="lang.value"
        class="language-item"
        @click="selectLanguage(lang.value)"
      >
        <div class="lang-icon">{{ lang.icon }}</div>
        <div class="lang-info">
          <div class="lang-name">{{ lang.name }}</div>
          <div class="lang-native">{{ lang.native }}</div>
        </div>
        <van-icon name="arrow" />
      </div>
    </div>

    <div class="footer-text">
      Welcome to our ordering system<br>
      مرحباً بك في نظام الطلبات
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { locale } = useI18n()

const languages = [
  { 
    value: 'zh-CN', 
    name: '简体中文', 
    native: 'Simplified Chinese',
    icon: '🇨🇳'
  },
  { 
    value: 'en-US', 
    name: 'English', 
    native: 'English',
    icon: '🇺🇸'
  },
  { 
    value: 'ar-SA', 
    name: 'العربية', 
    native: 'Arabic',
    icon: '🇸🇦'
  },
  { 
    value: 'es-ES', 
    name: 'Español', 
    native: 'Spanish',
    icon: '🇪🇸'
  },
  { 
    value: 'pt-BR', 
    name: 'Português', 
    native: 'Portuguese',
    icon: '🇧🇷'
  }
]

const selectLanguage = (lang: string) => {
  // 设置语言
  locale.value = lang
  localStorage.setItem('language', lang)
  localStorage.setItem('language-selected', 'true')
  
  // 设置RTL
  if (lang === 'ar-SA') {
    document.documentElement.setAttribute('dir', 'rtl')
  } else {
    document.documentElement.setAttribute('dir', 'ltr')
  }
  
  // 跳转到首页
  router.push('/home')
}
</script>

<style scoped lang="scss">
.language-select-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 20px;
}

.logo-section {
  text-align: center;
  margin-bottom: 40px;
  color: white;

  .logo {
    font-size: 80px;
    margin-bottom: 20px;
    animation: bounce 2s infinite;
  }

  .app-name {
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .subtitle {
    font-size: 14px;
    opacity: 0.9;
  }
}

.language-list {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.language-item {
  display: flex;
  align-items: center;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: #f5f5f5;
    transform: scale(0.98);
  }

  .lang-icon {
    font-size: 32px;
    margin-right: 16px;
  }

  .lang-info {
    flex: 1;

    .lang-name {
      font-size: 18px;
      font-weight: bold;
      color: #333;
      margin-bottom: 4px;
    }

    .lang-native {
      font-size: 14px;
      color: #999;
    }
  }
}

.footer-text {
  text-align: center;
  margin-top: 30px;
  color: white;
  font-size: 12px;
  opacity: 0.8;
  line-height: 1.6;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style>
