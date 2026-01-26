// 用户相关类型
export interface User {
  id: string
  username: string
  phone?: string
  avatar?: string
  email?: string
  createdAt: string
}

export interface LoginParams {
  username: string
  password: string
}

export interface RegisterParams {
  username: string
  password: string
  phone: string
  code?: string
}

// 商品相关类型
export interface Product {
  id: string
  name: string
  name_en?: string  // 英文名称
  name_ar?: string  // 阿拉伯语名称
  name_es?: string  // 西班牙语名称
  name_pt?: string  // 葡萄牙语名称
  description: string
  description_en?: string  // 英文描述
  description_ar?: string  // 阿拉伯语描述
  description_es?: string  // 西班牙语描述
  description_pt?: string  // 葡萄牙语描述
  price: number
  originalPrice?: number
  image?: string  // 单个图片路径（API新增字段）
  images: string[] | null  // 修复：images可能为null
  categoryId: string
  stock: number
  soldCount: number
  specs?: ProductSpec[]
  tags?: string[]
  status: 'on' | 'off'
  createdAt: string
  has_specs?: boolean  // 商品是否有规格组
  category_id?: string  // API返回的字段，用于兼容
  sales?: number  // 销量字段，API返回
  updated_at?: string  // 更新时间
}

export interface ProductSpec {
  name: string
  options: ProductSpecOption[]
}

export interface ProductSpecOption {
  name: string
  price: number
  stock: number
}

export interface Category {
  id: string
  name: string
  name_en?: string  // 英文名称
  name_ar?: string  // 阿拉伯语名称
  name_es?: string  // 西班牙语名称
  name_pt?: string  // 葡萄牙语名称
  icon?: string
  sort: number
  parentId?: string
  children?: Category[]
}

// 购物车相关类型
export interface CartItem {
  id: string
  productId: string
  name: string
  image: string
  price: number
  quantity: number
  specs?: any
  selected: boolean
}

// 订单相关类型
export interface Order {
  id: string
  orderNo: string
  userId: string
  items: OrderItem[]
  totalAmount: number
  discountAmount: number
  finalAmount: number
  status: OrderStatus
  remark?: string
  couponId?: string
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  productId: string
  name: string
  image: string
  price: number
  quantity: number
  specs?: any
}

export type OrderStatus = 'pending' | 'preparing' | 'processing' | 'making' | 'ready' | 'completed' | 'cancelled'

// 优惠券相关类型
export interface Coupon {
  id: string
  name: string
  type: 'discount' | 'amount'
  value: number
  minAmount: number
  startTime: string
  endTime: string
  status: 'available' | 'used' | 'expired'
  description?: string
}

// API响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginationResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
