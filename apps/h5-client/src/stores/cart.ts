import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CartItem } from '@/types'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])

  // 从localStorage加载
  const loadCart = () => {
    const saved = localStorage.getItem('cart')
    if (saved) {
      items.value = JSON.parse(saved)
    }
  }

  // 保存到localStorage
  const saveCart = () => {
    localStorage.setItem('cart', JSON.stringify(items.value))
  }

  // 购物车总数量
  const totalCount = computed(() => {
    return items.value.reduce((sum, item) => sum + item.quantity, 0)
  })

  // 购物车总价
  const totalPrice = computed(() => {
    return items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  })

  // 已选中的商品
  const selectedItems = computed(() => {
    return items.value.filter(item => item.selected)
  })

  // 已选中的总价
  const selectedTotalPrice = computed(() => {
    return selectedItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  })

  // 添加商品
  const addItem = (item: CartItem) => {
    // 检查是否已经存在相同的商品和相同的规格
    // 不同规格应该作为独立的购物车项
    const existItem = items.value.find(i => 
      i.productId === item.productId && 
      JSON.stringify(i.specs) === JSON.stringify(item.specs)
    )

    if (existItem) {
      // 如果已存在相同规格的商品，增加数量
      existItem.quantity += item.quantity
    } else {
      // 如果不存在，添加新商品，默认选中
      items.value.push({
        ...item,
        selected: true, // 默认选中
        // 保留原图片URL，包括base64占位符
        image: item.image
      })
    }

    saveCart()
  }

  // 更新数量
  const updateQuantity = (id: string, quantity: number) => {
    const item = items.value.find(item => item.id === id)
    if (item) {
      item.quantity = quantity
      if (quantity <= 0) {
        removeItem(id)
      } else {
        saveCart()
      }
    }
  }

  // 更新购物车项
  const updateItem = (id: string, updates: Partial<CartItem>) => {
    const item = items.value.find(item => item.id === id)
    if (item) {
      Object.assign(item, updates)
      saveCart()
    }
  }

  // 移除商品
  const removeItem = (id: string) => {
    const index = items.value.findIndex(item => item.id === id)
    if (index > -1) {
      items.value.splice(index, 1)
      saveCart()
    }
  }

  // 切换选中状态
  const toggleSelect = (id: string) => {
    const item = items.value.find(item => item.id === id)
    if (item) {
      item.selected = !item.selected
      saveCart()
    }
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    const allSelected = items.value.every(item => item.selected)
    items.value.forEach(item => {
      item.selected = !allSelected
    })
    saveCart()
  }

  // 清空购物车
  const clearCart = () => {
    items.value = []
    saveCart()
  }

  // 清空已选中商品
  const clearSelected = () => {
    items.value = items.value.filter(item => !item.selected)
    saveCart()
  }

  // 初始化
  loadCart()

  return {
    items,
    totalCount,
    totalPrice,
    selectedItems,
    selectedTotalPrice,
    addItem,
    updateQuantity,
    updateItem,
    removeItem,
    toggleSelect,
    toggleSelectAll,
    clearCart,
    clearSelected
  }
})
