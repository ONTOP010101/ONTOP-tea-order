<template>
  <div class="time-limited-products">
    <el-card>
      <div class="header-actions">
        <h3>限时推荐商品管理</h3>
        <div class="action-buttons">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增限时商品
          </el-button>
        </div>
      </div>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索商品名称"
          style="width: 300px"
          clearable
          @clear="loadTimeLimitedProducts"
        >
          <template #append>
            <el-button :icon="Search" @click="loadTimeLimitedProducts" />
          </template>
        </el-input>
        <el-select v-model="searchStatus" placeholder="选择状态" clearable @change="loadTimeLimitedProducts" style="width: 200px; margin-left: 10px">
          <el-option label="全部状态" value="" />
          <el-option label="未开始" value="0" />
          <el-option label="进行中" value="1" />
          <el-option label="已结束" value="2" />
        </el-select>
      </div>

      <!-- 限时商品列表 -->
      <el-table v-if="viewMode === 'table'" :data="timeLimitedProducts" border style="margin-top: 20px" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="商品图片" width="120">
          <template #default="{ row }">
            <el-image :src="getImageUrl(row.product?.image)" style="width: 80px; height: 80px" fit="cover" />
          </template>
        </el-table-column>
        <el-table-column label="商品名称" width="200">
          <template #default="{ row }">
            {{ row.product?.name }}
          </template>
        </el-table-column>
        <el-table-column label="开始时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.start_time) }}
          </template>
        </el-table-column>
        <el-table-column label="结束时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.end_time) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 卡片视图 -->
      <div v-else-if="viewMode === 'card'" class="product-cards" v-loading="loading">
        <el-card v-for="item in timeLimitedProducts" :key="item.id" class="product-card">
          <div class="card-image">
            <el-image :src="getImageUrl(item.product?.image)" fit="cover" />
          </div>
          <div class="card-content">
            <h4 class="product-name">{{ item.product?.name }}</h4>
            <div class="time-info">
              <div class="time-item">
                <span class="label">开始时间：</span>
                <span class="value">{{ formatTime(item.start_time) }}</span>
              </div>
              <div class="time-item">
                <span class="label">结束时间：</span>
                <span class="value">{{ formatTime(item.end_time) }}</span>
              </div>
            </div>
            <div class="product-status">
              <el-tag :type="getStatusType(item.status)">
                {{ getStatusText(item.status) }}
              </el-tag>
            </div>
            <div class="card-actions">
              <el-button size="small" @click="handleEdit(item)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(item)">删除</el-button>
            </div>
          </div>
        </el-card>
        <div v-if="timeLimitedProducts.length === 0" class="empty-cards">
          <el-empty description="暂无限时推荐商品" :image-size="100" />
        </div>
      </div>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadTimeLimitedProducts"
        @current-change="loadTimeLimitedProducts"
        style="margin-top: 20px; justify-content: center"
      />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="resetForm"
    >
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="选择商品" prop="product_id">
          <el-select v-model="formData.product_id" placeholder="请选择商品" style="width: 100%" filterable>
            <el-option v-for="product in availableProducts" :key="product.id" :label="product.name" :value="product.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="开始时间" prop="start_time">
          <el-date-picker
            v-model="formData.start_time"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>

        <el-form-item label="结束时间" prop="end_time">
          <el-date-picker
            v-model="formData.end_time"
            type="datetime"
            placeholder="选择结束时间"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>

        <el-form-item label="推荐排序" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" />
          <span style="margin-left: 10px; color: #999; font-size: 12px;">数字越大越靠前</span>
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
import { Search, Plus, Grid, List } from '@element-plus/icons-vue'
import axios from 'axios'

const API_BASE = '/api'  // 使用相对路径，通过Vite代理转发

// 数据
const timeLimitedProducts = ref([])
const availableProducts = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const searchStatus = ref('')
const viewMode = ref('table') // table 或 card

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('新增限时商品')
const submitting = ref(false)
const formRef = ref<FormInstance>()

const formData = reactive({
  id: null,
  product_id: null,
  start_time: '',
  end_time: '',
  sort: 0
})

