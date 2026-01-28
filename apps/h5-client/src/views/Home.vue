<template>
  <div class="home-page">
    <!-- 顶部栏 -->
    <div class="top-bar">
      <div class="search-wrapper">
        <van-search
          v-model="searchValue"
          :placeholder="$t('home.searchPlaceholder')"
          @search="onSearch"
        />
      </div>
      <div class="language-switcher" @click="showLanguagePopup = true">
        <van-icon name="globe" size="20" />
        <span>{{ currentLanguageLabel }}</span>
      </div>
    </div>
    
    <!-- 加入购物车动画容器 -->
    <div class="addToCartAnimationContainer">
      <div
        v-for="item in animationItems"
        :key="item.id"
        class="addToCartAnimation"
        :style="{
          left: `${item.x}px`,
          top: `${item.y}px`,
          backgroundImage: item.image ? `url('${item.image}')` : 'none'
        }"
      ></div>
    </div>

    <!-- 语言选择弹窗 -->
    <van-popup v-model:show="showLanguagePopup" position="bottom" round>
      <van-picker
        :columns="languageOptions"
        :default-index="currentLanguageIndex"
        @confirm="onLanguageConfirm"
        @cancel="showLanguagePopup = false"
      />
    </van-popup>

    <!-- 轮播图 -->
    <van-swipe class="banner" :autoplay="3000" indicator-color="white">
      <van-swipe-item v-for="banner in banners" :key="banner.id">
        <img 
          :src="getBannerImageUrl(banner.image)" 
          :alt="banner.title" 
          loading="lazy"
        />
      </van-swipe-item>
    </van-swipe>

    <!-- 分类导航 -->
    <div class="category-nav">
      <div
        v-for="category in categories"
        :key="category.id"
        class="category-item"
        @click="goCategory(category.id)"
      >
        <div class="category-icon">
          <img 
            :src="getBannerImageUrl(category.icon)" 
            :alt="getCategoryName(category)" 
            loading="lazy"
          />
        </div>
        <div class="category-name">{{ getCategoryName(category) }}</div>
      </div>
    </div>

    <!-- 热销推荐 -->
    <div class="section">
      <div class="section-title">
        <span>{{ $t('home.hotSales') }}</span>
      </div>
      <div class="product-list">
        <product-card
          v-for="product in hotProducts"
          :key="product.id"
          :product="product"
          @click="goProductDetail(product.id)"
          @add-to-cart="handleAddToCart"
        />
      </div>
    </div>

    <!-- 新品上架 -->
    <div class="section">
      <div class="section-title">
        <span>{{ $t('home.newProducts') }}</span>
      </div>
      <div class="product-list">
        <product-card
          v-for="product in newProducts"
          :key="product.id"
          :product="product"
          @click="goProductDetail(product.id)"
          @add-to-cart="handleAddToCart"
        />
      </div>
    </div>

    <!-- 底部导航 -->
    <van-tabbar route>
      <van-tabbar-item to="/home" icon="home-o">
        {{ $t('nav.home') }}
      </van-tabbar-item>
      <van-tabbar-item to="/category" icon="apps-o">
        {{ $t('nav.category') }}
      </van-tabbar-item>
      <van-tabbar-item to="/cart" icon="cart-o" :badge="cartCount || ''">
        {{ $t('nav.cart') }}
      </van-tabbar-item>
      <van-tabbar-item to="/profile" icon="user-o">
        {{ $t('nav.profile') }}
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getCategoryList, getHotProducts, getNewProducts } from '@/api/product'
import { getActiveBanners } from '@/api/banner'
import { useCartStore } from '@/stores/cart'
import ProductCard from '@/components/ProductCard.vue'
import type { Category, Product } from '@/types'

const router = useRouter()
const cartStore = useCartStore()
const { locale, t } = useI18n()

