import request from '@/utils/request'
import type { Product, Category, PaginationParams, PaginationResponse } from '@/types'

// 获取商品列表
export const getProductList = (params: PaginationParams & { categoryId?: string; keyword?: string }) => {
  return request.get<any, PaginationResponse<Product>>('/products', { params })
}

// 获取商品详情
export const getProductDetail = (id: string) => {
  return request.get<any, Product>(`/products/${id}`)
}

// 获取分类列表
export const getCategories = () => {
  return request.get<any, Category[]>('/categories')
}

// 获取分类列表（别名，保持向后兼容）
export const getCategoryList = getCategories

// 根据分类ID获取商品
export const getProductsByCategory = (categoryId: number) => {
  return request.get<any, PaginationResponse<Product>>(`/products`, { params: { categoryId } }).then(response => {
    return response.list || []
  })
}

// 获取热销商品
export const getHotProducts = (limit: number = 10) => {
  return request.get<any, Product[]>('/products/hot', { params: { limit } }).then(response => {
    // 检查返回值是否为数组，如果不是，尝试获取list属性
    if (Array.isArray(response)) {
      return response
    }
    return response.list || []
  })
}

// 获取新品
export const getNewProducts = (limit: number = 10) => {
  return request.get<any, Product[]>('/products/new', { params: { limit } }).then(response => {
    // 检查返回值是否为数组，如果不是，尝试获取list属性
    if (Array.isArray(response)) {
      return response
    }
    return response.list || []
  })
}

// 搜索商品
export const searchProducts = (keyword: string, params?: PaginationParams) => {
  return request.get<any, PaginationResponse<Product>>('/products/search', { 
    params: { keyword, ...params } 
  })
}

// 获取商品规格组
export const getProductSpecGroups = (productId: string) => {
  return request.get<any, any[]>(`/spec/product/${productId}/groups`)
}
