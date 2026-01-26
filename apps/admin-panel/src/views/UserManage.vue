<template>
  <div class="user-manage">
    <el-card>
      <div class="header-actions">
        <h3>用户管理</h3>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增用户
        </el-button>
      </div>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户名/昵称/手机号"
          style="width: 300px"
          clearable
          @clear="loadUsers"
        >
          <template #append>
            <el-button :icon="Search" @click="loadUsers" />
          </template>
        </el-input>
        <el-select v-model="searchRole" placeholder="选择角色" clearable @change="loadUsers" style="width: 150px; margin-left: 10px">
          <el-option label="全部角色" value="" />
          <el-option label="管理员" value="admin" />
          <el-option label="普通用户" value="user" />
        </el-select>
      </div>

      <!-- 用户列表 -->
      <el-table :data="users" border style="margin-top: 20px" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="头像" width="100">
          <template #default="{ row }">
            <el-avatar :src="getImageUrl(row.avatar)" />
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="nickname" label="昵称" width="150" />
        <el-table-column prop="phone" label="手机号" width="150" />
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'primary'">
              {{ row.role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="warning" @click="handleResetPassword(row)">重置密码</el-button>
            <el-button 
              size="small" 
              :type="row.role === 'admin' ? 'info' : 'success'"
              @click="handleToggleRole(row)"
              :disabled="row.username === 'admin'"
            >
              {{ row.role === 'admin' ? '降为普通' : '设为管理' }}
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDelete(row)"
              :disabled="row.username === 'admin'"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100, 500]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadUsers"
        @current-change="loadUsers"
        style="margin-top: 20px; justify-content: center"
      />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="resetForm"
    >
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" placeholder="请输入用户名" :disabled="!!formData.id" />
        </el-form-item>

        <el-form-item label="密码" prop="password" v-if="!formData.id">
          <el-input v-model="formData.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>

        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="formData.nickname" placeholder="请输入昵称" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入手机号" />
        </el-form-item>

        <el-form-item label="头像URL" prop="avatar">
          <el-input v-model="formData.avatar" placeholder="请输入头像URL" />
          <el-avatar v-if="formData.avatar" :src="getImageUrl(formData.avatar)" style="margin-top: 10px" :size="80" />
        </el-form-item>

        <el-form-item label="用户角色" prop="role">
          <el-radio-group v-model="formData.role">
            <el-radio label="user">普通用户</el-radio>
            <el-radio label="admin">管理员</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import axios from 'axios'

const API_BASE = '/api'  // 使用相对路径，通过Vite代理转发

const users = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const searchRole = ref('')

const pagination = reactive({
  page: 1,
  pageSize: 500,
  total: 0
})

const dialogVisible = ref(false)
const dialogTitle = ref('新增用户')
const submitting = ref(false)
const formRef = ref<FormInstance>()

const formData = reactive({
  id: null,
  username: '',
  password: '',
  nickname: '',
  phone: '',
  avatar: '',
  role: 'user'
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度3-20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }]
}

const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) return ''
  return imageUrl.startsWith('http') ? imageUrl : imageUrl
}

const loadUsers = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (searchRole.value) params.role = searchRole.value

    const { data } = await axios.get(`${API_BASE}/users`, { 
      params,
      timeout: 15000, // 增加超时时间到15秒
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (data.code === 200) {
      users.value = data.data.list || []
      pagination.total = data.data.total || 0
    } else {
      users.value = []
      pagination.total = 0
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '加载用户列表失败，请检查网络连接')
    users.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  dialogTitle.value = '新增用户'
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑用户'
  formData.id = row.id
  formData.username = row.username
  formData.nickname = row.nickname
  formData.phone = row.phone || ''
  formData.avatar = row.avatar || ''
  formData.role = row.role
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      const payload: any = {
        username: formData.username,
        nickname: formData.nickname,
        phone: formData.phone,
        avatar: formData.avatar,
        role: formData.role
      }

      if (formData.id) {
        await axios.put(`${API_BASE}/users/${formData.id}`, payload)
        ElMessage.success('更新成功')
      } else {
        payload.password = formData.password
        await axios.post(`${API_BASE}/users`, payload)
        ElMessage.success('新增成功')
      }

      dialogVisible.value = false
      loadUsers()
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

const handleToggleRole = async (row: any) => {
  const newRole = row.role === 'admin' ? 'user' : 'admin'
  const action = newRole === 'admin' ? '设为管理员' : '降为普通用户'

  try {
    await ElMessageBox.confirm(`确定要${action}吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await axios.put(`${API_BASE}/users/${row.id}/role`, { role: newRole })
    ElMessage.success(`${action}成功`)
    loadUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || `${action}失败`)
    }
  }
}

const handleResetPassword = async (row: any) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入新密码（至少6位）', '重置密码', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /.{6,}/,
      inputErrorMessage: '密码至少6个字符'
    })

    await axios.put(`${API_BASE}/users/${row.id}/password`, { password: value })
    ElMessage.success('密码重置成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '重置密码失败')
    }
  }
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该用户吗？删除后无法恢复！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    })

    await axios.delete(`${API_BASE}/users/${row.id}`)
    ElMessage.success('删除成功')
    loadUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const resetForm = () => {
  formData.id = null
  formData.username = ''
  formData.password = ''
  formData.nickname = ''
  formData.phone = ''
  formData.avatar = ''
  formData.role = 'user'
  formRef.value?.clearValidate()
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-manage {
  padding: 20px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-bar {
  display: flex;
  margin-bottom: 20px;
}

h3 {
  margin: 0;
  color: #333;
}
</style>
