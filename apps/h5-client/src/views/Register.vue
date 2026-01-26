<template>
  <div class="register-page">
    <van-nav-bar :title="$t('auth.register')" left-arrow @click-left="$router.back()" />

    <van-form @submit="onSubmit" class="register-form">
      <van-cell-group inset>
        <van-field
          v-model="formData.username"
          :label="$t('auth.username')"
          :placeholder="$t('auth.usernamePlaceholder')"
          :rules="[{ required: true, message: $t('auth.usernameRequired') }]"
        />
        <van-field
          v-model="formData.phone"
          type="tel"
          :label="$t('auth.phone')"
          :placeholder="$t('auth.phonePlaceholder')"
          :rules="[{ required: true, message: $t('auth.phoneRequired') }]"
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
          {{ $t('auth.register') }}
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const userStore = useUserStore()
const { t } = useI18n()

const formData = ref({
  username: '',
  phone: '',
  password: ''
})
const loading = ref(false)

const onSubmit = async () => {
  try {
    loading.value = true
    await userStore.registerAction(formData.value)
    showToast(t('auth.registerSuccess'))
    router.replace('/home')
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.register-page {
  min-height: 100vh;
  background: var(--bg-color);

  .register-form {
    padding-top: 20px;
  }

  .button-group {
    padding: 20px 16px;
  }
}
</style>
