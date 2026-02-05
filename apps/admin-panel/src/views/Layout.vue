<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside width="200px">
      <div class="logo">
        <h2>悦享茶歇</h2>
      </div>
      <el-menu 
        :default-active="activeMenu" 
        class="el-menu-vertical"
        @select="handleMenuSelect"
        background-color="#545c64"
        text-color="#fff"
        active-text-color="#9BCC0C"
      >
        <el-menu-item index="/products">
          <el-icon><Goods /></el-icon>
          <span>商品管理</span>
        </el-menu-item>
        <el-menu-item index="/categories">
          <el-icon><Menu /></el-icon>
          <span>分类管理</span>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon><ShoppingCart /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/banners">
          <el-icon><Picture /></el-icon>
          <span>Banner管理</span>
        </el-menu-item>
        <el-menu-item index="/specs">
          <el-icon><DataAnalysis /></el-icon>
          <span>规格管理</span>
        </el-menu-item>
        <el-menu-item index="/order-display">
          <el-icon><Monitor /></el-icon>
          <span>订单显示屏</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部导航栏 -->
      <el-header>
        <div class="header-left">
          <h3>{{ pageTitle }}</h3>
        </div>
        <div class="header-right">
          <span class="username">{{ username }}</span>
          <el-button @click="logout" size="small">退出登录</el-button>
        </div>
      </el-header>

      <!-- 内容区域 -->
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const activeMenu = ref('')
const username = ref('管理员')

// 页面标题映射
const pageTitleMap: Record<string, string> = {
  '/products': '商品管理',
  '/categories': '分类管理',
  '/orders': '订单管理',
  '/order-display': '订单显示屏',
  '/users': '用户管理',
  '/banners': 'Banner管理',
  '/specs': '规格管理',
  '/time-limited-products': '限时推荐商品管理'
}

const pageTitle = computed(() => {
  return pageTitleMap[route.path] || '管理后台'
})

watch(() => route.path, (newPath) => {
  activeMenu.value = newPath
}, { immediate: true })

const handleMenuSelect = (index: string) => {
  router.push(index)
}

const logout = () => {
  localStorage.removeItem('admin_token')
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.el-aside {
  background-color: #545c64;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #434a50;
  color: white;
}

.logo h2 {
  margin: 0;
  font-size: 18px;
}

.el-menu {
  border-right: none;
}

.el-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
}

.header-left h3 {
  margin: 0;
  color: #303133;
  font-size: 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.username {
  color: #606266;
  font-size: 14px;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>
