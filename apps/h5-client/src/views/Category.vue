<template>
  <div class="category-page-wrapper">
    <div class="category-page">
      <van-nav-bar :title="$t('category.title')" />
      
      <!-- 搜索栏 -->
      <div class="search-bar-container">
        <van-search
          v-model="searchKeyword"
          :placeholder="$t('category.searchPlaceholder')"
          @search="handleSearch"
          @input="handleInput"
          @clear="() => handleInput('')"
          clearable
        />
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

      <div class="category-container">
        <!-- 左侧分类列表 -->
        <div class="category-sidebar">
          <!-- 全部分类选项 -->
          <div
            class="category-item"
            :class="{ 'active': selectedCategoryId === null }"
            @click="selectAllCategories"
          >
            <div class="category-name">{{ $t('category.all') }}</div>
          </div>
          <!-- 其他分类选项 -->
          <div
            v-for="category in categories"
            :key="category.id"
            class="category-item"
            :class="{ 'active': selectedCategoryId === category.id }"
            @click="selectCategory(category)"
          >
            <div class="category-name">{{ getCategoryName(category) }}</div>
          </div>
        </div>

        <!-- 右侧商品内容 -->
          <div class="category-content">
            <!-- 商品列表 -->
            <div class="product-list">
            <div v-if="loading" class="loading-container">
              <van-loading type="spinner" color="#ff6b6b" />
            </div>

            <div v-else-if="filteredProducts.length > 0">
              <!-- 遍历商品，添加分类标题 -->
              <template v-for="(product, index) in filteredProducts" :key="product.id">
                <!-- 当商品分类变化时显示分类标题 -->
                <div 
                  v-if="index === 0 || product._categoryId !== filteredProducts[index - 1]._categoryId"
                  class="category-divider"
                  :data-category-id="product._categoryId"
                  ref="(el) => {
                    if (el) {
                      observer?.observe(el);
                    }
                  }"
                >
                  {{ getCategoryName(categories.find(cat => cat.id === product._categoryId) || {}) }}
                </div>
                <div
                  class="product-item"
                >
                <!-- 商品图片 -->
                <div class="product-image" @click="goToCategory(product._categoryId)">
                  <van-image
                    :src="getImageUrl(product.image || product.images)"
                    :alt="product.name"
                    fit="cover"
                    lazy
                    @error="handleImageError"
                  />
                  <!-- 售罄标识 -->
                  <div v-if="product.stock <= 0" class="sold-out-tag">{{ $t('product.soldOut') }}</div>
                </div>

                <!-- 商品信息 -->
                <div class="product-info">
                  <div class="product-name" @click="goToProductDetail(product)">
                    {{ getProductName(product) }}
                  </div>
                  <div class="product-stock">{{ $t('common.stock') }}{{ product.stock || 0 }}</div>
                  <div class="product-price">¥{{ (typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0).toFixed(2) }}</div>
                </div>

                <!-- 商品操作区 -->
                <div class="product-action">
                  <!-- 已售罄状态 -->
                  <div v-if="product.stock <= 0" class="sold-out-btn">
                    {{ $t('product.soldOut') }}
                  </div>
                  <!-- 有规格组的商品 -->
                  <div v-else-if="product.has_specs" class="select-spec-btn" @click="goToProductDetail(product)">
                    {{ $t('product.selectSpec') }}
                  </div>
                  <!-- 数量控制状态 -->
                  <div v-else-if="getProductQuantity(product.id) > 0" class="quantity-control">
                    <div class="quantity-btn minus" @click="decreaseQuantity(product)">
                      <van-icon name="minus" size="14" />
                    </div>
                    <div class="quantity">
                      {{ getProductQuantity(product.id) }}
                    </div>
                    <div class="quantity-btn plus" @click="(e) => increaseQuantity(product, e)">
                      <van-icon name="plus" size="14" />
                    </div>
                  </div>
                  <!-- 可直接购买状态 -->
                  <div v-else class="add-to-cart-btn" @click="(e) => addToCart(product, e)">
                    <van-icon name="plus" size="16" />
                  </div>
                </div>
                </div>
              </template>
              
              <!-- 加载更多指示器 -->
              <div v-if="loadingMore" class="loading-more-container">
                <van-loading type="spinner" color="#ff6b6b" size="20" />
                <span class="loading-more-text">{{ $t('common.loadMore') }}</span>
              </div>
              

            </div>

            <div v-else-if="!loading" class="empty-container">
              <van-empty 
                :description="searchKeyword ? $t('category.noSearchResults') : $t('category.noProducts')" 
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 底部红色购物车按钮 -->
      <div v-if="cartStore.items.length > 0 && !showSelectedProducts" class="bottom-cart-button" @click="toggleSelectedProducts">
        <div class="cart-icon-wrapper">
          <van-icon name="cart-o" size="20" />
          <span class="cart-count">{{ cartStore.totalCount }}</span>
        </div>
        <span class="total-price">¥{{ cartStore.totalPrice.toFixed(2) }}</span>
      </div>
      
      <!-- 底部已选择商品 -->
      <div v-if="cartStore.items.length > 0 && showSelectedProducts" class="selected-products">
        <div class="selected-title">
          <span class="selected-count">{{ $t('cart.selectedItems', { count: cartStore.items.length }) }}</span>
          <div class="clear-cart" @click="clearCart">{{ $t('cart.clearAll') }}</div>
        </div>
        <div class="selected-list">
          <div
            v-for="item in cartStore.items"
            :key="item.id"
            class="selected-item"
          >
            <div class="selected-item-image" @click="goToProductDetailById(item.productId)">
              <van-image
                v-if="item.image"
                :src="getImageUrl(item.image)"
                :alt="item.name"
                fit="cover"
                lazy
                @error="handleImageError"
              />
              <div v-else class="selected-item-image-placeholder">{{ $t('product.noImage') }}</div>
            </div>
            <div class="selected-item-info">
              <div class="selected-item-name">
                <span class="item-name-text" @click="goToProductDetailById(item.productId)">{{ item.name }}</span>
                <div v-if="item.specs?.text" class="change-specs-btn" @click="editSpecs(item)">
                  {{ $t('common.edit') }}
                </div>
              </div>
              <!-- 只有当specs有实际内容时才显示 -->
              <div class="selected-item-specs" v-if="item.specs?.text">
                {{ item.specs.text }}
              </div>
              <div class="selected-item-price">¥{{ Number(item.price).toFixed(2) }}</div>
            </div>
            <div class="quantity-controls">
              <van-stepper
                v-model="item.quantity"
                :min="0"
                :max="99"
                @change="onQuantityChange(item)"
                active-color="#ee0a24"
                inactive-color="#c0c0c0"
              />
            </div>
          </div>
        </div>
        <div class="selected-footer" @click="toggleSelectedProducts">
          <div class="cart-info">
          <div class="cart-icon-wrapper">
            <van-icon name="cart-o" size="20" />
            <span class="cart-count">{{ cartStore.totalCount }}</span>
          </div>
          <span class="total-price">¥{{ cartStore.totalPrice.toFixed(2) }}</span>
        </div>
          <div class="cart-actions">
            <div class="checkout-btn" @click.stop="checkout">
                {{ $t('cart.ready') }}
              </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部导航 -->
    <van-tabbar route fixed>
      <van-tabbar-item to="/home" icon="home-o">{{ $t('nav.home') }}</van-tabbar-item>
      <van-tabbar-item to="/category" icon="apps-o">{{ $t('nav.category') }}</van-tabbar-item>
      <van-tabbar-item to="/cart" icon="cart-o" :badge="cartCount || ''">{{ $t('nav.cart') }}</van-tabbar-item>
      <van-tabbar-item to="/profile" icon="user-o">{{ $t('nav.profile') }}</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { getCategories, getProductsByCategory, searchProducts, getProductList } from '@/api/product'
