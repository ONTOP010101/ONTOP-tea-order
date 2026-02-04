import request from '@/utils/request'
import type { Order, PaginationParams, PaginationResponse } from '@/types'

import { getSessionId } from '@/utils/session'
import { printOrder } from '@/utils/print'

// 创建订单
export const createOrder = async (data: {
  items: any[]
  remark?: string
  couponId?: string
  totalAmount: number
  discountAmount: number
  finalAmount: number
}) => {
  // 添加会话ID
  const order = await request.post<any, Order>('/orders', {
    ...data,
    sessionId: getSessionId()
  })
  
  // 下单成功后自动打印
  try {
    printOrder(order)
    console.log('订单打印成功:', order.order_no)
  } catch (error) {
    console.error('订单打印失败:', error)
  }
  
  return order
}

// 获取订单列表
export const getOrderList = (params: PaginationParams & { status?: string }, isLoggedIn: boolean = false) => {
  // 根据登录状态调用不同的API路由
  // 已登录：/orders/my （需要JWT）
  // 未登录：/orders/admin/all （不需要JWT，返回所有订单）
  const url = isLoggedIn ? '/orders/my' : '/orders/admin/all'
  
  // 添加会话ID参数和请求类型，确保游客只能看到自己的订单，前端只能看到7天内的订单
  const requestParams = {
    ...params,
    sessionId: getSessionId(),
    requestType: 'frontend' // 前端请求：设置requestType为frontend，返回7天内的订单
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
