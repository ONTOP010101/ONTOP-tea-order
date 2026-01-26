<template>
  <div class="product-detail-page">
    <van-nav-bar :title="$t('product.detail')" left-arrow @click-left="$router.back()" />

    <van-loading v-if="loading" class="loading-container" />

    <template v-else-if="product">
      <!-- 商品图片 -->
      <div class="product-image-section">
        <van-swipe class="product-swipe" :autoplay="3000">
          <van-swipe-item v-for="(image, index) in getProductImages(product)" :key="index">
            <img 
            :src="image" 
            :alt="product.name" 
            @error="handleImageError" 
            loading="lazy"
          />
            <!-- 售罄标识 -->
            <div v-if="product.stock <= 0" class="sold-out-overlay">
              <div class="sold-out-text">{{ $t('product.soldOut') }}</div>
            </div>
          </van-swipe-item>
        </van-swipe>
      </div>

      <!-- 商品信息 -->
      <div class="product-info-section">
        <div class="name-container">
          <h2 class="product-name">{{ productName }}</h2>
          <div class="stock-info">
            <span v-if="product.stock > 0">{{ $t('product.stock') }}: {{ product.stock }}</span>
            <span v-else class="sold-out-text">{{ $t('product.soldOut') }}</span>
            <span>{{ $t('product.sold') }} {{ product.soldCount }}</span>
          </div>
        </div>
        <!-- 商品描述 -->
        <div class="product-desc-section">
          <p class="desc-content">{{ productDescription }}</p>
        </div>
        <div class="product-tags" v-if="product.tags?.length">
          <van-tag v-for="tag in product.tags" :key="tag" type="success">{{ tag }}</van-tag>
        </div>
      </div>

      <!-- 规格选择 -->
      <div class="product-specs-section" v-if="specGroups.length > 0">
        <div class="spec-group" v-for="group in specGroups" :key="group.id">
          <div class="spec-group-header">
            <h4>{{ getSpecGroupName(group) }}</h4>
            <span v-if="group.isRequired" class="required-mark">*</span>
          </div>
          <div class="spec-items-container">
            <div class="spec-items">
              <div
                v-for="item in group.items"
                :key="item.id"
                class="spec-item-card"
                :class="{ 'spec-item-selected': isItemSelected(group.id, item.id) }"
                @click="selectSpecItem(group, item)"
                :disabled="product.stock <= 0"
              >
                <div class="spec-item-content">
                  <span class="spec-item-value">{{ getSpecItemValue(item) }}</span>
                  <span v-if="item.price > 0" class="spec-item-price">+¥{{ parseFloat((typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0).toFixed(2)) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 规格矩阵区域 -->
      <div class="spec-matrix" v-if="hasSelectedSpecs || specGroups.length > 0">
        <div class="spec-info">
          <div class="spec-text">{{ getSelectedSpecsText() }}</div>
        </div>
        <div class="quantity-control">
          <button class="quantity-btn" @click="decreaseQuantity" :disabled="quantity <= 1">-</button>
          <span class="quantity">{{ quantity }}</span>
          <button class="quantity-btn" @click="increaseQuantity">+</button>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="bottom-action-bar">
        <div class="cart-btn" @click="goCart">
          <van-icon name="cart-o" size="24" />
          <span class="btn-text">{{ $t('nav.cart') }}</span>
        </div>
        <div class="action-buttons">
          <!-- 直接在模板中检查路由参数，不依赖JS变量 -->
          <!-- 调试信息：显示当前编辑模式状态 -->
          <div style="display: none;">路由参数edit: {{ route.query.edit }}, isEditMode: {{ isEditMode }}, 库存: {{ product?.stock }}</div>
          
          <!-- 使用isEditMode变量判断编辑模式 -->
          <template v-if="isEditMode">
            <!-- 库存为0时显示已售罄 -->
            <div v-if="product && product.stock <= 0" class="sold-out-btn">
              {{ $t('product.soldOut') }}
            </div>
            <!-- 有库存时显示修改保存按钮 -->
            <button 
              v-else
              class="save-edit-btn" 
              @click="addToCart"
            >
              修改保存
            </button>
          </template>
          <!-- 正常模式 -->
          <template v-else>
            <!-- 库存为0时显示已售罄 -->
            <div v-if="product && product.stock <= 0" class="sold-out-btn">
              {{ $t('product.soldOut') }}
            </div>
            <!-- 有库存时显示正常按钮 -->
            <template v-else>
              <button 
                class="add-to-cart-btn" 
                @click="addToCart"
              >
                {{ $t('product.addToCart') }}
              </button>
              <button 
                class="buy-now-btn" 
                @click="buyNow"
              >
                {{ $t('product.buyNow') }}
              </button>
            </template>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { getProductDetail, getProductSpecGroups } from '@/api/product'
import { useCartStore } from '@/stores/cart'
import { useI18n } from 'vue-i18n'
import { formatPrice } from '@/utils/format'
import type { Product } from '@/types'

const router = useRouter()
const route = useRoute()
const cartStore = useCartStore()
const { t, locale } = useI18n()

// 数据
const product = ref<Product | null>(null)
const loading = ref(true)
const specGroups = ref<any[]>([])
const specSelections = ref<Record<number, number[]>>({})
const loadingSpecs = ref(false)
const quantity = ref(1)

// 编辑模式相关
// 从路由参数获取编辑模式状态
const getEditModeFromRoute = () => {
  return String(route.query.edit).toLowerCase() === 'true'
}

// 从路由参数获取购物车项ID
const getCartItemIdFromRoute = () => {
  return typeof route.query.cartItemId === 'string' ? route.query.cartItemId : null
}

// 直接在组件实例创建时初始化编辑模式，确保模板渲染时就能获取正确状态
const isEditMode = ref(getEditModeFromRoute())
const cartItemId = ref<string | null>(getCartItemIdFromRoute())

// 初始化编辑模式函数，用于后续更新
const initEditMode = () => {
  isEditMode.value = getEditModeFromRoute()
  cartItemId.value = getCartItemIdFromRoute()
}

// 获取多语言占位图SVG
const getPlaceholderImage = () => {
  const text = t('product.noImage')
  const svg = `<svg width="375" height="375" xmlns="http://www.w3.org/2000/svg"><rect width="375" height="375" fill="#f5f5f5"/><text x="50%" y="50%" font-size="20" fill="#999" text-anchor="middle" dy=".3em">${text}</text></svg>`
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
}

// 获取商品图片，处理null情况
const getProductImages = (product: Product) => {
  if (product.images && product.images.length > 0) {
    return product.images.map(image => {
      if (image && !image.startsWith('http')) {
        if (image.startsWith('/uploads/')) {
          return image
        }
        if (image.startsWith('uploads/')) {
          return `/${image}`
        }
        return `/uploads/${image}`
      }
      return image
    })
  }
  return [getPlaceholderImage()]
}

// 图片加载失败处理
const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.src = getPlaceholderImage()
}

// 获取多语言商品名称
const productName = computed(() => {
  if (!product.value) return ''
  if (locale.value === 'en-US' && product.value.name_en) {
    return product.value.name_en
  }
  if (locale.value === 'ar-SA' && product.value.name_ar) {
    return product.value.name_ar
  }
  if (locale.value === 'es-ES' && product.value.name_es) {
    return product.value.name_es
  }
  if (locale.value === 'pt-BR' && product.value.name_pt) {
    return product.value.name_pt
  }
  return product.value.name || t('product.noName')
})

// 获取多语言商品描述
const productDescription = computed(() => {
  if (!product.value) return t('product.noDescription')
  if (locale.value === 'en-US' && product.value.description_en) {
    return product.value.description_en
  }
  if (locale.value === 'ar-SA' && product.value.description_ar) {
    return product.value.description_ar
  }
  if (locale.value === 'es-ES' && product.value.description_es) {
    return product.value.description_es
  }
  if (locale.value === 'pt-BR' && product.value.description_pt) {
    return product.value.description_pt
  }
  return product.value.description || t('product.noDescription')
})

// 加载商品规格组数据
const loadSpecGroups = async (productId: string) => {
  try {
    loadingSpecs.value = true
    const groups = await getProductSpecGroups(productId)
    specGroups.value = groups
    // 初始化规格选择
    specSelections.value = {}
    
    // 所有规格组默认选择第一个规格项，无论是否必选
    for (const group of groups) {
      // 如果规格组有选项，默认选择第一个规格项
      if (group.items && group.items.length > 0) {
        specSelections.value[group.id] = [group.items[0]?.id || '']
      }
    }
  } catch (error: any) {
    showToast(t('common.error'))
  } finally {
    loadingSpecs.value = false
  }
}

// 加载商品数据
const loadProduct = async () => {
  try {
    loading.value = true
    const id = route.params.id as string
    const productData = await getProductDetail(id)
    product.value = productData
    // 加载规格组数据
    await loadSpecGroups(id)
    
    // 处理购物车项信息的加载
    if (isEditMode.value && cartItemId.value) {
      console.log('进入编辑模式，cartItemId:', cartItemId.value)
      // 获取当前购物车项信息，设置初始规格和数量
      const cartItem = cartStore.items.find(item => item.id === cartItemId.value)
      if (cartItem) {
        console.log('找到购物车项:', cartItem)
        quantity.value = cartItem.quantity
        // 如果有规格信息，尝试恢复规格选择
        if (cartItem.specs && cartItem.specs.selected) {
          specSelections.value = cartItem.specs.selected
        }
      } else {
        console.error('未找到购物车项:', cartItemId.value)
        // 即使找不到购物车项，也保持编辑模式
        // 这样用户仍然可以看到"修改保存"按钮
      }
    }
  } catch (error: any) {
    showToast(t('common.error'))
  } finally {
    loading.value = false
  }
}

// 选择规格项
const selectSpecItem = (group: any, item: any) => {
  if (!specSelections.value[group.id]) {
    specSelections.value[group.id] = []
  }
  
  if (group.isMultiple) {
    // 多选模式
    const index = specSelections.value[group.id].indexOf(item.id)
    if (index > -1) {
      specSelections.value[group.id].splice(index, 1)
    } else {
      specSelections.value[group.id].push(item.id)
    }
  } else {
    // 单选模式
    specSelections.value[group.id] = [item.id]
  }
}

// 获取多语言规格组名称
const getSpecGroupName = (group: any) => {
  console.log('getSpecGroupName called with:', { locale: locale.value, group })
  
  // 辅助函数：检查翻译值是否有效（非空字符串）
  const isTranslationValid = (translation: any) => {
    return typeof translation === 'string' && translation.trim() !== ''
  }
  
  // 获取翻译值，支持驼峰式和蛇形命名
  const getNameEn = () => group.name_en || group.nameEn
  const getNameAr = () => group.name_ar || group.nameAr
  const getNameEs = () => group.name_es || group.nameEs
  const getNamePt = () => group.name_pt || group.namePt
  const getNameZh = () => group.name_zh || group.nameZh || group.name_cn || group.nameCn || group.name
  
  // 优先使用当前语言的翻译
  if (locale.value === 'en-US' && isTranslationValid(getNameEn())) {
    return getNameEn()
  }
  if (locale.value === 'ar-SA' && isTranslationValid(getNameAr())) {
    return getNameAr()
  }
  if (locale.value === 'es-ES' && isTranslationValid(getNameEs())) {
    return getNameEs()
  }
  if (locale.value === 'pt-BR' && isTranslationValid(getNamePt())) {
    return getNamePt()
  }
  // 添加对中文语言环境的全面支持，包括zh-CN, zh-TW, zh
  if (locale.value.startsWith('zh') && isTranslationValid(getNameZh())) {
    return getNameZh()
  }
  
  // 当前语言没有翻译时，优先使用英文作为备选
  if (isTranslationValid(getNameEn())) {
    return getNameEn()
  }
  
  // 最后回退到默认名称
  return group.name || ''
}

// 获取多语言规格项值
const getSpecItemValue = (item: any) => {
  console.log('getSpecItemValue called with:', { locale: locale.value, item })
  
  // 辅助函数：检查翻译值是否有效（非空字符串）
  const isTranslationValid = (translation: any) => {
    return typeof translation === 'string' && translation.trim() !== ''
  }
  
  // 获取翻译值，支持驼峰式和蛇形命名
  const getValueEn = () => item.value_en || item.valueEn
  const getValueAr = () => item.value_ar || item.valueAr
  const getValueEs = () => item.value_es || item.valueEs
  const getValuePt = () => item.value_pt || item.valuePt
  const getValueZh = () => item.value_zh || item.valueZh || item.value_cn || item.valueCn || item.value
  
  // 优先使用当前语言的翻译
  if (locale.value === 'en-US' && isTranslationValid(getValueEn())) {
    return getValueEn()
  }
  if (locale.value === 'ar-SA' && isTranslationValid(getValueAr())) {
    return getValueAr()
  }
  if (locale.value === 'es-ES' && isTranslationValid(getValueEs())) {
    return getValueEs()
  }
  if (locale.value === 'pt-BR' && isTranslationValid(getValuePt())) {
    return getValuePt()
  }
  // 添加对中文语言环境的全面支持，包括zh-CN, zh-TW, zh
  if (locale.value.startsWith('zh') && isTranslationValid(getValueZh())) {
    return getValueZh()
  }
  
  // 当前语言没有翻译时，优先使用英文作为备选
  if (isTranslationValid(getValueEn())) {
    return getValueEn()
  }
  
  // 最后回退到默认值
  return item.value || ''
}

// 检查规格项是否被选择
const isItemSelected = (groupId: number, itemId: number) => {
  return specSelections.value[groupId]?.includes(itemId) || false
}

// 检查规格选择是否完整
const checkSpecSelection = () => {
  for (const group of specGroups.value) {
    if (group.isRequired) {
      const selectedCount = specSelections.value[group.id]?.length || 0
      if (selectedCount === 0) {
        showToast(`${getSpecGroupName(group)} ${t('product.required')}`)
        return false
      }
    }
  }
  return true
}

// 数量控制方法
const increaseQuantity = () => {
  quantity.value++
}

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

// 获取选中的规格文本
const getSelectedSpecsText = () => {
  let text = productName.value
  const separator = ' +' // 规格分隔符，可根据需要添加翻译支持
  for (const group of specGroups.value) {
    const selectedIds = specSelections.value[group.id] || []
    if (selectedIds.length > 0) {
      const selectedItems = group.items.filter((item: any) => selectedIds.includes(item.id))
      // 只显示规格项值，不显示规格组名称，保持简洁
      const itemValues = selectedItems.map((item: any) => getSpecItemValue(item)).join(', ')
      text += `${separator}${itemValues}`
    }
  }
  return text
}

// 检查是否有选中的规格
const hasSelectedSpecs = computed(() => {
  for (const group of specGroups.value) {
    if (specSelections.value[group.id]?.length > 0) {
      return true
    }
  }
  return false
})

// 计算商品总价
const totalPrice = computed(() => {
  if (!product.value) return 0
  let price = product.value.price || 0
  
  // 计算规格价格
  for (const group of specGroups.value) {
    const selectedItemIds = specSelections.value[group.id] || []
    for (const item of group.items) {
      if (selectedItemIds.includes(item.id)) {
        price += item.price || 0
      }
    }
  }
  
  return formatPrice(price)
})

const addToCart = () => {
  if (!product.value) return
  if (product.value.stock <= 0) {
    showToast(t('product.soldOut'))
    return
  }
  
  // 检查规格选择
  if (specGroups.length > 0 && !checkSpecSelection()) {
    return
  }
  
  // 直接从产品的images数组中获取第一张图片URL
  let imageUrl = ''
  if (product.value.images && product.value.images.length > 0) {
    const firstImage = Array.isArray(product.value?.images) && product.value.images.length > 0 ? product.value.images[0] : ''
    if (firstImage && firstImage.trim() !== '') {
      imageUrl = firstImage.startsWith('/') ? firstImage : `/${firstImage}`
    }
  }
  
  // 构建规格文本和值
  const specs = {
    selected: specSelections.value,
    text: getSpecText()
  }
  
  if (isEditMode.value && cartItemId.value) {
    // 编辑模式：更新购物车项
    cartStore.updateItem(cartItemId.value, {
      name: productName.value,
      image: imageUrl,
      price: totalPrice.value,
      quantity: quantity.value,
      specs
    })
    showToast(t('cart.updateSuccess'))
    // 更新后直接返回分类页，方便用户查看更新后的购物车
    router.push('/category')
  } else {
    // 正常模式：添加到购物车
    cartStore.addItem({
      id: `${product.value.id}-${JSON.stringify(specSelections.value)}-${Date.now()}`,
      productId: product.value.id,
      name: productName.value,
      image: imageUrl,
      price: totalPrice.value,
      quantity: quantity.value,
      selected: true,
      specs
    })
    showToast(t('cart.addSuccess'))
  }
}

// 获取规格文本
const getSpecText = () => {
  let text = ''
  for (const group of specGroups.value) {
    const selectedIds = specSelections.value[group.id] || []
    if (selectedIds.length > 0) {
      const selectedItems = group.items.filter((item: any) => selectedIds.includes(item.id))
      const itemValues = selectedItems.map((item: any) => getSpecItemValue(item)).join(', ')
      text += `${getSpecGroupName(group)}: ${itemValues}; `
    }
  }
  return text.trim().replace(/;$/, '')
}

const buyNow = () => {
  addToCart()
  router.push('/cart')
}

const goCart = () => {
  router.push('/cart')
}

onMounted(() => {
  // 先初始化编辑模式，然后再加载商品
  // 这样可以确保在加载商品之前就已经进入编辑模式
  initEditMode()
  loadProduct()
})

// 监听路由参数变化，重新检查编辑模式
watch(
  () => route.query,
  (newQuery) => {
    console.log('路由参数变化，重新检查编辑模式:', newQuery)
    // 重新初始化编辑模式
    isEditMode.value = String(newQuery.edit).toLowerCase() === 'true'
    cartItemId.value = typeof newQuery.cartItemId === 'string' ? newQuery.cartItemId : null
    
    if (isEditMode.value && cartItemId.value) {
      console.log('进入编辑模式，cartItemId:', cartItemId.value)
      // 获取当前购物车项信息，设置初始规格和数量
      const cartItem = cartStore.items.find(item => item.id === cartItemId.value)
      if (cartItem) {
        console.log('找到购物车项:', cartItem)
        quantity.value = cartItem.quantity
        // 如果有规格信息，尝试恢复规格选择
        if (cartItem.specs && cartItem.specs.selected) {
          specSelections.value = cartItem.specs.selected
        }
      } else {
        console.error('未找到购物车项:', cartItemId.value)
        // 即使找不到购物车项，也保持编辑模式
        // 这样用户仍然可以看到"修改保存"按钮
      }
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.product-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 60px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;

  /* 固定导航栏样式 */
  .van-nav-bar {
    position: sticky;
    top: 0;
    z-index: 1000;
    background-color: #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  /* 商品图片区域 */
  .product-image-section {
    width: 100%;
    background: #fff;
    margin-bottom: 12px;

    .product-swipe {
      width: 100%;
      height: 280px;
      position: relative;
      overflow: hidden;
      background: #fff;

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
        z-index: 2; /* 确保只在图片内部显示 */

        .sold-out-text {
          color: white;
          font-size: 28px;
          font-weight: bold;
          transform: rotate(-20deg);
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }
      }
    }
  }

  /* 商品信息区域 */
  .product-info-section {
    width: 100%;
    background: #fff;
    padding: 16px;
    margin-bottom: 12px;

    .name-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      flex-wrap: nowrap;
      height: 40px;
    }

    .product-name {
      font-size: 24px;
      font-weight: bold;
      color: #333;
      margin: 0;
      line-height: 40px;
      flex: 1;
      margin-right: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .product-tags {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;

      :deep(.van-tag) {
        background: #fff5f5;
        color: #ff6b6b;
        border: 1px solid #ffd9d9;
        font-size: 12px;
        padding: 4px 10px;
      }
    }

    .stock-info {
      display: flex;
      gap: 12px;
      font-size: 14px;
      color: #666;
      padding: 0;
      border-top: none;
      flex-shrink: 0;
      align-items: center;
      height: 100%;
    }

    .sold-out-text {
      color: #ff6b6b;
      font-weight: bold;
    }
  }

  /* 规格选择样式 */
  .product-specs-section {
    width: 100%;
    background: #fff;
    padding: 16px;
    margin-bottom: 12px;

    .spec-group {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      .spec-group-header {
        display: flex;
        align-items: center;
        margin-bottom: 12px;

        h4 {
          font-size: 16px;
          font-weight: bold;
          color: #333;
          margin: 0;
        }

        .required-mark {
          color: #ff6b6b;
          margin-left: 6px;
          font-size: 16px;
        }
      }

      .spec-items-container {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        &::-webkit-scrollbar {
          display: none;
        }
      }

      .spec-items {
        display: flex;
        gap: 12px;
        padding-bottom: 4px;

        .spec-item-card {
          flex-shrink: 0;
          min-width: 80px;
          max-width: 120px;
          padding: 8px 12px;
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          opacity: 1;

          &:hover {
            border-color: #ff6b6b;
          }

          &.spec-item-selected {
            background: #ff6b6b;
            color: #fff;
            border-color: #ff6b6b;
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .spec-item-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;

            .spec-item-value {
              font-size: 13px;
              font-weight: 500;
            }

            .spec-item-price {
              font-size: 11px;
              opacity: 0.8;
            }
          }
        }
      }
    }
  }

  /* 商品描述区域 */
  .product-desc-section {
    width: 100%;
    background: transparent;
    padding: 0 0 12px 0;
    margin: 0;
    overflow: hidden;

    .desc-content {
      font-size: 12px;
      color: #999;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  /* 规格矩阵样式 */
  .spec-matrix {
    position: fixed;
    bottom: 60px;
    left: 0;
    right: 0;
    background: #fff;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
    padding: 12px 16px;
    z-index: 999;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    border: 1px solid #ff6b6b;
    border-bottom: none;

    .spec-info {
      flex: 1;
      overflow: hidden;

      .spec-text {
        font-size: 14px;
        color: #333;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .quantity-control {
      display: flex;
      align-items: center;
      gap: 12px;

      .quantity-btn {
        width: 32px;
        height: 32px;
        border: 1px solid #e0e0e0;
        border-radius: 16px;
        background: #fff;
        font-size: 18px;
        font-weight: bold;
        color: #666;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;

        &:hover:not(:disabled) {
          border-color: #ff6b6b;
          color: #ff6b6b;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .quantity {
        font-size: 16px;
        font-weight: bold;
        color: #333;
        min-width: 24px;
        text-align: center;
      }
    }
  }

  /* 底部操作栏样式 */
  .bottom-action-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: #fff;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    padding: 0 16px;
    z-index: 1000;

    .cart-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 100%;
      cursor: pointer;
      color: #666;

      &:hover {
        color: #ff6b6b;
      }

      .btn-text {
        font-size: 12px;
        margin-top: 4px;
      }
    }

    .action-buttons {
      flex: 1;
      display: flex;
      gap: 12px;
      margin-left: 16px;

      button {
        flex: 1;
        height: 44px;
        border: none;
        border-radius: 22px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        
        /* 确保按钮内容居中 */
        display: flex;
        align-items: center;
        justify-content: center;

        &:disabled {
          opacity: 1;
          cursor: not-allowed;
          background: #FFD700 !important; /* 黄色背景 */
          color: transparent !important; /* 隐藏原有文字颜色 */
          border: none !important;
          box-shadow: 0 2px 4px rgba(255, 215, 0, 0.3) !important;
          
          /* 替换原有文字为已售罄 */
          &::after {
            content: '已售罄';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 16px;
            font-weight: bold;
            color: #333333 !important; /* 确保已售罄文字颜色正确 */
          }
        }
        
        /* 正常状态下不显示::after伪元素 */
        &::after {
          content: '';
          display: none;
        }
      }

      .add-to-cart-btn {
        background: #ffd93d;
        color: #333;

        &:hover:not(:disabled) {
          background: #ffc107;
        }
      }

      .buy-now-btn {
        background: #ff6b6b;
        color: #fff;

        &:hover:not(:disabled) {
          background: #ff5252;
        }
      }
      
      .save-edit-btn {
        background: #ff6b6b;
        color: #fff;

        &:hover:not(:disabled) {
          background: #ff5252;
        }
      }
      
      /* 已售罄按钮样式 */
      .sold-out-btn {
        flex: 1;
        height: 44px;
        background: #FFD700 !important; /* 黄色背景 */
        color: #333333 !important;
        border: none !important;
        border-radius: 22px !important;
        font-size: 16px;
        font-weight: bold;
        cursor: not-allowed !important;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(255, 215, 0, 0.3) !important;
        transition: all 0.3s ease;
        margin: 0;
        padding: 0;
      }
    }
  }
}
</style>