import { useI18n } from 'vue-i18n'
import { useCartStore } from '@/stores/cart'
import type { Product, Category } from '@/types'

const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()
const cartStore = useCartStore()

// 数据
const categories = ref<Category[]>([])
const products = ref<any[]>([])
const searchKeyword = ref('')
const isSearching = ref(false)
const selectedCategoryId = ref<number | null>(null)
const showSelectedProducts = ref(false)
const loading = ref(false)
const loadingMore = ref(false)

// 过滤后的商品
const filteredProducts = computed(() => {
  // 当处于搜索状态时，直接返回搜索结果，不进行额外过滤
  if (isSearching.value) {
    return products.value
  }
  
  // 当搜索关键词为空时，返回所有商品
  if (!searchKeyword.value.trim()) {
    return products.value
  }
  
  // 当不处于搜索状态但有搜索关键词时，进行本地过滤
  const keyword = searchKeyword.value.toLowerCase()
  return products.value.filter(product => {
    const productName = getProductName(product).toLowerCase()
    return productName.includes(keyword)
  })
})

// 搜索处理
const handleSearch = async () => {
  if (searchKeyword.value.trim()) {
    await performSearch()
  }
}

// 输入变化处理
const handleInput = async (value: string) => {
  // 如果搜索关键词为空，恢复显示分类商品
  if (!value || typeof value !== 'string' || !value.trim()) {
    isSearching.value = false
    // 重新加载当前分类的商品
    if (selectedCategoryId.value) {
      await loadProducts(selectedCategoryId.value)
    }
  } else {
    // 实时搜索：当输入内容不为空时，触发搜索
    await performSearch()
  }
}

// 执行搜索
const performSearch = async () => {
  if (!searchKeyword.value.trim()) return
  
  try {
    loading.value = true
    isSearching.value = true
    
    // 显式传递categoryId为undefined，确保搜索所有分类
    const response = await searchProducts(searchKeyword.value, { categoryId: undefined })
    
    // 检查response是否存在
    if (!response) {
      products.value = []
      return
    }
    
    // 检查response是否为数组（直接返回商品列表的情况）
    if (Array.isArray(response)) {
      // 为搜索结果添加_categoryId属性并按分类ID排序
      const productsWithCategory = response.map(product => ({
        ...product,
        _categoryId: product.category_id || product.categoryId || product.category?.id || 0
      })).sort((a, b) => {
        // 先按分类ID排序，再按商品ID排序
        if (a._categoryId !== b._categoryId) {
          return a._categoryId - b._categoryId
        }
        return a.id - b.id
      })
      products.value = productsWithCategory
      return
    }
    
    // 如果所有检查都失败，则返回空列表
    products.value = []
  } catch (error) {
    showToast(t('common.error'))
    // 搜索失败时重置状态
    isSearching.value = false
    products.value = []
  } finally {
    loading.value = false
  }
}

// 监听路由查询参数中的搜索关键词
watch(
  () => route.query.keyword,
  async (newKeyword) => {
    if (newKeyword) {
      searchKeyword.value = newKeyword as string
      await performSearch()
    }
  },
  { immediate: true }
)

