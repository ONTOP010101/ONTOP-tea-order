<template>
  <div class="login-page">
    <div class="login-header">
      <h1>{{ $t('common.appName') }}</h1>
      <p>{{ $t('auth.login') }}</p>
    </div>

    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="formData.username"
          :label="$t('auth.username')"
          :placeholder="$t('auth.usernamePlaceholder')"
          :rules="[{ required: true, message: $t('auth.usernameRequired') }]"
        />
        <van-field
          v-model="formData.password"
          type="password"
          :label="$t('auth.password')"
          :placeholder="$t('auth.passwordPlaceholder')"
          :rules="[{ required: true, message: $t('auth.passwordRequired') }]"
        />
      </van-cell-group>

      <div class="button-group">
        <van-button round block type="primary" native-type="submit" :loading="loading">
          {{ $t('auth.login') }}
        </van-button>
        <van-button round block plain type="primary" @click="goRegister">
          {{ $t('auth.register') }}
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { t } = useI18n()

const formData = ref({
  username: '',
  password: ''
})
const loading = ref(false)

const onSubmit = async () => {
  try {
    loading.value = true
    await userStore.loginAction(formData.value)
    showToast(t('auth.loginSuccess'))
    const redirect = route.query.redirect as string
    router.replace(redirect || '/home')
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const goRegister = () => {
  router.push('/register')
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--bg-color) 100%);
  padding: 60px 20px;

  .login-header {
    text-align: center;
    margin-bottom: 40px;
    color: white;

    h1 {
      font-size: 32px;
      margin-bottom: 8px;
    }

    p {
      font-size: 16px;
      opacity: 0.9;
    }
  }

  .button-group {
    padding: 20px 16px;

    .van-button {
      margin-bottom: 12px;
    }
  }
}
</style>
