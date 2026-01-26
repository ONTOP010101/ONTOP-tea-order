import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, register, getUserInfo } from '@/api/auth'
import type { User, LoginParams, RegisterParams } from '@/types'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string>(localStorage.getItem('token') || '')

  const isLoggedIn = computed(() => !!token.value)

  // 登录
  const loginAction = async (params: LoginParams) => {
    const res = await login(params)
    token.value = res.token
    user.value = res.user
    localStorage.setItem('token', res.token)
    return res
  }

  // 注册
  const registerAction = async (params: RegisterParams) => {
    const res = await register(params)
    token.value = res.token
    user.value = res.user
    localStorage.setItem('token', res.token)
    return res
  }

  // 退出登录
  const logout = () => {
    user.value = null
    token.value = ''
    localStorage.removeItem('token')
  }

  // 检查登录状态
  const checkAuth = async () => {
    if (token.value) {
      try {
        const res = await getUserInfo()
        user.value = res
      } catch (error) {
        logout()
      }
    }
  }

  return {
    user,
    token,
    isLoggedIn,
    loginAction,
    registerAction,
    logout,
    checkAuth
  }
})
