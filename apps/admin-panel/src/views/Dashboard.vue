<template>
  <div class="dashboard">
    <!-- 待处理订单 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold;">待处理订单</span>
          <el-button size="small" type="primary" @click="goToOrders">查看全部</el-button>
        </div>
      </template>
      <el-table :data="[]" border>
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column prop="userName" label="用户" width="120" />
        <el-table-column prop="amount" label="金额" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default>
            <el-tag type="warning">待制作</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="time" label="下单时间" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default>
            <el-button size="small" type="primary">处理</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="true" description="暂无待处理订单" :image-size="100" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToOrders = () => {
  router.push('/orders')
}
</script>

<style scoped>
.dashboard {
  min-height: calc(100vh - 120px);
}

.stat-card {
  text-align: center;
  padding: 20px 0;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #9BCC0C;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #999;
}
</style>
