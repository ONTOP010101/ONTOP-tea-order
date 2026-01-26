<template>
  <div class="profile-page">
    <div class="profile-header">
      <div class="user-info">
        <van-image
          round
          width="60"
          height="60"
          src="https://picsum.photos/100/100?random=99"
        />
        <div class="user-name">{{ $t('profile.guestUser') }}</div>
      </div>
    </div>

    <div class="profile-menu">
      <van-cell-group>
        <van-cell
          :title="$t('profile.myOrders')"
          is-link
          icon="orders-o"
          @click="$router.push('/order/list')"
        />
        
        <van-cell
          :title="$t('profile.language')"
          is-link
          icon="globe-o"
          @click="showLanguagePicker = true"
        />
      </van-cell-group>
    </div>

    <!-- 语言选择器 -->
    <van-popup v-model:show="showLanguagePicker" position="bottom">
      <van-picker
        :columns="languageOptions"
        @confirm="onLanguageConfirm"
        @cancel="showLanguagePicker = false"
      />
    </van-popup>

    <van-tabbar v-model="active" route>
      <van-tabbar-item to="/home" icon="home-o">{{ $t('nav.home') }}</van-tabbar-item>
      <van-tabbar-item to="/category" icon="apps-o">{{ $t('nav.category') }}</van-tabbar-item>
      <van-tabbar-item to="/cart" icon="cart-o">{{ $t('nav.cart') }}</van-tabbar-item>
      <van-tabbar-item to="/profile" icon="user-o">{{ $t('nav.profile') }}</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog } from 'vant'
import { useUserStore } from '@/stores/user'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const userStore = useUserStore()
const { locale, t } = useI18n()

const active = ref(3)
const showLanguagePicker = ref(false)

const languageOptions = [
  { text: '简体中文', value: 'zh-CN' },
  { text: 'English', value: 'en-US' },
  { text: 'العربية', value: 'ar-SA' },
  { text: 'Español', value: 'es-ES' },
  { text: 'Português', value: 'pt-BR' }
]

const goLogin = () => {
  router.push('/login')
}

const logout = async () => {
  try {
    await showConfirmDialog({ message: t('profile.logoutConfirm') })
    userStore.logout()
    router.replace('/home')
  } catch (error) {
    // 取消
  }
}

const onLanguageConfirm = ({ selectedValues }: any) => {
  if (Array.isArray(selectedValues) && selectedValues.length > 0 && selectedValues[0]) {
    const selectedLocale = selectedValues[0]
    locale.value = selectedLocale
    localStorage.setItem('locale', selectedLocale)
    showLanguagePicker.value = false
    
    // RTL布局支持
    if (selectedLocale === 'ar-SA') {
      document.documentElement.setAttribute('dir', 'rtl')
    } else {
      document.documentElement.removeAttribute('dir')
    }
  }
}
</script>

<style scoped lang="scss">
.profile-page {
  min-height: 100vh;
  background: var(--bg-color);
  padding-bottom: 60px;

  .profile-header {
    background: linear-gradient(135deg, var(--primary-color), #b5d954);
    padding: 40px 20px;
    text-align: center;
    color: white;

    .user-info {
      cursor: pointer;

      .user-name {
        margin-top: 12px;
        font-size: 18px;
        font-weight: bold;
      }
    }
  }

  .profile-menu {
    margin-top: 12px;

    .van-cell-group {
      margin-bottom: 12px;
    }
  }
}
</style>
