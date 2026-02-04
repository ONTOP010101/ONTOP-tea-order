<template>
  <div class="test-order">
    <h1>测试订单页面</h1>
    <p>测试数据: {{ testData }}</p>
    <el-button @click="loadTestData">加载测试数据</el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

const testData = ref('初始数据')

const loadTestData = async () => {
  try {
    const { data } = await axios.get('/api/orders/admin/all')
    console.log('测试数据:', data)
    testData.value = JSON.stringify(data, null, 2)
  } catch (error) {
    console.error('加载失败:', error)
    testData.value = '加载失败'
  }
}

onMounted(() => {
  loadTestData()
})
</script>

<style scoped>
.test-order {
  padding: 20px;
}
</style>