const rules = {
  product_id: [{ required: true, message: '请选择商品', trigger: 'change' }],
  start_time: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  end_time: [{ required: true, message: '请选择结束时间', trigger: 'change' }]
}

// 加载限时推荐商品列表
const loadTimeLimitedProducts = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (searchStatus.value) params.status = searchStatus.value

    const { data } = await axios.get(`${API_BASE}/time-limited-products`, { 
      params,
      timeout: 15000,
      withCredentials: true
    })
    
    if (data.code === 200) {
      // 处理嵌套的数据结构
      const responseData = data.data.data ? data.data.data : data.data
      // 处理时间字符串格式
      const processedList = (responseData.list || []).map((item: any) => {
        // 处理开始时间
        let startTime = item.start_time
        if (startTime) {
          // 如果是ISO格式的时间字符串，转换为本地时间格式
          if (startTime.includes('T')) {
            const date = new Date(startTime)
            startTime = date.toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            }).replace(/\//g, '-')
          }
        }
        
        // 处理结束时间
        let endTime = item.end_time
        if (endTime) {
          // 如果是ISO格式的时间字符串，转换为本地时间格式
          if (endTime.includes('T')) {
            const date = new Date(endTime)
            endTime = date.toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            }).replace(/\//g, '-')
          }
        }
        
        return {
          ...item,
          start_time: startTime,
          end_time: endTime
        }
      })
      timeLimitedProducts.value = processedList
      pagination.total = responseData.total || 0
    } else {
      timeLimitedProducts.value = []
      pagination.total = 0
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '加载限时推荐商品列表失败')
    timeLimitedProducts.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 加载可用商品列表
const loadAvailableProducts = async () => {
  try {
    console.log('开始加载可用商品列表...')
    const { data } = await axios.get(`${API_BASE}/products`, {
      params: {
        page: 1,
        pageSize: 10000, // 增加pageSize以加载更多商品
        status: 'all'
      },
      timeout: 15000,
      withCredentials: true
    })
    
    console.log('收到的数据:', data)
    
    // 处理后端返回的数据格式：{code: 200, message: 'success', data: {list: [...], total: ...}}
    if (data && data.code === 200 && data.data && data.data.list) {
      availableProducts.value = data.data.list || []
      // 调试：打印商品列表
      console.log('可用商品数量:', availableProducts.value.length)
      console.log('可用商品列表:', availableProducts.value.map(p => p.name))
    } else {
      console.log('数据格式不正确，设置为空数组')
      availableProducts.value = []
    }
  } catch (error: any) {
    console.error('加载可用商品列表失败:', error)
    ElMessage.error('加载可用商品列表失败')
    availableProducts.value = []
  }
}

// 新增限时商品
const handleAdd = () => {
  dialogTitle.value = '新增限时商品'
  resetForm()
  dialogVisible.value = true
}

// 编辑限时商品
const handleEdit = (row: any) => {
  dialogTitle.value = '编辑限时商品'
  formData.id = row.id
  formData.product_id = row.product_id
  formData.start_time = row.start_time
  formData.end_time = row.end_time
  formData.sort = row.sort || 0
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      const payload: any = {
        product_id: formData.product_id,
        start_time: formData.start_time,
        end_time: formData.end_time,
        sort: formData.sort
      }

      if (formData.id) {
        // 更新
        await axios.put(`${API_BASE}/time-limited-products/${formData.id}`, payload)
        ElMessage.success('更新成功')
      } else {
        // 新增
        await axios.post(`${API_BASE}/time-limited-products`, payload)
        ElMessage.success('新增成功')
      }

      dialogVisible.value = false
      loadTimeLimitedProducts()
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

// 删除限时商品
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该限时推荐商品吗？删除后无法恢复！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    })

    await axios.delete(`${API_BASE}/time-limited-products/${row.id}`)
    ElMessage.success('删除成功')
    loadTimeLimitedProducts()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

// 重置表单
const resetForm = () => {
  formData.id = null
  formData.product_id = null
  formData.start_time = ''
  formData.end_time = ''
  formData.sort = 0
  formRef.value?.clearValidate()
}