// 获取分类名称 - 支持多语言
const getCategoryName = (category: Category) => {
  if (locale.value === 'en-US' && category.name_en) {
    return category.name_en
  }
  if (locale.value === 'ar-SA' && category.name_ar) {
    return category.name_ar
  }
  if (locale.value === 'es-ES' && category.name_es) {
    return category.name_es
  }
  if (locale.value === 'pt-BR' && category.name_pt) {
    return category.name_pt
  }
  return category.name
}

const active = ref(0)
const searchValue = ref('')
const showLanguagePopup = ref(false)

const languageOptions = [
  { text: '简体中文', value: 'zh-CN' },
  { text: 'English', value: 'en-US' },
  { text: 'العربية', value: 'ar-SA' },
  { text: 'Español', value: 'es-ES' },
  { text: 'Português', value: 'pt-BR' }
]

const currentLanguageLabel = computed(() => {
  const current = languageOptions.find(item => item.value === locale.value)
  return current?.text || '简体中文'
})

const currentLanguageIndex = computed(() => {
  return languageOptions.findIndex(item => item.value === locale.value)
})

const onLanguageConfirm = ({ selectedOptions }: any) => {
  const selected = Array.isArray(selectedOptions) && selectedOptions.length > 0 ? selectedOptions[0] : null
  if (selected && selected.value) {
    locale.value = selected.value
    localStorage.setItem('language', selected.value)
    
    // 设置RTL
    if (selected.value === 'ar-SA') {
      document.documentElement.setAttribute('dir', 'rtl')
    } else {
      document.documentElement.setAttribute('dir', 'ltr')
    }
    
    showLanguagePopup.value = false
  }
}

const banners = ref([])
const categories = ref<Category[]>([])
const hotProducts = ref<Product[]>([])
const newProducts = ref<Product[]>([])

const cartCount = computed(() => cartStore.totalCount)

// 动画相关
const animationItems = ref<Array<{id: string, x: number, y: number, image: string}>>([])

