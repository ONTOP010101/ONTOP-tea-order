<template>
  <div class="order-list-page">
    <van-nav-bar :title="$t('order.list')" left-arrow @click-left="$router.back()" />

    <div class="order-status-bar">
      <h3>{{ $t('order.list') }}</h3>
    </div>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list v-model:loading="loading" :finished="finished" @load="onLoad">
        <div v-for="order in orders" :key="order.id" class="order-card" @click="goDetail(order.id)">
          <div class="order-header">
            <span>{{ $t('order.number') }}: {{ order.orderNo }}</span>
            <van-tag :type="getStatusType(order.status)">
              {{ $t(`order.status${capitalize(order.status === 'preparing' ? 'processing' : order.status)}`) }}
            </van-tag>
          </div>
          <div class="order-items">
            <div v-for="(item, idx) in order.items" :key="idx" class="order-item">
              <img :src="getImageUrl(item.image)" :alt="item.name" @error="handleImageError" />
              <div class="item-info">
                <div>{{ item.name }}</div>
                <!-- 显示规格组 -->
                <div v-if="item.specs?.text" class="item-specs">{{ item.specs.text }}</div>
                <div>x{{ item.quantity }}</div>
              </div>
            </div>
          </div>
          <div class="order-footer">
            <span>合计: ¥{{ order.finalAmount }}</span>
            <div class="footer-buttons">
              <van-button v-if="order.status === 'pending'" size="small" @click.stop="cancelOrder(order.id)">
                {{ $t('order.cancel') }}
              </van-button>
              <van-button size="small" type="primary" @click.stop="showShareDialog(order)" style="margin-left: 8px;">
                {{ $t('order.share') }}
              </van-button>
            </div>
          </div>
        </div>
        <van-empty v-if="!orders.length && !loading" :description="$t('order.empty')" />
      </van-list>
    </van-pull-refresh>

    <!-- 分享订单弹窗 -->
    <van-popup v-model:show="showSharePopup" position="center" :style="{ width: '90%', borderRadius: '12px' }">
      <div class="share-popup">
        <h3>{{ $t('order.share') }}</h3>
        <div class="share-content" v-if="selectedOrder">
          <div v-for="(item, idx) in selectedOrder.items" :key="idx" class="share-item">
            <img :src="getImageUrl(item.image)" :alt="item.name" @error="handleImageError" />
            <div class="share-item-info">
              <div class="share-item-name">{{ item.name }}</div>
              <!-- 显示规格组 -->
              <div v-if="item.specs?.text" class="share-item-specs">{{ item.specs.text }}</div>
              <div class="share-item-quantity">{{ $t('order.quantity') }}: {{ item.quantity }}</div>
            </div>
          </div>
          <div class="share-remark" v-if="selectedOrder.remark">
            <div class="share-remark-title">{{ $t('order.remark') }}:</div>
            <div class="share-remark-content">{{ selectedOrder.remark }}</div>
          </div>
        </div>
        <van-button type="primary" block @click="closeShareDialog">{{ $t('common.confirm') }}</van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { getOrderList, cancelOrder as cancelOrderApi } from '@/api/order'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import type { Order } from '@/types'

const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()

const orders = ref<Order[]>([])
const loading = ref(false)
const refreshing = ref(false)
const finished = ref(false)
const page = ref(1)
const showSharePopup = ref(false)
const selectedOrder = ref<Order | null>(null)

const showShareDialog = (order: Order) => {
  selectedOrder.value = order
  showSharePopup.value = true
}

const closeShareDialog = () => {
  showSharePopup.value = false
  selectedOrder.value = null
}

