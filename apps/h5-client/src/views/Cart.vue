<template>
  <div class="cart-page">
    <van-nav-bar :title="$t('cart.title')" left-arrow @click-left="goHome" />

    <div v-if="cartStore.items.length === 0" class="empty-cart">
      <van-empty :description="$t('cart.empty')" />
    </div>

    <template v-else>
      <div class="cart-actions">
        <van-button type="danger" plain size="small" @click="clearCart">
          {{ $t('cart.clearAll') }}
        </van-button>
        <!-- 添加页面内全选按钮 -->
        <van-button type="primary" plain size="small" @click="toggleCheckAll">
          {{ checkAll ? $t('cart.unselectAll') : $t('cart.selectAll') }}
        </van-button>
      </div>
      <van-checkbox-group v-model="checked">
        <van-swipe-cell v-for="item in cartStore.items" :key="item.id">
          <div class="cart-item">
            <van-checkbox :name="item.id" class="yellow-checkbox" />
            <img :src="getImageUrl(item.image)" :alt="item.name" class="item-image" @error="handleImageError" loading="lazy" />
            <div class="item-info">
              <div class="item-name">{{ item.name }}</div>
              <!-- 只有当specs有实际内容时才显示 -->
            <div class="item-specs" v-if="item.specs?.text">
              {{ item.specs.text }}
            </div>
              <div class="item-footer">
                <div class="item-price">¥{{ item.price }}</div>
                <van-stepper
                  v-model="item.quantity"
                  @change="(val) => onQuantityChange(val, item)"
                  min="0"
                />
              </div>
            </div>
          </div>
          <template #right>
            <div class="delete-btn" @click="cartStore.removeItem(item.id)">
              删除
            </div>
          </template>
        </van-swipe-cell>
      </van-checkbox-group>
      
      <!-- 添加页面内提交订单按钮 -->
      <div class="cart-submit">
        <van-button 
          type="danger" 
          @click="checkout"
          :disabled="cartStore.selectedItems.length === 0"
          block
        >
          {{ $t('cart.submit') }}
        </van-button>
      </div>
    </template>

    <!-- 底部结算栏 -->
      <van-submit-bar
        v-if="cartStore.items.length > 0"
        :price="cartStore.selectedTotalPrice * 100"
        :button-text="$t('cart.submit')"
        @submit="checkout"
      >
        <van-checkbox v-model="checkAll" class="yellow-checkbox">{{ $t('cart.selectAll') }}</van-checkbox>
      </van-submit-bar>

    <van-tabbar route>
      <van-tabbar-item to="/home" icon="home-o">{{ $t('nav.home') }}</van-tabbar-item>
      <van-tabbar-item to="/category" icon="apps-o">{{ $t('nav.category') }}</van-tabbar-item>
      <van-tabbar-item to="/cart" icon="cart-o">{{ $t('nav.cart') }}</van-tabbar-item>
      <van-tabbar-item to="/profile" icon="user-o">{{ $t('nav.profile') }}</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'
import { showToast, showDialog } from 'vant'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()
const { t } = useI18n()

const active = ref(2)
const checked = computed({
  get: () => cartStore.items.filter(item => item.selected).map(item => item.id),
  set: (values) => {
    cartStore.items.forEach(item => {
      item.selected = values.includes(item.id)
    })
  }
})

const checkAll = computed({
  get: () => cartStore.items.every(item => item.selected),
  set: (value) => {
    cartStore.toggleSelectAll()
  }
})

// 获取图片URL，使用多语言占位图
const getPlaceholderImage = () => {
  const text = t('product.noImage')
  const svg = `<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" fill="#f5f5f5"/><text x="50%" y="50%" font-size="12" fill="#999" text-anchor="middle" dy=".3em">${text}</text></svg>`
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
}

// 获取图片URL，确保路径正确
const getImageUrl = (image: string) => {
  if (!image) return getPlaceholderImage()
  // 如果是完整URL直接使用，否则确保是正确的相对路径
  if (image.startsWith('http')) {
    return image
  }
  // 确保路径以/uploads/开头，通过Vite的/uploads代理访问
  if (image.startsWith('/uploads/')) {
    return image
  }
  if (image.startsWith('uploads/')) {
    return `/${image}`
  }
  return `/uploads/${image}`
}

