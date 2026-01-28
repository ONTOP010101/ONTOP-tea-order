<template>
  <div class="product-card" @click="$emit('click')">
    <div class="product-image">
      <img 
        :src="getImageUrl(product.image || product.images)" 
        :alt="getProductName(product)" 
        @error="handleImageError"
        loading="lazy"
      />
      <!-- 售罄标识 -->
      <div v-if="product.stock <= 0" class="sold-out-overlay">
        <div class="sold-out-text">{{ $t('product.soldOut') }}</div>
      </div>
      <div v-if="product.tags?.length" class="product-tags">
        <span v-for="tag in product.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>
    </div>
    <div class="product-info">
      <div class="product-name">{{ getProductName(product) }}</div>
      <div class="product-desc">{{ getProductDescription(product) }}</div>
      <div class="product-footer">
        <div class="price-box">
          <span class="price">¥{{ parseFloat((typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0).toFixed(2)) }}</span>
          <span v-if="product.originalPrice" class="original-price">
            ¥{{ parseFloat((typeof product.originalPrice === 'number' ? product.originalPrice : parseFloat(product.originalPrice) || 0).toFixed(2)) }}
          </span>
        </div>
        <div class="product-actions">
          <!-- 如果商品有规格组 -->
          <div v-if="product.has_specs">
            <!-- 库存为0时显示已售罄 -->
            <div 
              v-if="product.stock <= 0" 
              class="sold-out-btn" 
            >
              {{ $t('product.soldOut') }}
            </div>
            <!-- 有库存时显示选规格 -->
            <div 
              v-else
              class="select-spec-btn" 
              @click="goProductDetail"
            >
              {{ $t('product.selectSpec') }}
            </div>
          </div>
          <!-- 否则显示加号按钮或已售罄 -->
          <template v-else>
            <!-- 库存为0时显示已售罄 -->
            <div 
              v-if="product.stock <= 0" 
              class="sold-out-btn" 
            >
              {{ $t('product.soldOut') }}
            </div>
            <!-- 有库存时显示加号按钮 -->
            <div 
              v-else
              class="add-to-cart-btn" 
              @click="addToCart"
            >
              <van-icon name="plus" size="16" />
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '@/types'
import { useI18n } from 'vue-i18n'
import { useCartStore } from '@/stores/cart'
import { showToast } from 'vant'

const { t, locale } = useI18n()
const cartStore = useCartStore()

const props = defineProps<{
  product: Product
}>()

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'add-to-cart', x: number, y: number, product: any): void
}>()

// 添加到购物车
const addToCart = (e: Event) => {
  e.stopPropagation() // 阻止事件冒泡到卡片点击
  
  // 检查库存
  if (props.product.stock <= 0) {
    showToast(t('product.soldOut'))
    return
  }
  
  // 获取点击位置
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2
  
  // 触发动画事件
  emit('add-to-cart', x, y, props.product)
  
  // 使用 getImageUrl 函数处理图片路径
  let imageUrl = ''
  
  // 优先使用product.image字段
  if (props.product.image && typeof props.product.image === 'string' && props.product.image.trim() !== '') {
    imageUrl = getImageUrl(props.product.image)
  } 
  // 处理images字段（可能是数组、对象或字符串）
  else if (props.product.images) {
    imageUrl = getImageUrl(props.product.images)
  }
  
  // 测试：如果没有图片，使用默认图片
  if (!imageUrl) {
    // 使用一个占位图片，确保动画中能看到图片
    imageUrl = 'https://via.placeholder.com/60x60/ff6b6b/ffffff?text=+'
  }
  
  cartStore.addItem({
    id: `${props.product.id}-${Date.now()}`,
    productId: props.product.id,
    name: getProductName(props.product),
    image: imageUrl,
    price: props.product.price || 0,
    quantity: 1,
    selected: true,
    specs: {}
  })
  showToast(t('cart.addSuccess'))
}

