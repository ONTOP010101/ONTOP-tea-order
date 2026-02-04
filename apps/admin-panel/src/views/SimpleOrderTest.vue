<template>
  <div class="simple-order-test">
    <h1>订单管理测试</h1>
    <p>这是一个简单的测试页面</p>
    <div style="background: white; padding: 20px; border: 1px solid #ccc; margin: 20px 0;">
      <p>测试内容：如果能看到这段文字，说明组件渲染正常</p>
      <p>当前时间：{{ currentTime }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const currentTime = ref('')

const updateTime = () => {
  currentTime.value = new Date().toLocaleString()
}

onMounted(() => {
  updateTime()
  setInterval(updateTime, 1000)
  console.log('SimpleOrderTest 组件挂载成功')
})
</script>

<style scoped>
.simple-order-test {
  padding: 20px;
}

h1 {
  color: #333;
  font-size: 24px;
  margin-bottom: 20px;
}

p {
  color: #666;
  font-size: 14px;
  margin: 10px 0;
}
</style>