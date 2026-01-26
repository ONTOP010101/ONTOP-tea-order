import request from '@/utils/request'

// 获取活跃Banner列表
export const getActiveBanners = () => {
  return request.get<any, any[]>('/banners/active/list').then(response => {
    // 检查返回值是否为数组，如果不是，尝试获取list属性
    if (Array.isArray(response)) {
      return response
    }
    return response.list || []
  })
}