// 监听路由查询参数中的分类ID
watch(
  () => route.query.categoryId,
  (categoryId) => {
    if (categoryId) {
      const id = parseInt(categoryId as string)
      if (!isNaN(id)) {
        // 只设置selectedCategoryId，不直接调用loadProducts
        // 这样可以避免在loadProducts函数定义之前调用它
        selectedCategoryId.value = id
        // 加载商品的逻辑会在组件初始化完成后执行
      }
    }
  },
  { immediate: true }
)

// 监听搜索关键词变化
watch(
  searchKeyword,
  async (newKeyword, oldKeyword) => {
    // 如果关键词从有到无，恢复显示分类商品
    if (!newKeyword.trim() && oldKeyword.trim()) {
      isSearching.value = false
      // 重新加载当前分类的商品
      if (selectedCategoryId.value) {
        await loadProducts(selectedCategoryId.value)
      }
    }
  }
)

// 监听selectedCategoryId变化
watch(
  selectedCategoryId,
  async (newCategoryId) => {
    if (newCategoryId !== null) {
      // 确保categories数组已经被加载
      if (categories.value.length === 0) {
        // 等待categories数组加载完成
        await new Promise(resolve => {
          const checkCategories = () => {
            if (categories.value.length > 0) {
              resolve(null)
            } else {
              setTimeout(checkCategories, 100)
            }
          }
          checkCategories()
        })
      }
      // 当selectedCategoryId变化时，找到对应的分类并调用selectCategory方法
      // 这样可以确保左侧分类列表正确高亮显示
      const category = categories.value.find(cat => cat.id === newCategoryId)
      if (category) {
        selectCategory(category)
      }
    }
  }
)

// 监听categories变化，确保分类数据加载完成后，能正确找到对应的分类并加载商品
watch(
  categories,
  async (newCategories) => {
    if (newCategories.length > 0 && selectedCategoryId.value !== null) {
      const category = newCategories.find(cat => cat.id === selectedCategoryId.value)
      if (category) {
        selectCategory(category)
      }
    }
  },
  { deep: true }
)

// 无限滚动相关
const currentCategoryIndex = ref(0)
const loadedCategories = ref<Set<number>>(new Set())
const isAllCategoriesLoaded = ref(false)

// 导航相关
const active = ref(0)

// 购物车商品数量，用于导航栏徽章
const cartCount = computed(() => {
  return cartStore.totalCount
})

// 获取图片URL，确保路径正确
const getImageUrl = (image: any) => {
  if (!image) {
    // 如果没有图片，返回空字符串
    return ''
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
      const path = `/${image}`
      return path
    }
    const path = `/uploads/${image}`
    return path
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
  
  // 如果所有尝试都失败，返回空字符串
  return ''
}

// 图片加载失败处理
const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  // 不设置默认占位图，保持空状态
}

// 添加商品缓存，避免频繁重复请求
const productCache = ref<Map<number, any[]>>(new Map())

// 获取当前选中的分类
const selectedCategory = computed(() => {
  return categories.value.find(category => category.id === selectedCategoryId.value) || null
})

// 动画相关
const animationItems = ref<Array<{id: string, x: number, y: number, image: string}>>([])

// 跟踪每个商品的购买数量
const productQuantities = ref<Map<number, number>>(new Map())

// 获取商品数量
const getProductQuantity = (productId: number) => {
  return productQuantities.value.get(productId) || 0
}

// 设置商品数量
const setProductQuantity = (productId: number, quantity: number) => {
  productQuantities.value.set(productId, quantity)
}

