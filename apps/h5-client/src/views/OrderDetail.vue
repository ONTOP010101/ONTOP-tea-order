<template>
  <div class="order-detail-page">
    <van-nav-bar :title="$t('order.detail')" left-arrow @click-left="$router.back()" />
    
    <van-loading v-if="loading" class="loading-container" />
    
    <div v-else-if="order" class="page-content">
      <div class="order-status card">
        <h2>{{ $t(`order.status${capitalize(order.status === 'preparing' ? 'processing' : order.status)}`) }}</h2>
        <van-button type="primary" size="mini" @click="showShareDialog" class="share-btn">
          {{ $t('order.share') }}
        </van-button>
      </div>

      <div class="order-items card">
        <div v-for="(item, idx) in order.items" :key="idx" class="order-item">
          <img :src="getImageUrl(item.image)" :alt="item.name" @error="handleImageError" />
          <div class="item-info">
            <div>{{ item.name }}</div>
            <!-- 显示规格组 -->
            <div v-if="item.specs?.text" class="item-specs">
              <span class="spec-item">{{ item.specs.text }}</span>
            </div>
            <div>x {{ item.quantity }}</div>
          </div>
        </div>
      </div>

      <div class="order-info card">
        <div class="remark-section">
          <div class="remark-label">{{ $t('order.remark') }}</div>
          <div class="remark-content" v-if="order.remark">{{ order.remark }}</div>
        </div>
      </div>

      <!-- 分享弹窗 -->
      <van-popup v-model:show="showSharePopup" position="center" :style="{ width: '90%', borderRadius: '12px' }">
        <div class="share-popup">
          <h3>{{ $t('order.share') }}</h3>
          <div class="share-content">
            <div v-for="(item, idx) in order.items" :key="idx" class="share-item">
              <img :src="getImageUrl(item.image)" :alt="item.name" @error="handleImageError" />
              <div class="share-item-info">
                <div class="share-item-name">{{ item.name }}</div>
                <!-- 显示规格组 -->
                <div v-if="item.specs?.text" class="share-item-specs">{{ item.specs.text }}</div>
                <div class="share-item-quantity">{{ $t('order.quantity') }}: {{ item.quantity }}</div>
              </div>
            </div>
            <div class="share-remark" v-if="order.remark">
              <div class="share-remark-title">{{ $t('order.remark') }}:</div>
              <div class="share-remark-content">{{ order.remark }}</div>
            </div>
          </div>
          <van-button type="primary" block @click="closeShareDialog">{{ $t('common.confirm') }}</van-button>
        </div>
      </van-popup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getOrderDetail } from '@/api/order'
import { useI18n } from 'vue-i18n'
import type { Order } from '@/types'

const route = useRoute()
const order = ref<Order | null>(null)
const loading = ref(true)
const showSharePopup = ref(false)
const { t } = useI18n()

const showShareDialog = () => {
  showSharePopup.value = true
}

const closeShareDialog = () => {
  showSharePopup.value = false
}

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
  // 如果是相对路径，添加/uploads/前缀
  return `/uploads/${image}`
}

// 图片加载失败处理
const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.src = getPlaceholderImage()
}

const loadOrder = async () => {
  try {
    loading.value = true
    const id = route.params.id as string
    order.value = await getOrderDetail(id)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
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

onMounted(() => {
  loadOrder()
})
</script>

<style scoped lang="scss">
.order-detail-page {
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

  .order-status {
    text-align: center;
    padding: 16px;

    .share-btn {
      margin: 0;
    }
  }

  .order-items {
    .order-item {
        display: flex;
        align-items: flex-start;
        padding: 16px;
        margin-bottom: 12px;
        border-radius: var(--border-radius);
        background-color: #fafafa;
        box-shadow: var(--shadow-sm);

        &:last-child {
          margin-bottom: 0;
        }

        img {
          width: 80px;
          height: 80px;
          border-radius: 8px;
          object-fit: cover;
          margin-right: 16px;
          flex-shrink: 0;
        }

        .item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .item-info > div:first-child {
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
          margin: 6px 0;
        }

        .spec-item {
          font-size: 13px;
          color: var(--text-secondary);
          background-color: #e5e7eb;
          padding: 4px 10px;
          border-radius: 16px;
          font-weight: 500;
        }

        .item-info > div:last-child {
          font-size: 15px;
          color: var(--title-color);
          font-weight: 600;
          margin-top: 6px;
        }
      }
  }

  .order-info {
    padding: 20px;

    .remark-section {
      margin-top: 10px;
    }

    .remark-label {
      font-size: 16px;
      font-weight: bold;
      color: var(--title-color);
      margin-bottom: 12px;
    }

    .remark-content {
      font-size: 18px;
      line-height: 1.8;
      color: var(--text-color);
      background-color: var(--bg-color);
      padding: 16px;
      border-radius: var(--border-radius);
      min-height: 120px;
      white-space: pre-wrap;
      word-break: break-word;
    }
  }

  /* 分享弹窗样式 */
  .share-popup {
    padding: 16px;
    background: white;
    border-radius: 12px;
    text-align: center;

    h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: bold;
      color: var(--title-color);
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
      background: #f8f9fa;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
      text-align: center;

      img {
        width: 40px;
        height: 40px;
        border-radius: 3px;
        object-fit: cover;
        margin-right: 0;
        margin-bottom: 6px;
        border: 1px solid #e9ecef;
      }

      .share-item-info {
        flex: 1;
        width: 100%;
      }

      .share-item-name {
        font-size: 12px;
        font-weight: bold;
        color: var(--title-color);
        margin-bottom: 2px;
        line-height: 1.2;
      }

      .share-item-specs {
        font-size: 10px;
        color: var(--text-secondary);
        background-color: #f5f5f5;
        padding: 1px 6px;
        border-radius: 8px;
        margin: 2px 0;
        display: inline-block;
      }

      .share-item-quantity {
        font-size: 10px;
        color: var(--text-secondary);
      }
    }

    .share-remark {
      margin-top: 12px;
      padding: 10px;
      background: #f8f9fa;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);

      .share-remark-title {
        font-size: 12px;
        font-weight: bold;
        color: var(--title-color);
        margin-bottom: 6px;
      }

      .share-remark-content {
        font-size: 12px;
        color: var(--text-color);
        line-height: 1.4;
      }
    }
  }
}
</style>