// 获取图片URL
const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) return ''
  
  if (imageUrl.startsWith('http')) {
    return imageUrl
  }
  if (imageUrl.startsWith('/')) {
    return `http://localhost:3003${imageUrl}`
  }
  return `http://localhost:3003/uploads/${imageUrl}`
}

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 商品选择器搜索方法
const filterProducts = (query: string, option: any) => {
  return option && option.label ? option.label.toLowerCase().includes(query.toLowerCase()) : false
}

// 远程搜索方法
const remoteSearch = async (query: string) => {
  if (query) {
    try {
      const { data } = await axios.get(`${API_BASE}/products`, {
        params: {
          page: 1,
          pageSize: 10000, // 增加pageSize以加载更多商品
          keyword: query,
          status: 'all'
        },
        timeout: 15000,
        withCredentials: true
      })
      
      // 处理后端返回的数据格式：{code: 200, message: 'success', data: {list: [...], total: ...}}
      if (data && data.code === 200 && data.data && data.data.list) {
        availableProducts.value = data.data.list || []
        console.log('搜索结果:', availableProducts.value.map(p => p.name))
      }
    } catch (error: any) {
      console.error('搜索商品失败:', error)
      availableProducts.value = []
    }
  } else {
    // 如果搜索关键词为空，加载所有商品
    await loadAvailableProducts()
  }
}

// 获取状态类型
const getStatusType = (status: number) => {
  switch (status) {
    case 0: return 'info'
    case 1: return 'success'
    case 2: return 'warning'
    default: return 'default'
  }
}

// 获取状态文本
const getStatusText = (status: number) => {
  switch (status) {
    case 0: return '未开始'
    case 1: return '进行中'
    case 2: return '已结束'
    default: return '未知'
  }
}

// 定时器引用
let refreshTimer: number | null = null

// 无感刷新状态
const refreshStatus = async () => {
  try {
    const { data } = await axios.get(`${API_BASE}/time-limited-products`, {
      params: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        keyword: searchKeyword.value,
        status: searchStatus.value
      },
      timeout: 15000,
      withCredentials: true
    })
    
    if (data.code === 200 && data.data && data.data.list) {
      const newList = data.data.list
      
      // 只更新状态字段，保持其他数据不变
      timeLimitedProducts.value.forEach((item: any, index: number) => {
        const newItem = newList.find((i: any) => i.id === item.id)
        if (newItem && newItem.status !== item.status) {
          // 只更新状态字段，不影响其他数据
          timeLimitedProducts.value[index].status = newItem.status
          console.log(`更新商品 ${item.product.name} 的状态为: ${newItem.status}`)
        }
      })
    }
  } catch (error: any) {
    console.error('刷新状态失败:', error)
  }
}

onMounted(() => {
  loadTimeLimitedProducts()
  loadAvailableProducts()
  
  // 设置定时器，每30秒刷新一次状态
  refreshTimer = window.setInterval(() => {
    console.log('自动刷新限时商品状态...')
    refreshStatus()
  }, 30000) // 30秒
})

onUnmounted(() => {
  // 清除定时器
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>

<style scoped>
.time-limited-products {
  min-height: calc(100vh - 120px);
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  align-items: center;
}

.search-bar {
  display: flex;
  margin-bottom: 20px;
}

h3 {
  margin: 0;
  color: #333;
}

/* 卡片视图样式 */
.product-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.product-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.card-image {
  height: 200px;
  overflow: hidden;
  border-radius: 4px 4px 0 0;
}

.card-image :deep(.el-image) {
  width: 100%;
  height: 100%;
}

.card-content {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.product-name {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time-info {
  margin-bottom: 12px;
}

.time-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.time-item .label {
  color: #666;
}

.time-item .value {
  color: #333;
  font-weight: 500;
}

.product-status {
  margin-bottom: 16px;
}

.card-actions {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
}

.card-actions :deep(.el-button) {
  flex: 1;
  margin: 0 4px;
}

.empty-cards {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px 0;
}
</style>