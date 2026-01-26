import request from '@/utils/request'
import type { Coupon } from '@/types'

// 获取优惠券列表
export const getCouponList = () => {
  return request.get<any, Coupon[]>('/coupons')
}

// 领取优惠券
export const claimCoupon = (id: string) => {
  return request.post(`/coupons/${id}/claim`)
}

// 获取我的优惠券
export const getMyCoupons = () => {
  return request.get<any, Coupon[]>('/coupons/my')
}

// 获取可用优惠券
export const getAvailableCoupons = (amount: number) => {
  return request.get<any, Coupon[]>('/coupons/available', { params: { amount } })
}
