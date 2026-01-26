import request from '@/utils/request'
import type { Order, PaginationParams, PaginationResponse } from '@/types'

import { getSessionId } from '@/utils/session'

// 创建订单
export const createOrder = (data: {
  items: any[]
  remark?: string
  couponId?: string
  totalAmount: number
  discountAmount: number
  finalAmount: number
}) => {
  // 添加会话ID
  return request.post<any, Order>('/orders', {
    ...data,
    sessionId: getSessionId()
  })
}

// 获取订单列表
export const getOrderList = (params: PaginationParams & { status?: string }, isLoggedIn: boolean = false) => {
  // 根据登录状态调用不同的API路由
  // 已登录：/orders/my （需要JWT）
  // 未登录：/orders/admin/all （不需要JWT，返回所有订单）
  const url = isLoggedIn ? '/orders/my' : '/orders/admin/all'
  
  // 添加会话ID参数，确保游客只能看到自己的订单
  const requestParams = {
    ...params,
    sessionId: getSessionId()
  }
  
  return request.get<any, PaginationResponse<Order>>(url, { params: requestParams })
}

// 获取订单详情
export const getOrderDetail = (id: string) => {
  return request.get<any, Order>(`/orders/${id}`)
}

// 取消订单
export const cancelOrder = (id: string) => {
  // 添加会话ID
  return request.post(`/orders/${id}/cancel`, {
    sessionId: getSessionId()
  })
}

// 确认完成订单
export const completeOrder = (id: string) => {
  return request.post(`/orders/${id}/complete`)
}
