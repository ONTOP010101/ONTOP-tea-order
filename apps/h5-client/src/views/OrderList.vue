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
              {{ $t(`order.status${capitalize(order.status)}`) }}
            </van-tag>
          </div>
          <div class="order-items">
            <div v-for="(item, idx) in order.items" :key="idx" class="order-item">
              <img :src="item.image" :alt="item.name" />
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
            <img :src="item.image" :alt="item.name" />
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
    making: 'primary',
    ready: 'success',
    completed: 'default',
    cancelled: 'danger'
  }
  return map[status] || 'default'
}

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

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
    padding: 20px;
    text-align: center;

    h3 {
      margin: 0 0 20px 0;
      font-size: 18px;
      font-weight: bold;
    }

    .share-content {
      max-height: 400px;
      overflow-y: auto;
      margin-bottom: 20px;
      text-align: left;
    }

    .share-item {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;

      img {
        width: 80px;
        height: 80px;
        border-radius: 8px;
        object-fit: cover;
        margin-right: 12px;
      }

      .share-item-info {
        flex: 1;
      }

      .share-item-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 4px;
          }

          .share-item-specs {
            font-size: 12px;
            color: #666;
            background-color: #f5f5f5;
            padding: 2px 8px;
            border-radius: 12px;
            margin: 4px 0;
            display: inline-block;
          }

          .share-item-quantity {
            font-size: 12px;
            color: #666;
          }
    }

    .share-remark {
      margin-top: 16px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;

      .share-remark-title {
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 8px;
      }

      .share-remark-content {
        font-size: 14px;
        color: #333;
      }
    }
  }
}
</style>