// 图片加载失败处理
const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.src = getPlaceholderImage()
}

const clearCart = () => {
  showDialog({
    title: '提示',
    message: '确定要清空购物车吗？',
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  })
  .then(() => {
    cartStore.clearCart()
    showToast(t('common.success'))
  })
  .catch(() => {
    // 用户取消操作
  })
}

// 添加全选/取消全选函数
const toggleCheckAll = () => {
  cartStore.toggleSelectAll()
}

const checkout = () => {
  if (cartStore.selectedItems.length === 0) {
    showToast(t('cart.selectedItems', { count: 0 }))
    return
  }

  router.push('/order/confirm')
}

// 处理数量变化，当数量减到0时移除商品
const onQuantityChange = (val: number, item: any) => {
  if (val > 0) {
    cartStore.updateQuantity(item.id, val)
  } else {
    // 数量为0时移除商品
    cartStore.removeItem(item.id)
  }
}

// 返回首页
const goHome = () => {
  router.push('/home')
}
</script>

<style>
/* 使用普通CSS代替SCSS，避免Vite处理SCSS时的问题 */
.cart-page {
  min-height: 100vh;
  background: var(--bg-color);
  padding-bottom: 110px;
}

/* 固定导航栏样式 */
.cart-page .van-nav-bar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.cart-page .cart-actions {
  padding: 12px;
  display: flex;
  justify-content: flex-end;
  background: white;
  margin-bottom: 8px;
}

.cart-page .empty-cart {
  padding-top: 100px;
}

.cart-page .cart-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: white;
  margin-bottom: 8px;
}

.cart-page .cart-item .item-image {
  width: 80px;
  height: 80px;
  border-radius: var(--border-radius);
  object-fit: cover;
  margin: 0 12px;
}

.cart-page .cart-item .item-info {
  flex: 1;
}

.cart-page .cart-item .item-info .item-name {
  font-size: 14px;
  font-weight: bold;
  color: var(--title-color);
  margin-bottom: 4px;
}

.cart-page .cart-item .item-info .item-specs {
  display: inline-block;
  font-size: 13px;
  color: var(--text-secondary);
  background-color: #e5e7eb;
  padding: 4px 10px;
  border-radius: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}

.cart-page .cart-item .item-info .item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart-page .cart-item .item-info .item-footer .item-price {
  font-size: 16px;
  font-weight: bold;
  color: var(--primary-color);
}

/* 自定义删除按钮样式 */
.cart-page .delete-btn {
  width: 80px;
  height: 100%;
  background-color: #ee0a24;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
}

/* 购物车操作栏样式 */
.cart-page .cart-actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 12px;
  background: white;
  margin-bottom: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 页面内提交订单区域样式 */
.cart-page .cart-submit {
  background: white;
  padding: 16px;
  margin: 16px 0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  /* 确保页面内提交订单区域在全局横幅之上 */
  position: relative;
  z-index: 100;
}

/* 确保页面内提交订单按钮样式正常 */
.cart-page .cart-submit .van-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: bold;
}

/* 选中商品信息样式 */
.cart-page .selected-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
}

/* 黄色圆形复选框样式 */
.cart-page :deep(.van-checkbox__icon) {
  border-radius: 50% !important;
  border-color: #ffd93d !important;
  background-color: white !important;
  width: 20px !important;
  height: 20px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.cart-page :deep(.van-checkbox__icon--checked) {
  background-color: #ffd93d !important;
  border-color: #ffd93d !important;
}

.cart-page :deep(.van-checkbox__icon--checked .van-checkbox__icon-inner) {
  background-color: white !important;
  border-color: white !important;
  width: 10px !important;
  height: 10px !important;
  clip-path: polygon(20% 45%, 10% 55%, 40% 85%, 90% 15%, 80% 5%, 35% 70%);
}
</style>