// 创建加入购物车动画
const createAddToCartAnimation = (x: number, y: number, product: Product) => {
  // 创建唯一ID
  const id = `${product.id}-${Date.now()}`
  
  // 获取产品图片，使用项目中已有的getImageUrl函数处理路径
  let imageUrl = ''
  
  // 优先使用product.image字段
  if (product?.image && typeof product.image === 'string' && product.image.trim() !== '') {
    imageUrl = getImageUrl(product.image)
  } 
  // 处理images字段（可能是数组、对象或字符串）
  else if (product?.images) {
    let firstImage = ''
    
    if (typeof product.images === 'string' && product.images.trim() !== '') {
      firstImage = product.images
    } 
    else if (Array.isArray(product.images) && product.images.length > 0) {
      firstImage = product.images[0] as string
    } 
    else if (typeof product.images === 'object') {
      // 如果是对象，获取第一个属性值
      firstImage = Object.values(product.images)[0] as string
    }
    
    if (firstImage && typeof firstImage === 'string' && firstImage.trim() !== '') {
      imageUrl = getImageUrl(firstImage)
    }
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

// 增加商品数量
const increaseQuantity = (product: Product, event?: MouseEvent) => {
  const currentQuantity = getProductQuantity(product.id)
  const newQuantity = Math.min(currentQuantity + 1, product.stock || 99)
  setProductQuantity(product.id, newQuantity)
  
  // 更新购物车
  updateCartItem(product, newQuantity)
  
  // 只有加号按钮触发加入购物车动画
  if (event) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    createAddToCartAnimation(x, y, product)
  }
}

// 减少商品数量
const decreaseQuantity = (product: Product) => {
  const currentQuantity = getProductQuantity(product.id)
  const newQuantity = currentQuantity - 1
  
  if (newQuantity <= 0) {
    // 数量减到0时，移除商品
    setProductQuantity(product.id, 0)
    updateCartItem(product, 0)
  } else {
    setProductQuantity(product.id, newQuantity)
    updateCartItem(product, newQuantity)
  }
  
  // 减号按钮不触发动画
}

// 更新购物车商品
const updateCartItem = (product: Product, quantity: number) => {
  // 检查购物车中是否已有该商品
  const existingItem = cartStore.items.find(item => item.productId === product.id)
  
  if (quantity > 0) {
    if (existingItem) {
      // 更新现有商品数量
      existingItem.quantity = quantity
    } else {
      // 添加新商品到购物车
      cartStore.addItem({
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        name: getProductName(product),
        image: getImageUrl(product.image || product.images),
        price: typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0,
        quantity: quantity,
        selected: true,
        specs: {}
      })
    }
  } else {
    // 从购物车中移除商品
    if (existingItem) {
      cartStore.removeItem(existingItem.id)
    }
  }
}

// 获取多语言分类名称
const getCategoryName = (category: any) => {
  if (!category) return ''
  
  console.log('当前语言:', locale.value)
  console.log('分类数据:', category)
  console.log('分类名称字段检查:')
  console.log('  category.name:', category.name)
  console.log('  category.name_en:', category.name_en)
  console.log('  category.name_ar:', category.name_ar)
  console.log('  category.name_es:', category.name_es)
  console.log('  category.name_pt:', category.name_pt)
  
  // 优先使用对应语言的分类名称
  const lang = locale.value
  if ((lang === 'en-US' || lang === 'en') && category.name_en) {
    console.log('使用英语名称:', category.name_en)
    return category.name_en
  }
  if ((lang === 'ar-SA' || lang === 'ar') && category.name_ar) {
    console.log('使用阿拉伯语名称:', category.name_ar)
    return category.name_ar
  }
  if ((lang === 'es-ES' || lang === 'es') && category.name_es) {
    console.log('使用西班牙语名称:', category.name_es)
    return category.name_es
  }
  if ((lang === 'pt-BR' || lang === 'pt') && category.name_pt) {
    console.log('使用葡萄牙语名称:', category.name_pt)
    return category.name_pt
  }
  
  // 如果没有对应语言的分类名称，使用默认名称
  console.log('使用默认名称:', category.name || '')
  return category.name || ''
}

// 获取多语言商品名称
const getProductName = (product: Product) => {
  if (!product) return ''
  
  console.log('当前语言:', locale.value)
  console.log('商品数据:', product)
  console.log('商品名称字段检查:')
  console.log('  product.name:', product.name)
  console.log('  product.name_en:', product.name_en)
  console.log('  product.name_ar:', product.name_ar)
  console.log('  product.name_es:', product.name_es)
  console.log('  product.name_pt:', product.name_pt)
  
  const lang = locale.value
  if ((lang === 'en-US' || lang === 'en') && product.name_en) {
    console.log('使用英语商品名称:', product.name_en)
    return product.name_en
  }
  if ((lang === 'ar-SA' || lang === 'ar') && product.name_ar) {
    console.log('使用阿拉伯语商品名称:', product.name_ar)
    return product.name_ar
  }
  if ((lang === 'es-ES' || lang === 'es') && product.name_es) {
    console.log('使用西班牙语商品名称:', product.name_es)
    return product.name_es
  }
  if ((lang === 'pt-BR' || lang === 'pt') && product.name_pt) {
    console.log('使用葡萄牙语商品名称:', product.name_pt)
    return product.name_pt
  }
  
  console.log('使用默认商品名称:', product.name || '')
  return product.name || ''
}

// 加载商品
const loadProducts = async (categoryId: number, append: boolean = false) => {
  try {
    const isCached = productCache.value.has(categoryId)
    
    if (isCached) {
      const cachedProducts = productCache.value.get(categoryId) || []
      if (append) {
        // 添加分类标记
        const productsWithCategory = cachedProducts.map(product => ({
          ...product,
          _categoryId: categoryId
        }))
        products.value.push(...productsWithCategory)
      } else {
        products.value = cachedProducts.map(product => ({
          ...product,
          _categoryId: categoryId
        }))
      }
    } else {
      if (append) {
        loadingMore.value = true
      } else {
        loading.value = true
      }
      
      const data = await getProductsByCategory(categoryId)
      // 添加分类标记
      const productsWithCategory = data.map(product => ({
        ...product,
        _categoryId: categoryId
      }))
      
      if (append) {
        products.value.push(...productsWithCategory)
      } else {
        products.value = productsWithCategory
      }
      
      // 保存到缓存
      productCache.value.set(categoryId, data)
    }
    
    // 标记为已加载
    loadedCategories.value.add(categoryId)
  } catch (error: any) {
    console.error('加载商品失败:', error)
    showToast(t('product.loadError'))
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 加载更多商品
const loadMoreProducts = async () => {
  // 如果正在搜索，不加载更多商品
  if (isSearching.value || loadingMore.value || isAllCategoriesLoaded.value || categories.value.length === 0) {
    return
  }
  
  try {
    // 找到下一个未加载的分类
    let nextCategoryIndex = currentCategoryIndex.value + 1
    
    // 遍历找到下一个未加载的分类
    while (nextCategoryIndex < categories.value.length && loadedCategories.value.has(categories.value[nextCategoryIndex].id)) {
      nextCategoryIndex++
    }
    
    if (nextCategoryIndex >= categories.value.length) {
      // 所有分类已加载
      isAllCategoriesLoaded.value = true
      return
    }
    
    const nextCategory = categories.value[nextCategoryIndex]
    await loadProducts(nextCategory.id, true)
    currentCategoryIndex.value = nextCategoryIndex
    
    // 如果所有分类都已加载，标记为已完成
    if (loadedCategories.value.size === categories.value.length) {
      isAllCategoriesLoaded.value = true
    }
  } catch (error) {
    console.error('加载更多商品失败:', error)
  }
}

// 选择分类
const selectCategory = (category: Category) => {
  selectedCategoryId.value = category.id
  
  // 重置搜索状态
  isSearching.value = false
  searchKeyword.value = ''
  
  // 重置无限滚动状态
  currentCategoryIndex.value = categories.value.findIndex(cat => cat.id === category.id) || 0
  loadedCategories.value.clear()
  isAllCategoriesLoaded.value = false
  
  // 如果有缓存，直接使用，否则请求
  if (productCache.value.has(category.id)) {
    products.value = productCache.value.get(category.id)?.map(product => ({
      ...product,
      _categoryId: category.id
    })) || []
    loading.value = false
    loadedCategories.value.add(category.id)
  } else {
    loadProducts(category.id)
  }
}

// 选择所有分类
const selectAllCategories = async () => {
  selectedCategoryId.value = null
  
  // 重置搜索状态
  isSearching.value = false
  searchKeyword.value = ''
  
  // 重置无限滚动状态
  currentCategoryIndex.value = 0
  loadedCategories.value.clear()
  isAllCategoriesLoaded.value = false
  
  // 加载所有分类的商品
  products.value = []
  loading.value = true
  
  try {
    // 直接调用API获取所有商品，不分页
    const response = await getProductList({ pageSize: 1000 })
    if (response && response.list) {
      // 为每个商品添加分类ID并按分类ID排序
      const allProducts = response.list.map(product => ({
        ...product,
        _categoryId: product.category_id || product.category?.id || 0
      })).sort((a, b) => {
        // 先按分类ID排序，再按商品ID排序
        if (a._categoryId !== b._categoryId) {
          return a._categoryId - b._categoryId
        }
        return a.id - b.id
      })
      products.value = allProducts
    }
    isAllCategoriesLoaded.value = true
  } catch (error) {
    console.error('加载所有商品失败:', error)
    showToast(t('common.error'))
  } finally {
    loading.value = false
  }
}

// 加载分类
const loadCategories = async () => {
  try {
    showLoadingToast({
      message: t('common.loading'),
      forbidClick: true,
    })
    const data = await getCategories()
    // 对分类进行排序，按照 sort 字段降序，created_at 字段升序
    categories.value = (data || []).sort((a, b) => {
      // 先按 sort 字段降序排序
      if (a.sort !== b.sort) {
        return b.sort - a.sort
      }
      // 如果 sort 相同，按 created_at 字段升序排序
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
    // 只有当没有选中的分类时，才默认选择全部分类
    // 这样可以保持路由参数设置的分类 ID
    if (selectedCategoryId.value === null) {
      await selectAllCategories()
    }
  } catch (error: any) {
    console.error('加载分类失败:', error)
    showToast(t('category.loadError'))
  } finally {
    closeToast()
  }
}

// 跳转到商品详情
const goToProductDetail = (product: Product) => {
  router.push(`/product/${product.id}`)
}

// 根据商品ID跳转到商品详情
const goToProductDetailById = (productId: string) => {
  router.push(`/product/${productId}`)
}

// 跳转到对应分类
const goToCategory = (categoryId: number) => {
  // 找到对应的分类
  const category = categories.value.find(cat => cat.id === categoryId)
  if (category) {
    selectCategory(category)
  }
}

// 添加到购物车
const addToCart = (product: Product, event: MouseEvent) => {
  increaseQuantity(product, event)
  showToast(t('cart.addSuccess'))
}

// 处理商品数量变化
const onQuantityChange = (item: any, event?: any) => {
  // 同步更新右侧商品列表中对应商品的数量
  if (item.quantity <= 0) {
    // 数量减到0时，移除右侧商品数量记录
    setProductQuantity(item.productId, 0)
    // 调用购物车store的updateQuantity函数，自动移除数量为0的商品
    cartStore.updateQuantity(item.id, 0)
  } else {
    setProductQuantity(item.productId, item.quantity)
    // 调用购物车store的updateQuantity函数，更新商品数量
    cartStore.updateQuantity(item.id, item.quantity)
  }
  
  // 根据用户要求，底部已选择商品列表的+和-按钮都不跳动画
  // 因此注释掉所有动画触发逻辑
}

// 清空购物车
const clearCart = () => {
  // 清空购物车store中的商品
  cartStore.clearCart()
  
  // 清空右侧商品列表中的所有数量
  productQuantities.value = new Map()
  
  // 显示成功提示
  showToast(t('cart.clearSuccess'))
}

// 编辑商品规格
const editSpecs = (item: any) => {
  // 跳转到商品详情页，并传递编辑模式和购物车项ID
  router.push({
    path: `/product/${item.productId}`,
    query: {
      edit: 'true',
      cartItemId: item.id
    }
  })
  console.log('点击更改按钮，跳转到商品详情页，参数:', { edit: 'true', cartItemId: item.id })
}

// 去结算
// 切换已选择商品显示状态
const toggleSelectedProducts = () => {
  showSelectedProducts.value = !showSelectedProducts.value
}

const checkout = () => {
  router.push('/cart')
}

// 滚动事件相关变量
let lastScrollTop = 0
let scrollTimeout: number | null = null
let handleScroll: EventListenerOrEventListenerObject | null = null
let observer: IntersectionObserver | null = null

// 页面加载时初始化
onMounted(() => {
  loadCategories()
  
  // 添加滚动事件监听
  const contentEl = document.querySelector('.category-content')
  
  if (contentEl) {
    // 优化滚动事件，使用passive选项提高性能
    handleScroll = (e: Event) => {
      const target = e.target as HTMLElement
      const scrollTop = target.scrollTop
      const scrollHeight = target.scrollHeight
      const clientHeight = target.clientHeight
      
      // 检测是否滚动到底部（距离底部100px以内）
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      
      if (isNearBottom) {
        // 防抖处理，避免频繁触发
        if (scrollTimeout) {
          clearTimeout(scrollTimeout)
        }
        scrollTimeout = window.setTimeout(() => {
          loadMoreProducts()
        }, 100)
      }
      
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop
    }
    
    contentEl.addEventListener('scroll', handleScroll, { passive: true })
  }
  
  // 设置Intersection Observer监测分类分隔线
  observer = new IntersectionObserver(
    (entries) => {
      // 过滤出可见的分类分隔线
      const visibleEntries = entries.filter(entry => entry.isIntersecting)
      
      if (visibleEntries.length > 0) {
        // 找到最顶部的可见分类分隔线
        const topEntry = visibleEntries.reduce((prev, current) => {
          return (prev.boundingClientRect.top < current.boundingClientRect.top) ? prev : current
        }, visibleEntries[0])
        
        // 获取分类ID
        const categoryId = Number(topEntry.target.getAttribute('data-category-id'))
        if (!isNaN(categoryId)) {
          // 更新左侧分类高亮
          selectedCategoryId.value = categoryId
        }
      }
    },
    {
      root: contentEl,
      rootMargin: '-100px 0px 0px 0px', // 调整触发区域，只有当元素接近顶部100px时才触发
      threshold: [0.1, 0.5, 1.0] // 当元素10%、50%或100%可见时触发
    }
  )
})

// 清理事件监听
onUnmounted(() => {
  const contentEl = document.querySelector('.category-content')
  if (contentEl && handleScroll) {
    contentEl.removeEventListener('scroll', handleScroll)
  }
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped lang="scss">
/* 分类页面样式 */
.category-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 60px; /* 为底部导航栏留出空间 */
}

/* 搜索栏容器 */
.search-bar-container {
  background-color: #ffffff;
  padding: 6px 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: var(--van-nav-bar-height);
  z-index: 999;
}

/* 分类分隔线 */
.category-divider {
  background-color: #f8f8f8;
  color: #333333;
  font-size: 16px;
  font-weight: bold;
  padding: 12px 18px;
  margin: 0;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.search-bar-container .van-search {
  --van-search-background: #f5f5f5;
  --van-search-text-color: #333333;
  --van-search-placeholder-color: #999999;
  --van-search-input-height: 26px;
  --van-search-border-radius: 13px;
  --van-search-icon-size: 14px;
  --van-search-text-font-size: 13px;
  --van-search-placeholder-font-size: 13px;
}

/* 固定导航栏样式 */
.category-page .van-nav-bar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  --van-nav-bar-height: 40px;
  --van-nav-bar-title-font-size: 16px;
  --van-nav-bar-title-line-height: 40px;
}

.category-page .van-nav-bar__content {
  height: 40px;
  line-height: 40px;
}

.category-page .van-nav-bar__title {
  font-size: 16px;
  line-height: 40px;
}

.category-container {
  display: flex;
  height: calc(100vh - var(--van-nav-bar-height) - 60px); /* 减少高度，为底部导航栏留出空间 */
  background-color: #f5f5f5;
  overflow: hidden;
}

.category-page-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 左侧分类列表样式 */
.category-sidebar {
  width: 90px;
  background-color: #ffffff;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  height: 100%;
  align-items: stretch;
  padding-left: 5px;
  
  /* 隐藏滚动条但保留滚动功能 */
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 4px;
  }
  
  &:hover::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.1);
  }
  
  .category-item {
      padding: 14px 0;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 65px;
      padding-left: 5px;
    
    &:hover {
      background-color: #f8f8f8;
    }
    
    &.active {
      background-color: #ee0a24;
      box-shadow: none;
      /* 确保激活状态的分类项完全填满容器宽度，消除右侧白色缝隙 */
      width: calc(100% - 10px); /* 调整宽度以适应居中显示 */
      position: relative;
      left: 5px; /* 居中显示 */
      z-index: 1;
    }
    
    .category-name {
      font-size: clamp(13px, 3.8vw, 16px); /* 增大字体大小 */
      font-weight: 600;
      color: #666666;
      line-height: 1.3;
      display: block;
      padding: 0 8px;
      word-wrap: break-word;
      white-space: normal;
      height: auto;
      overflow: hidden;
      text-align: center;
    }
    
    &.active .category-name {
      color: #ffffff;
      font-weight: bold;
      font-size: clamp(14px, 4.2vw, 17px); /* 增大激活状态字体大小 */
      text-align: center;
      margin: 0 auto;
      padding: 0 12px;
    }
  }
}

/* 右侧商品内容样式 */
.category-content {
  flex: 1;
  overflow-y: auto;
  background-color: #ffffff;
  padding-top: 0;
  
  .product-list {
    padding: 0;
    padding-bottom: 180px; /* 增加底部内边距，避免被底部导航和购物车区域遮挡 */
  }
  
  /* 分类分隔线 */
  .category-divider {
    background-color: #f8f8f8;
    color: #333333;
    font-size: 16px;
    font-weight: bold;
    padding: 12px 18px;
    margin: 0;
    border-bottom: 1px solid #e0e0e0;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  /* 单个商品样式 */
  .product-item {
    display: flex;
    align-items: center;
    padding: 15px 18px;
    background-color: #ffffff;
    border-bottom: 1px solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  /* 加载更多样式 */
  .loading-more-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px 0;
    background-color: #ffffff;
    border-top: 1px solid #f0f0f0;
    
    .loading-more-text {
      margin-left: 10px;
      font-size: 14px;
      color: #666666;
    }
  }
  
  /* 已加载全部样式 */
  .all-loaded-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 15px 0;
    background-color: #ffffff;
    border-top: 1px solid #f0f0f0;
    
    span {
      font-size: 14px;
      color: #999999;
    }
  }
  
  /* 商品图片样式 */
  .product-image {
    width: 80px;
    height: 80px;
    border-radius: 4px;
    overflow: hidden;
    margin-right: 12px;
    position: relative;
    cursor: pointer;
    background-color: #fafafa;
    
    .van-image {
      width: 100%;
      height: 100%;
    }
    
    .product-image-placeholder {
      width: 100%;
      height: 100%;
      background-color: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 12px;
    }
    
    /* 已售罄标识 */
    .sold-out-tag {
      position: absolute;
      top: 5px;
      right: 5px;
      background-color: #fff3cd;
      color: #856404;
      font-size: 12px;
      font-weight: bold;
      padding: 2px 6px;
      border-radius: 3px;
      z-index: 2;
    }
  }
  
  /* 商品信息样式 */
  .product-info {
    flex: 1;
    min-width: 0;
    margin-right: 12px;
    
    .product-name {
      font-size: 14px;
      font-weight: 500;
      color: #333333;
      margin-bottom: 6px;
      overflow: hidden;
      cursor: pointer;
      line-height: 1.3;
      max-height: 2.6em;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    
    .product-stock {
      font-size: 12px;
      color: #999999;
      margin-bottom: 6px;
    }
    
    .product-price {
      font-size: 18px;
      font-weight: bold;
      color: #ee0a24;
    }
  }
  
  /* 商品操作区样式 */
    .product-action {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      min-width: 60px;
      
      /* 已售罄按钮 */
      .sold-out-btn {
        background-color: #ffd700;
        color: #333333;
        font-size: 12px;
        font-weight: 500;
        padding: 4px 10px;
        border-radius: 12px;
        cursor: not-allowed;
      }
      
      /* 选规格按钮 */
      .select-spec-btn {
        min-width: 76px;
        width: auto;
        height: 26px;
        background: var(--primary-color);
        color: #ffffff;
        border: none;
        border-radius: 13px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 6px rgba(238, 10, 36, 0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        margin-top: auto;
        align-self: flex-end;
        min-width: auto;
        white-space: nowrap;
        padding: 0 12px;
        
        &:hover {
          background: #d40a1e;
          transform: translateY(-1px);
          box-shadow: 0 3px 8px rgba(238, 10, 36, 0.4);
        }
        
        &:active {
          transform: translateY(0);
        }
      }
    
    /* 添加到购物车按钮 - 与ProductCard.vue样式统一 */
    .add-to-cart-btn {
      width: 28px;
      height: 28px;
      background: #ee0a24;
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
    
    /* 数量控制器样式 */
    .quantity-control {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 24px;
      background-color: #ffffff;
      border: 1px solid #ee0a24;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      
      /* 数量按钮 */
      .quantity-btn {
        width: 26px;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        background-color: #ffffff;
        border: none;
        outline: none;
        font-size: 14px;
        
        &.minus {
          color: #ee0a24;
          
          &:hover {
            background-color: #f5f5f5;
          }
        }
        
        &.plus {
          color: #ee0a24;
          
          &:hover {
            background-color: #f5f5f5;
          }
        }
        
        &:active {
          transform: scale(0.95);
        }
      }
      
      /* 数量显示 */
      .quantity {
        flex: 1;
        text-align: center;
        font-size: 13px;
        font-weight: 500;
        color: #333333;
        min-width: 16px;
        border-left: 1px solid #ee0a24;
        border-right: 1px solid #ee0a24;
      }
    }
  }
}

/* 加载和空状态 */
.loading-container,
.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
}

/* 底部红色购物车按钮 */
.bottom-cart-button {
  position: fixed;
  bottom: 55px;
  left: 0;
  right: 0;
  background-color: #ee0a24;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 998;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.bottom-cart-button .cart-icon-wrapper {
  position: relative;
  display: inline-block;
  margin-right: 10px;
}

.bottom-cart-button .van-icon-cart-o {
  color: #ee0a24;
  font-size: 24px;
  background-color: #ffffff;
  padding: 8px;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.bottom-cart-button .cart-count {
  background-color: #ffd700;
  color: #333333;
  font-size: 12px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
  position: absolute;
  top: -5px;
  right: -5px;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.bottom-cart-button .total-price {
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
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
  /* 添加背景颜色作为 fallback，确保即使没有图片也能看到 */
  background-color: #ff6b6b;
}

@keyframes addToCart {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
    /* 保留背景图片设置 */
    background-size: cover;
    background-position: center;
  }
  100% {
    opacity: 0;
    /* 直接移动到底部已选择商品区域的购物车图标位置 */
    transform: translate(-50%, -50%) scale(0.5);
    /* 购物车图标位于底部已选择商品区域左侧 */
    left: 30px;
    top: calc(100vh - 45px);
    /* 保留背景图片设置 */
    background-size: cover;
    background-position: center;
  }
}

/* 底部已选择商品样式 */
.selected-products {
  position: fixed;
  bottom: 58px; /* 再往下移动2px，更靠近底部购物车栏 */
  left: 0;
  right: 0;
  background-color: #ffffff;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 999; /* 确保在底部购物车按钮上方 */
  
  .selected-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 15px;
    font-size: 14px;
    font-weight: bold;
    color: #333;
    background-color: #f8f8f8;
    border-bottom: 1px solid #e0e0e0;
    
    .selected-count {
      flex: 1;
    }
    
    .clear-cart {
      font-size: 13px;
      color: #666;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.2s ease;
      user-select: none;
      
      &:hover {
        color: #999;
        background-color: #f5f5f5;
      }
      
      &:active {
        background-color: #e0e0e0;
        color: #666;
        transform: none;
      }
    }
  }
  
  /* 已选择商品列表 */
  .selected-list {
    /* 单个商品高度70px + margin-bottom 10px，5个商品总高度：4*(70+10) + 70 = 390px */
    max-height: 390px;
    overflow-y: auto;
    padding: 10px;
    
    /* 单个已选择商品 */
    .selected-item {
      display: flex;
      align-items: center;
      padding: 8px;
      margin-bottom: 10px;
      background-color: #fafafa;
      border-radius: 6px;
      height: 70px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      /* 商品图片 */
      .selected-item-image {
        width: 55px;
        height: 55px;
        border-radius: 4px;
        overflow: hidden;
        margin-right: 10px;
        cursor: pointer;
        background-color: #fff;
        
        .van-image {
          width: 100%;
          height: 100%;
        }
        
        .selected-item-image-placeholder {
          width: 100%;
          height: 100%;
          background-color: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          font-size: 10px;
        }
      }
      
      /* 商品信息 */
      .selected-item-info {
        flex: 1;
        min-width: 0;
        
        .selected-item-name {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          margin-bottom: 4px;
          overflow: hidden;
          cursor: pointer;
          line-height: 1.3;
          max-height: 2.6em;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        
        .selected-item-specs {
          font-size: 12px;
          color: #999;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .selected-item-price {
          font-size: 16px;
          font-weight: bold;
          color: #ee0a24;
        }
      }
      
      /* 更改规格按钮 */
      .change-specs-btn {
        width: 50px;
        padding: 2px 8px;
        background: #ee0a24;
        color: white;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
        margin-left: 0px;
        flex-shrink: 0;
        
        &:hover {
          background: #d40a1e;
          transform: translateY(-1px);
        }
        
        &:active {
          transform: translateY(0);
        }
      }
      
      /* 商品名称行样式 */
      .selected-item-name {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 4px;
        
        .item-name-text {
          flex: 1;
          overflow: hidden;
          line-height: 1.3;
          max-height: 2.6em;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
      }
      
      /* 数量控制 */
      .quantity-controls {
        min-width: 90px;
        
        .van-stepper {
          width: 100% !important;
          
          .van-stepper__minus,
          .van-stepper__plus {
            width: 26px !important;
            height: 26px !important;
          }
          
          .van-stepper__input {
            width: 22px !important;
            height: 26px !important;
            font-size: 14px !important;
          }
        }
      }
    }
  }
  
  /* 底部操作栏 */
  .selected-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 15px;
    background-color: #ee0a24;
    border-top: 1px solid #e0e0e0;
    
    /* 购物车信息 */
      .cart-info {
        display: flex;
        align-items: center;
        gap: 8px;
        
        /* 购物车图标容器 */
        .cart-icon-wrapper {
          position: relative; /* 相对定位，用于定位徽章 */
          display: inline-block;
        }
        
        /* 购物车图标样式 */
        .van-icon-cart-o {
          color: #ee0a24; /* 购物车图标改为红色 */
          font-size: 24px;
          background-color: #ffffff; /* 底圆改为白色 */
          padding: 8px;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }
        
        .cart-icon-wrapper:hover .van-icon-cart-o {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .cart-count {
          background-color: #ffd700;
          color: #333333;
          font-size: 12px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 20px;
          text-align: center;
          /* 绝对定位到购物车图标的右上角 */
          position: absolute;
          top: -5px;
          right: -5px;
          z-index: 10;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .total-price {
          font-size: 18px;
          font-weight: bold;
          color: #ffffff;
          margin-left: 5px;
        }
      }
    
    /* 购物车操作按钮 */
    .cart-actions {
      display: flex;
      align-items: center;
      gap: 15px;
      
      
      
      /* 结算按钮 */
      .checkout-btn {
        background-color: #ffffff;
        color: #ee0a24;
        font-size: 18px;
        font-weight: 800;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        letter-spacing: 1px;
        text-transform: uppercase;
        padding: 10px 28px;
        border-radius: 24px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(238, 10, 36, 0.2);
        border: 2px solid #ee0a24;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        
        &:hover {
          background-color: #ee0a24;
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(238, 10, 36, 0.3);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        
        &:active {
          transform: translateY(0);
          box-shadow: 0 2px 6px rgba(238, 10, 36, 0.2);
        }
      }
    }
  }
}
</style>