const loadOrders = async () => {
  try {
    loading.value = true
    const res = await getOrderList({
      page: page.value,
      pageSize: 20
      // 移除status参数，获取所有状态的订单
    }, userStore.isLoggedIn)
    if (page.value === 1) {
      orders.value = res.list // 第一页时直接替换列表
    } else {
      orders.value = [...orders.value, ...res.list] // 后续页追加
    }
    finished.value = res.list.length < 20
  } catch (error) {
    // 静默处理错误，不显示在控制台
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const onRefresh = () => {
  page.value = 1
  orders.value = []
  finished.value = false
  loadOrders()
}

const onLoad = () => {
  page.value++
  loadOrders()
}

const goDetail = (id: string) => {
  router.push(`/order/detail/${id}`)
}

const cancelOrder = async (id: string) => {
  try {
    await showConfirmDialog({ message: '确认取消订单?' })
    await cancelOrderApi(id)
    showToast(t('common.success'))
    onRefresh()
  } catch (error) {
    // 静默处理错误，不显示在控制台
  }
}

const getStatusType = (status: string) => {
  const map: any = {
    pending: 'warning',
    processing: 'info',
    preparing: 'info', // 添加对 preparing 状态的支持
    making: 'primary',
    ready: 'success',
    completed: 'default',
    cancelled: 'danger'
  }
  return map[status] || 'default'
}

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

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
  // 确保路径以/uploads/开头，通过Vite的/uploads代理访问
  if (image.startsWith('/uploads/')) {
    return image
  }
  if (image.startsWith('uploads/')) {
    return `/${image}`
  }
  // 如果是相对路径，添加/uploads/前缀
  return `/uploads/${image}`
}

// 图片加载失败处理
const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.src = getPlaceholderImage()
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped lang="scss">
.order-list-page {
  min-height: 100vh;
  background: var(--bg-color);

  /* 固定导航栏样式 */
  .van-nav-bar {
    position: sticky;
    top: 0;
    z-index: 1000;
    background-color: #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .order-status-bar {
    padding: 12px 16px;
    background: white;
    border-bottom: 1px solid var(--divider-color);
    
    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: bold;
      color: var(--title-color);
    }
  }

  .order-card {
    background: white;
    margin: 12px;
    border-radius: var(--border-radius);
    padding: 16px;
    box-shadow: var(--shadow-sm);

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: 14px;
      color: var(--text-secondary);
    }

    .order-items {
      border-top: 1px solid var(--divider-color);
      border-bottom: 1px solid var(--divider-color);
      padding: 12px 0;
      margin-bottom: 12px;

      .order-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 12px;

            &:last-child {
              margin-bottom: 0;
            }

            img {
              width: 60px;
              height: 60px;
              border-radius: 8px;
              object-fit: cover;
              margin-right: 12px;
              flex-shrink: 0;
            }

            .item-info {
              flex: 1;
              display: flex;
              flex-direction: column;
              align-items: flex-start;
            }

            .item-info > div:first-child {
              font-size: 14px;
              font-weight: 600;
              color: var(--title-color);
              margin-bottom: 4px;
            }

            .item-specs {
              font-size: 12px;
              color: var(--text-secondary);
              background-color: #e5e7eb;
              padding: 2px 8px;
              border-radius: 12px;
              margin: 4px 0;
              font-weight: 500;
            }

            .item-info > div:last-child {
              font-size: 13px;
              color: var(--text-secondary);
              font-weight: 500;
            }
          }
    }

    .order-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 16px;
      font-weight: bold;
      color: var(--title-color);

      .footer-buttons {
        display: flex;
        gap: 8px;
      }
    }
  }

  /* 分享弹窗样式 */
  .share-popup {
    padding: 16px;
    text-align: center;

    h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: bold;
    }

    .share-content {
      margin-bottom: 12px;
      text-align: left;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 8px;
    }

    .share-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 6px;
      background: #f5f5f5;
      border-radius: 4px;
      text-align: center;

      img {
        width: 40px;
        height: 40px;
        border-radius: 3px;
        object-fit: cover;
        margin-right: 0;
        margin-bottom: 6px;
      }

      .share-item-info {
        flex: 1;
        width: 100%;
      }

      .share-item-name {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 2px;
            line-height: 1.2;
          }

          .share-item-specs {
            font-size: 10px;
            color: #666;
            background-color: #f5f5f5;
            padding: 1px 6px;
            border-radius: 8px;
            margin: 2px 0;
            display: inline-block;
          }

          .share-item-quantity {
            font-size: 10px;
            color: #666;
          }
    }

    .share-remark {
      margin-top: 12px;
      padding: 10px;
      background: #f5f5f5;
      border-radius: 6px;

      .share-remark-title {
        font-size: 12px;
        font-weight: bold;
        margin-bottom: 6px;
      }

      .share-remark-content {
        font-size: 12px;
        color: #333;
        line-height: 1.4;
      }
    }
  }
}
</style>
