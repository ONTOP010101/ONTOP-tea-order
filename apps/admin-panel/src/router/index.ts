import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/views/Layout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  // 独立订单显示屏 - 不需要登录
  {
    path: '/screen',
    name: 'OrderDisplayScreen',
    component: () => import('@/views/OrderDisplayScreen.vue'),
    meta: { requiresAuth: false }
  },
  { path: '/', component: Layout, redirect: '/products', meta: { requiresAuth: true }, children: [
         { path: 'products', name: 'ProductManage', component: () => import('@/views/ProductManage.vue') },
         { path: 'categories', name: 'CategoryManage', component: () => import('@/views/CategoryManage.vue') },
         { path: 'orders', name: 'OrderManage', component: () => import('@/views/OrderManage.vue') },
         { path: 'order-test', name: 'OrderTest', component: () => import('@/views/SimpleOrderTest.vue') },
         { path: 'order-display', name: 'OrderDisplay', component: () => import('@/views/OrderDisplayScreen.vue') },
         { path: 'users', name: 'UserManage', component: () => import('@/views/UserManage.vue') },
         { path: 'banners', name: 'BannerManage', component: () => import('@/views/BannerManage.vue') },
         { path: 'specs', name: 'SpecManage', component: () => import('@/views/SpecManage.vue') },
         { path: 'time-limited-products', name: 'TimeLimitedProducts', component: () => import('@/views/TimeLimitedProducts.vue') }
       ]
     }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