// 跳转到商品详情页
const goProductDetail = (e: Event) => {
  e.stopPropagation() // 阻止事件冒泡到卡片点击
  emit('click')
}

// 获取多语言占位图SVG
const getPlaceholderImage = () => {
  const text = t('product.noImage')
  // 生成base64编码的SVG，显示当前语言的"暂无图片"
  const svg = `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#f5f5f5"/><text x="50%" y="50%" font-size="16" fill="#999" text-anchor="middle" dy=".3em">${text}</text></svg>`
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
}

// 获取图片URL，使用多语言占位图
const getImageUrl = (images: string[] | null | string) => {
  // 如果是字符串，直接使用（处理product.image字段）
  if (typeof images === 'string' && images.trim() !== '') {
    const imageUrl = images
    
    // 如果是相对路径，确保以/uploads/开头，通过Vite的/uploads代理访问
    if (!imageUrl.startsWith('http')) {
      if (imageUrl.startsWith('/uploads/')) {
        return imageUrl
      }
      if (imageUrl.startsWith('uploads/')) {
        return `/${imageUrl}`
      }
      return `/uploads/${imageUrl}`
    }
    return imageUrl
  }
  
  // 处理images数组
  if (Array.isArray(images) && images.length > 0 && images[0] && images[0].trim() !== '') {
    const imageUrl = images[0]
    
    // 如果是相对路径，确保以/uploads/开头，通过Vite的/uploads代理访问
    if (!imageUrl.startsWith('http')) {
      if (imageUrl.startsWith('/uploads/')) {
        return imageUrl
      }
      if (imageUrl.startsWith('uploads/')) {
        return `/${imageUrl}`
      }
      return `/uploads/${imageUrl}`
    }
    return imageUrl
  }
  return getPlaceholderImage()
}

// 获取产品名称（支持多语言字段）
const getProductName = (product: Product) => {
  if (locale.value === 'en-US' && product.name_en) {
    return product.name_en
  }
  if (locale.value === 'ar-SA' && product.name_ar) {
    return product.name_ar
  }
  if (locale.value === 'es-ES' && product.name_es) {
    return product.name_es
  }
  if (locale.value === 'pt-BR' && product.name_pt) {
    return product.name_pt
  }
  return product.name || t('product.noName')
}

// 获取产品描述（支持多语言字段）
const getProductDescription = (product: Product) => {
  // 确保product和product.description存在
  if (!product) return t('product.noDescription')
  
  // 根据当前语言返回对应的翻译
  switch (locale.value) {
    case 'en-US':
      return product.description_en || product.description || t('product.noDescription')
    case 'ar-SA':
      return product.description_ar || product.description || t('product.noDescription')
    case 'es-ES':
      return product.description_es || product.description || t('product.noDescription')
    case 'pt-BR':
      return product.description_pt || product.description || t('product.noDescription')
    default:
      return product.description || t('product.noDescription')
  }
}

// 图片加载失败处理
const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.src = getPlaceholderImage()
}
</script>

