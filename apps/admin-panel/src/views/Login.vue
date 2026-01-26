<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2>悦享茶歇管理后台</h2>
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="login" :loading="loading" style="width: 100%">
            登录
          </el-button>
        </el-form-item>
      </el-form>

    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const form = ref({
  username: 'admin',
  password: '123456'
})
const loading = ref(false)

const login = () => {
  loading.value = true
  setTimeout(() => {
    localStorage.setItem('admin_token', 'mock_token')
    ElMessage.success('登录成功')
    router.push('/products')
    loading.value = false
  }, 1000)
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #9BCC0C, #CAD8D8);
}

.login-card {
  width: 400px;
  text-align: center;
}

h2 {
  margin-bottom: 30px;
  color: #534832;
}

.tip {
  margin-top: 10px;
  font-size: 12px;
  color: #999;
}
</style>
