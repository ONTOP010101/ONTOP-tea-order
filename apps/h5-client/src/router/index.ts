import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

// 静态导入组件，解决动态导入失败问题
import LanguageSelect from '@/views/LanguageSelect.vue'
import Home from '@/views/Home.vue'
import Category from '@/views/Category.vue'
import ProductDetail from '@/views/ProductDetail.vue'
import Cart from '@/views/Cart.vue'
import OrderConfirm from '@/views/OrderConfirm.vue'
import OrderList from '@/views/OrderList.vue'
import OrderDetail from '@/views/OrderDetail.vue'
import Coupon from '@/views/Coupon.vue'
import Profile from '@/views/Profile.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'LanguageSelect',
    component: LanguageSelect,
    meta: { title: 'selectLanguage', requiresAuth: false, skipLanguageCheck: true }
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: { title: 'home', requiresAuth: false }
  },
  {
    path: '/category',
    name: 'Category',
    component: Category,
    meta: { title: 'category', requiresAuth: false }
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: ProductDetail,
    meta: { title: 'productDetail', requiresAuth: false }
  },
  {
    path: '/cart',
    name: 'Cart',
    component: Cart,
    meta: { title: 'cart', requiresAuth: false }
  },
  {
    path: '/order/confirm',
    name: 'OrderConfirm',
    component: OrderConfirm,
    meta: { title: 'confirmOrder', requiresAuth: false }
  },
  {
    path: '/order/list',
    name: 'OrderList',
    component: OrderList,
    meta: { title: 'myOrders', requiresAuth: false }
  },
  {
    path: '/order/detail/:id',
    name: 'OrderDetail',
    component: OrderDetail,
    meta: { title: 'orderDetail', requiresAuth: false }
  },
  {
    path: '/coupon',
    name: 'Coupon',
    component: Coupon,
    meta: { title: 'myCoupons', requiresAuth: false }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { title: 'profile', requiresAuth: false }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: 'login', requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
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

export default router