<style scoped lang="scss">
.product-card {
  background: white;
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.2s;
  position: relative;

  &:active {
    transform: scale(0.98);
  }

  .product-image {
    width: 100%;
    height: 150px;
    position: relative;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* 售罄覆盖层 */
    .sold-out-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2; /* 降低z-index值，确保只在卡片内部显示 */

      .sold-out-text {
        color: white;
        font-size: 28px; /* 减小字体大小，避免溢出 */
        font-weight: bold;
        transform: rotate(-20deg);
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      }
    }

    .product-tags {
      position: absolute;
      top: 8px;
      left: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      z-index: 5;

      .tag {
        background: rgba(155, 204, 12, 0.9);
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
      }
    }

    /* 添加到购物车按钮 - 与Category.vue样式统一 */
    .add-to-cart-btn {
      position: absolute;
      bottom: 10px;
      right: 10px;
      width: 28px;
      height: 28px;
      background: var(--primary-color);
      color: #ffffff;
      border: none;
      border-radius: 8px; /* 方形+圆角 */
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(238, 10, 36, 0.3);
      transition: all 0.2s ease;
      overflow: hidden;

      &:hover {
        background: #d40a1e;
        transform: scale(1.05);
        box-shadow: 0 3px 8px rgba(238, 10, 36, 0.4);
      }

      &:active {
        transform: scale(0.95);
      }

      /* 禁用状态 - 已售罄 */
      &.disabled {
        background: #ffd700;
        color: #333333;
        box-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);
        cursor: not-allowed;
        opacity: 1;

        &:hover {
          transform: none;
          box-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);
        }

        &:active {
          transform: none;
        }
      }
    }
  }

  .product-info {
    padding: 12px;

    .product-name {
      font-size: 14px;
      font-weight: bold;
      color: var(--title-color);
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .product-desc {
      font-size: 12px;
      color: var(--text-secondary);
      margin-bottom: 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .product-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .price-box {
          .price {
            font-size: 18px;
            font-weight: bold;
            color: var(--primary-color);
          }

          .original-price {
            font-size: 12px;
            color: var(--text-disabled);
            text-decoration: line-through;
            margin-left: 4px;
          }
        }

        .product-actions {
          display: flex;
          align-items: center;
        }

        /* 选规格按钮 - 与Category.vue样式统一 */
        .select-spec-btn {
          min-width: 76px !important;
          width: auto !important;
          height: 26px !important;
          background: var(--primary-color) !important;
          color: #ffffff !important;
          border: none !important;
          border-radius: 13px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          box-shadow: 0 2px 6px rgba(238, 10, 36, 0.3) !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
          margin-top: auto;
          padding: 0 12px !important;
          align-self: flex-end;
          min-width: auto;
          white-space: nowrap;

          &:hover {
            background: #d40a1e !important;
            transform: translateY(-1px);
            box-shadow: 0 3px 8px rgba(238, 10, 36, 0.4);
          }

          &:active {
            transform: translateY(0);
          }
        }

        /* 已售罄按钮样式 - 与Category.vue样式统一 */
        .sold-out-btn {
          width: 76px !important;
          height: 26px !important;
          background: #FFD700 !important; /* 黄色背景 */
          color: #333333 !important;
          border: none !important;
          border-radius: 13px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          cursor: not-allowed !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
          opacity: 0.8;
          transition: all 0.2s ease !important;
          box-sizing: border-box !important;
        }

        /* 添加到购物车按钮 - 与Category.vue样式统一 */
        .add-to-cart-btn {
          width: 28px !important;
          height: 28px !important;
          background: var(--primary-color) !important;
          color: #ffffff !important;
          border: none !important;
          border-radius: 8px !important; /* 方形+圆角 */
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 18px !important;
          font-weight: 500 !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          box-shadow: 0 2px 6px rgba(238, 10, 36, 0.3) !important;
          overflow: hidden !important;
          border: none !important;
          box-sizing: border-box !important;
          line-height: 1;

          &:hover {
            background: #d40a1e !important;
            transform: scale(1.05);
            box-shadow: 0 3px 8px rgba(238, 10, 36, 0.4);
          }

          &:active {
            transform: scale(0.95);
          }

          /* 禁用状态 - 已售罄 */
          &.disabled {
            background: #FFD700 !important; /* 黄色背景 */
            color: #333333 !important;
            box-shadow: 0 2px 4px rgba(255, 215, 0, 0.3) !important;
            cursor: not-allowed !important;
            opacity: 1;

            &:hover {
              transform: none !important;
              box-shadow: 0 2px 4px rgba(255, 215, 0, 0.3) !important;
            }

            &:active {
              transform: none !important;
            }
          }
        }
      }
  }
}
</style>
