import request from '@/utils/request'
import type { LoginParams, RegisterParams, User } from '@/types'

// 登录
export const login = (data: LoginParams) => {
  return request.post<any, { token: string; user: User }>('/auth/login', data)
}

// 注册
export const register = (data: RegisterParams) => {
  return request.post<any, { token: string; user: User }>('/auth/register', data)
}

// 获取用户信息
export const getUserInfo = () => {
  return request.get<any, User>('/auth/userinfo')
}

// 获取验证码
export const getVerifyCode = (phone: string) => {
  return request.post('/auth/verify-code', { phone })
}

// 修改密码
export const updatePassword = (oldPassword: string, newPassword: string) => {
  return request.post('/auth/update-password', { oldPassword, newPassword })
}
