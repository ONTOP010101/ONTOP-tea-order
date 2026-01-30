import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios'
import { showToast } from 'vant'

// API缓存配置
interface CacheConfig {
  enabled: boolean
  ttl: number // 缓存过期时间（毫秒）
  keys: string[] // 需要缓存的API路径
}

const cacheConfig: CacheConfig = {
  enabled: true, // 重新启用缓存
  ttl: 5 * 60 * 1000, // 5分钟缓存
  keys: [
    '/product/category',
    '/product/hot',
    '/product/new',
    '/banner/active',
    '/categories',
    '/products',
    '/banners'
  ]
}

// 缓存存储
const cacheStore = new Map<string, {
  data: any
  timestamp: number
}>()

// 生成缓存键
const generateCacheKey = (config: AxiosRequestConfig): string => {
  const url = config.url || ''
  const method = config.method || 'get'
  const params = config.params ? JSON.stringify(config.params) : ''
  return `${method}:${url}:${params}`
}

// 检查是否需要缓存
const shouldCache = (config: AxiosRequestConfig): boolean => {
  if (!cacheConfig.enabled) return false
  if (config.method !== 'get') return false
  const url = config.url || ''
  return cacheConfig.keys.some(key => url.includes(key))
}

// 获取缓存数据
const getCache = (config: AxiosRequestConfig): any | null => {
  const key = generateCacheKey(config)
  const cached = cacheStore.get(key)
  if (!cached) return null
  
  const now = Date.now()
  if (now - cached.timestamp > cacheConfig.ttl) {
    cacheStore.delete(key)
    return null
  }
  
  return cached.data
}

// 设置缓存数据
const setCache = (config: AxiosRequestConfig, data: any): void => {
  const key = generateCacheKey(config)
  cacheStore.set(key, {
    data,
    timestamp: Date.now()
  })
}

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
      // 缓存成功的响应
      if (shouldCache(response.config)) {
        setCache(response.config, res.data)
      }
      return res.data
    }
    
    // 处理后端直接返回数据的情况（如直接返回数组或对象）
    if (res.code === undefined) {
      // 缓存成功的响应
      if (shouldCache(response.config)) {
        setCache(response.config, res)
      }
      return res
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

// 清除缓存的工具函数
export const clearCache = (): void => {
  cacheStore.clear()
}

// 清除特定API的缓存
export const clearCacheByUrl = (url: string): void => {
  for (const key of cacheStore.keys()) {
    if (key.includes(url)) {
      cacheStore.delete(key)
    }
  }
}

// 并行请求工具函数
export const parallelRequests = async <T extends Array<Promise<any>>>(
  requests: T
): Promise<{ [K in keyof T]: Awaited<T[K]> }> => {
  try {
    const results = await Promise.all(requests)
    return results as { [K in keyof T]: Awaited<T[K]> }
  } catch (error) {
    console.error('并行请求失败:', error)
    throw error
  }
}

// 带超时的并行请求工具函数
export const parallelRequestsWithTimeout = async <T extends Array<Promise<any>>>(
  requests: T,
  timeout: number = 10000
): Promise<{ [K in keyof T]: Awaited<T[K]> }> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('并行请求超时')), timeout)
  })

  try {
    const results = await Promise.race([
      Promise.all(requests),
      timeoutPromise
    ])
    return results as { [K in keyof T]: Awaited<T[K]> }
  } catch (error) {
    console.error('并行请求失败:', error)
    throw error
  }
}