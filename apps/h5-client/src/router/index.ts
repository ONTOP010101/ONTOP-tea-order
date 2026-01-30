import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'LanguageSelect',
    component: () => import(/* webpackChunkName: "LanguageSelect" */ '@/views/LanguageSelect.vue'),
    meta: { title: 'selectLanguage', requiresAuth: false, skipLanguageCheck: true }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import(/* webpackChunkName: "Home" */ '@/views/Home.vue'),
    meta: { 
      title: 'home', 
      requiresAuth: false,
      // 预加载常见路由
      prefetch: ['Category', 'ProductDetail']
    }
  },
  {
    path: '/category',
    name: 'Category',
    component: () => import(/* webpackChunkName: "Category" */ '@/views/Category.vue'),
    meta: { 
      title: 'category', 
      requiresAuth: false,
      // 预加载产品详情页
      prefetch: ['ProductDetail']
    }
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: () => import(/* webpackChunkName: "ProductDetail" */ '@/views/ProductDetail.vue'),
    meta: { 
      title: 'productDetail', 
      requiresAuth: false,
      // 预加载购物车页
      prefetch: ['Cart']
    }
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import(/* webpackChunkName: "Cart" */ '@/views/Cart.vue'),
    meta: { 
      title: 'cart', 
      requiresAuth: false,
      // 预加载订单确认页
      prefetch: ['OrderConfirm']
    }
  },
  {
    path: '/order/confirm',
    name: 'OrderConfirm',
    component: () => import(/* webpackChunkName: "OrderConfirm" */ '@/views/OrderConfirm.vue'),
    meta: { title: 'confirmOrder', requiresAuth: false }
  },
  {
    path: '/order/list',
    name: 'OrderList',
    component: () => import(/* webpackChunkName: "OrderList" */ '@/views/OrderList.vue'),
    meta: { title: 'myOrders', requiresAuth: false }
  },
  {
    path: '/order/detail/:id',
    name: 'OrderDetail',
    component: () => import(/* webpackChunkName: "OrderDetail" */ '@/views/OrderDetail.vue'),
    meta: { title: 'orderDetail', requiresAuth: false }
  },
  {
    path: '/coupon',
    name: 'Coupon',
    component: () => import(/* webpackChunkName: "Coupon" */ '@/views/Coupon.vue'),
    meta: { title: 'myCoupons', requiresAuth: false }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import(/* webpackChunkName: "Profile" */ '@/views/Profile.vue'),
    meta: { title: 'profile', requiresAuth: false }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import(/* webpackChunkName: "Login" */ '@/views/Login.vue'),
    meta: { title: 'login', requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import(/* webpackChunkName: "Register" */ '@/views/Register.vue'),
    meta: { title: 'register', requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// 路由预加载函数
const prefetchRoutes = (routesToPrefetch: string[]) => {
  if (!routesToPrefetch || !Array.isArray(routesToPrefetch)) return
  
  // 组件预加载映射，存储每个路由对应的组件加载函数
  const componentLoaders: Record<string, () => Promise<any>> = {
    LanguageSelect: () => import('@/views/LanguageSelect.vue'),
    Home: () => import('@/views/Home.vue'),
    Category: () => import('@/views/Category.vue'),
    ProductDetail: () => import('@/views/ProductDetail.vue'),
    Cart: () => import('@/views/Cart.vue'),
    OrderConfirm: () => import('@/views/OrderConfirm.vue'),
    OrderList: () => import('@/views/OrderList.vue'),
    OrderDetail: () => import('@/views/OrderDetail.vue'),
    Coupon: () => import('@/views/Coupon.vue'),
    Profile: () => import('@/views/Profile.vue'),
    Login: () => import('@/views/Login.vue'),
    Register: () => import('@/views/Register.vue')
  }
  
  routesToPrefetch.forEach(routeName => {
    const loader = componentLoaders[routeName]
    if (loader) {
      try {
        // 触发组件的预加载，使用Promise.resolve()确保不会阻塞
        Promise.resolve().then(() => loader())
      } catch (error) {
        console.warn('Failed to prefetch route:', routeName, error)
      }
    }
  })
}

// 路由守卫
router.beforeEach((to, _from, next) => {
  // 简化路由守卫，移除语言选择检查
  // 语言选择检查在App.vue中处理
  
  // 检查登录权限 - 暂时移除useUserStore()调用，改为直接从localStorage获取
  const isLoggedIn = localStorage.getItem('is-logged-in') === 'true'
  if (to.meta.requiresAuth && !isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

// 路由后置守卫，用于预加载相关路由
router.afterEach((to) => {
  // 预加载指定的路由
  if (to.meta && to.meta.prefetch) {
    prefetchRoutes(to.meta.prefetch as string[])
  }
  
  // 动态设置页面标题
  if (to.meta.title) {
    document.title = String(to.meta.title)
  }
})

export default router
