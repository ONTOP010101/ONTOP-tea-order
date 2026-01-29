import axios, { AxiosInstance, AxiosError } from 'axios'
import { showToast } from 'vant'

const instance: AxiosInstance = axios.create({
  baseURL: '/api', // 使用相对路径，通过Vite代理转发请求
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // 允许携带凭证，解决跨域问题
})

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    const res = response.data
    
    // 统一处理后端返回的格式 { code: 200, message: "success", data: {} }
    if (res.code === 200) {
      return res.data
    }
    
    // 错误处理
    const message = res.message || '请求失败'
    showToast(message)
    return Promise.reject(new Error(message))
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // 401错误不跳转登录，允许匿名用户
      showToast('请求失败')
    } else {
      showToast(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default instance