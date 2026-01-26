<template>
  <div class="order-confirm-page">
    <van-nav-bar :title="$t('order.confirm')" left-arrow @click-left="$router.back()" />

    <div class="page-content">
      <!-- 商品列表 -->
      <div class="order-items card">
        <h3>{{ $t('order.items') }}</h3>
        <div v-for="item in cartStore.selectedItems" :key="item.id" class="order-item">
          <img :src="getImageUrl(item.image)" :alt="item.name" @error="handleImageError" />
          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <!-- 显示规格组 -->
            <div v-if="item.specs?.text" class="item-specs">
              <span class="spec-item">{{ item.specs.text }}</span>
            </div>
            <div class="item-price">¥{{ item.price }} x {{ item.quantity }}</div>
          </div>
          <div class="item-total">¥{{ ((typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0) * (typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0)).toFixed(2) }}</div>
        </div>
      </div>

      <!-- 备注 -->
      <div class="order-remark card">
        <van-field
          v-model="remark"
          rows="3"
          autosize
          type="textarea"
          :placeholder="$t('order.remarkPlaceholder')"
        />
      </div>

      <!-- 费用明细已删除 -->
    </div>

    <!-- 底部提交 -->
    <van-submit-bar
      :price="finalAmount * 100"
      :button-text="$t('order.submit')"
      @submit="submitOrder"
      :loading="submitting"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { useCartStore } from '@/stores/cart'
import { createOrder } from '@/api/order'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const cartStore = useCartStore()
const { t } = useI18n()

const remark = ref('')
const submitting = ref(false)

const totalAmount = computed(() => cartStore.selectedTotalPrice)
const discountAmount = computed(() => 0) // 优惠券功能
const finalAmount = computed(() => totalAmount.value - discountAmount.value)

// 获取图片URL，使用多语言占位图
const getPlaceholderImage = () => {
  const text = t('product.noImage')
  const svg = `<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" fill="#f5f5f5"/><text x="50%" y="50%" font-size="10" fill="#999" text-anchor="middle" dy=".3em">${text}</text></svg>`
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
}

// 获取图片URL，确保路径正确
const getImageUrl = (image: string) => {
  if (!image) return getPlaceholderImage()
  // 如果是完整URL直接使用，否则确保是正确的相对路径
  if (image.startsWith('http')) {
    return image
  }
  // 确保路径以/开头，通过Vite的/uploads代理访问
  return image.startsWith('/') ? image : `/${image}`
}

// 图片加载失败处理
const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.src = getPlaceholderImage()
}

const submitOrder = async () => {
  try {
    submitting.value = true
    showLoadingToast({ message: '提交中...', forbidClick: true })

    const orderData = {
      items: cartStore.selectedItems.map(item => ({
        productId: item.productId,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        specs: item.specs
      })),
      totalAmount: totalAmount.value,
      discountAmount: discountAmount.value,
      finalAmount: finalAmount.value,
      remark: remark.value
    }

    const order = await createOrder(orderData)
    
    closeToast()
    showToast(t('common.success'))

    // 清空已选中的购物车商品
    cartStore.clearSelected()

    // 跳转到订单详情
    router.replace(`/order/detail/${order.id}`)
  } catch (error: any) {
    closeToast()
    
    // 显示更详细的错误信息
    const errorMsg = error.response?.data?.message || error.message || t('common.error')
    showToast(errorMsg)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.order-confirm-page {
  min-height: 100vh;
  background: var(--bg-color);
  padding-bottom: 60px;

  /* 固定导航栏样式 */
  .van-nav-bar {
    position: sticky;
    top: 0;
    z-index: 1000;
    background-color: #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .order-items {
    h3 {
      font-size: 16px;
      font-weight: bold;
      color: var(--title-color);
      margin-bottom: 12px;
    }

    .order-item {
        display: flex;
        align-items: flex-start;
        padding: 16px;
        margin-bottom: 12px;
        border-radius: var(--border-radius);
        background-color: #fafafa;
        box-shadow: var(--shadow-sm);

        img {
          width: 70px;
          height: 70px;
          border-radius: 8px;
          object-fit: cover;
          margin-right: 16px;
          flex-shrink: 0;
        }

        .item-info {
          flex: 1;

          .item-name {
            font-size: 15px;
            color: var(--title-color);
            font-weight: 600;
            margin-bottom: 6px;
            line-height: 1.4;
          }

          .item-specs {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 6px;
          }

          .spec-item {
            font-size: 13px;
            color: var(--text-secondary);
            background-color: #e5e7eb;
            padding: 4px 10px;
            border-radius: 16px;
            font-weight: 500;
          }

          .item-price {
            font-size: 13px;
            color: var(--text-secondary);
            font-weight: 500;
          }
        }

        .item-total {
          font-size: 17px;
          font-weight: 700;
          color: var(--title-color);
          margin-left: 16px;
          flex-shrink: 0;
        }
      }
  }
}
</style>