// 获取图片URL，确保路径正确
const getImageUrl = (image: any) => {
  if (!image) {
    // 如果没有图片，返回SVG占位符
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7mmoLml6Dlm77niYc8L3RleHQ+PC9zdmc+'
  }
  
  // 如果是字符串，直接处理
  if (typeof image === 'string' && image.trim() !== '') {
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
  
  // 如果是数组，使用第一个元素
  if (Array.isArray(image) && image.length > 0) {
    return getImageUrl(image[0])
  }
  
  // 如果是对象，尝试获取其中的图片路径
  if (typeof image === 'object') {
    // 尝试获取第一个属性值
    const firstValue = Object.values(image)[0]
    if (firstValue) {
      return getImageUrl(firstValue)
    }
  }
  
  // 如果所有尝试都失败，返回SVG占位符
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7mmoLml6Dlm77niYc8L3RleHQ+PC9zdmc+'
}

// 创建加入购物车动画
const createAddToCartAnimation = (x: number, y: number, product: Product) => {
  // 创建唯一ID
  const id = `${product.id}-${Date.now()}`
  
  // 获取产品图片，使用项目中已有的图片路径处理逻辑
  let imageUrl = ''
  
  // 优先使用product.image字段
  if (product?.image && typeof product.image === 'string' && product.image.trim() !== '') {
    imageUrl = getImageUrl(product.image)
  } 
  // 处理images字段（可能是数组、对象或字符串）
  else if (product?.images) {
    imageUrl = getImageUrl(product.images)
  }
  
  // 测试：如果没有图片，使用默认图片
  if (!imageUrl) {
    // 使用一个占位图片，确保动画中能看到图片
    imageUrl = 'https://via.placeholder.com/60x60/ff6b6b/ffffff?text=+'
  }
  
  // 创建动画元素对象
  const animationItem = {
    id,
    x,
    y,
    image: imageUrl
  }
  
  // 添加动画项
  animationItems.value.push(animationItem)
  
  // 1秒后移除动画项（与CSS动画时长匹配）
  setTimeout(() => {
    animationItems.value = animationItems.value.filter(item => item.id !== id)
  }, 1000)
}

// 从ProductCard接收添加到购物车事件
const handleAddToCart = (x: number, y: number, product: Product) => {
  createAddToCartAnimation(x, y, product)
}

// 获取轮播图图片URL
const getBannerImageUrl = (image: string) => {
  if (!image) return ''
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

const loadData = async () => {
  try {
    const [bannerRes, categoryRes, hotRes, newRes] = await Promise.all([
      getActiveBanners(),
      getCategoryList(),
      getHotProducts(8),
      getNewProducts(8)
    ])
    banners.value = bannerRes || []
    categories.value = categoryRes.slice(0, 4)
    hotProducts.value = hotRes
    newProducts.value = newRes
  } catch (error) {
    // 静默处理错误，不显示在控制台
  }
}

const onSearch = (value: string) => {
  router.push({ path: '/category', query: { keyword: value } })
}

const goCategory = (id: string) => {
  router.push({ path: '/category', query: { categoryId: id } })
}

const goProductDetail = (id: string) => {
  router.push(`/product/${id}`)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.home-page {
  min-height: 100vh;
  background-color: var(--bg-color);
  padding-bottom: 60px;
}

.top-bar {
    display: flex;
    align-items: center;
    background: white;
    padding: 8px;
    gap: 8px;

    .search-wrapper {
      flex: 1;
      border: 2px solid var(--primary-color);
      border-radius: 20px;
      padding: 0;
      overflow: hidden;
    }

    :deep(.van-search) {
      width: 100%;
      padding: 0;
    }

    .language-switcher {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    background: var(--primary-color);
    border-radius: 20px;
    cursor: pointer;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(238, 10, 36, 0.3);
    transition: all 0.3s ease;
    
    &:hover {
      background: #d40a1e;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(238, 10, 36, 0.4);
    }
    
    span {
      font-size: 12px;
      color: white;
      font-weight: 500;
    }
    
    i {
      color: white !important;
    }
  }
}

.banner {
  width: 100%;
  height: 200px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.category-nav {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 16px;
  background: white;

  .category-item {
    text-align: center;
    cursor: pointer;

    .category-icon {
      width: 50px;
      height: 50px;
      margin: 0 auto 8px;
      border-radius: 50%;
      overflow: hidden;
      background: var(--bg-color);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .category-name {
      font-size: 12px;
      color: var(--text-primary);
    }
  }
}

.section {
  margin-top: 12px;
  background: white;
  padding: 16px;

  .section-title {
    font-size: 18px;
    font-weight: bold;
    color: var(--title-color);
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--primary-color);
    display: inline-block;
  }

  .product-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
/* 加入购物车动画样式 */
.addToCartAnimationContainer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
}

.addToCartAnimation {
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  z-index: 999999;
  opacity: 1;
  pointer-events: none;
  animation: addToCart 1s ease-out forwards;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.6);
  border: 3px solid white;
  /* 确保动画能被看到 */
  visibility: visible !important;
  /* 初始位置：加号按钮正中心 */
  transform: translate(-50%, -50%) scale(1);
  /* 添加背景图片居中显示 */
  background-size: cover;
  background-position: center;
}

@keyframes addToCart {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
    /* 移除背景颜色，确保背景图片显示 */
    /* 保留背景图片设置 */
    background-size: cover;
    background-position: center;
  }
  100% {
    opacity: 0;
    /* 直接移动到购物车图标位置 - 底部导航栏第三个位置 */
    transform: translate(-50%, -50%) scale(0.5);
    left: calc(75vw - 15px);
    top: calc(100vh - 35px);
    /* 移除背景颜色，确保背景图片显示 */
    /* 保留背景图片设置 */
    background-size: cover;
    background-position: center;
  }
}
</style>
