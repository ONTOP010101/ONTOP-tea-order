<template>
  <div class="order-manage">
    <el-card>
      <div class="header-actions">
        <h3>订单管理</h3>
        <div>
          <el-button type="primary" @click="exportOrders" style="margin-right: 10px">
            导出Excel
          </el-button>
          <el-button type="default" @click="handleSelectAll">
            全选
          </el-button>
          <el-button type="default" @click="handleClearSelection" style="margin-left: 10px">
            清除选择
          </el-button>
        </div>
      </div>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索订单号"
          style="width: 300px"
          clearable
          @clear="loadOrders"
        >
          <template #append>
            <el-button :icon="Search" @click="loadOrders" />
          </template>
        </el-input>
      </div>

      <!-- 订单列表 -->
      <el-table :data="orders" border style="margin: 20px auto; width: 98%;" v-loading="loading" align="center" ref="orderTableRef">
        <!-- 复选框列 -->
        <el-table-column type="selection" width="55" />
        
        <!-- 展开行 -->
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="order-detail-content">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="订单号">{{ row.order_no.slice(-8) }}</el-descriptions-item>
                <el-descriptions-item label="下单时间">{{ formatDate(row.created_at) }}</el-descriptions-item>
                <el-descriptions-item label="备注" :span="2">{{ row.remark || '无' }}</el-descriptions-item>
              </el-descriptions>

              <h4 style="margin-top: 20px">商品清单</h4>
              <el-table :data="row.items" border style="margin-top: 10px">
                <el-table-column label="商品图片" width="100">
                  <template #default="{ row: itemRow }">
                    <el-image :src="itemRow.image" style="width: 60px; height: 60px" fit="cover" />
                  </template>
                </el-table-column>
                <el-table-column prop="name" label="商品名称" />
                <el-table-column label="单价" width="120">
                  <template #default="{ row: itemRow }">¥{{ itemRow.price }}</template>
                </el-table-column>
                <el-table-column prop="quantity" label="数量" width="80" />
                <el-table-column label="小计" width="120">
                  <template #default="{ row: itemRow }">
                    <span style="color: #f56c6c; font-weight: bold">¥{{ (itemRow.price * itemRow.quantity).toFixed(2) }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="order_no" label="订单号" min-width="180">
          <template #default="{ row }">
            {{ row.order_no.slice(-8) }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="下单时间" min-width="220">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
        <el-table-column label="订单状态" min-width="120">
          <template #default="{ row }">
            <el-button 
              size="small" 
              type="success" 
              @click="handleUpdateStatus(row, 'preparing')"
              v-if="row.status === 'pending'"
            >
              开始备餐
            </el-button>
            <el-button 
              size="small" 
              type="primary" 
              @click="handleUpdateStatus(row, 'completed')"
              v-if="row.status === 'preparing' || row.status === 'processing' || row.status === 'making' || row.status === 'ready'"
            >
              已出餐
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleUpdateStatus(row, 'cancelled')"
              v-if="row.status === 'pending'"
            >
              取消
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
        @size-change="loadOrders"
        @current-change="loadOrders"
        style="margin-top: 20px; justify-content: center"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElTable } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import axios from 'axios'

const API_BASE = '/api'  // 使用相对路径，通过Vite代理转发

const orders = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const orderTableRef = ref<InstanceType<typeof ElTable> | null>(null)

const pagination = reactive({
  page: 1,
  pageSize: 500,
  total: 0
})

// 全选
const handleSelectAll = () => {
  if (orderTableRef.value) {
    orderTableRef.value.toggleAllSelection()
  }
}

// 清除选择
const handleClearSelection = () => {
  if (orderTableRef.value) {
    orderTableRef.value.clearSelection()
  }
}

const loadOrders = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchKeyword.value) params.keyword = searchKeyword.value

    const { data } = await axios.get(`${API_BASE}/orders/admin/all`, {
      params,
      timeout: 15000, // 15秒超时
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (data.code === 200) {
      orders.value = data.data.list || []
      pagination.total = data.data.total || 0
    } else {
      orders.value = []
      pagination.total = 0
    }
  } catch (error: any) {
    // 更详细的错误处理
    let errorMsg = '加载订单列表失败'
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      errorMsg = '⚠️ 无法连接到后端服务，请确保后端服务已启动'
    } else if (error.code === 'ECONNABORTED') {
      errorMsg = '⚠️ 请求超时，请检查网络连接'
    } else if (error.response) {
      errorMsg = error.response.data?.message || `服务器错误 (${error.response.status})`
    }
    
    ElMessage.error({
      message: errorMsg,
      duration: 5000,
      showClose: true
    })
    orders.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const handleUpdateStatus = async (row: any, status: string) => {
  const statusMap: any = {
    shipping: '发货',
    completed: '完成',
    cancelled: '取消'
  }
  const action = statusMap[status]

  try {
    await ElMessageBox.confirm(`确定要${action}该订单吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await axios.put(`${API_BASE}/orders/${row.id}/status`, { status })
    ElMessage.success(`${action}成功`)
    loadOrders()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || `${action}失败`)
    }
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 导出订单为Excel
const exportOrders = async () => {
  try {
    let selectedOrders = []
    // 获取选中的订单
    if (orderTableRef.value) {
      selectedOrders = orderTableRef.value.getSelectionRows()
    }
    
    const params: any = {}
    if (searchKeyword.value) params.keyword = searchKeyword.value
    
    // 如果有选中的订单，添加id参数
    if (selectedOrders.length > 0) {
      params.ids = selectedOrders.map((order: any) => order.id).join(',')
    }

    // 直接下载文件
    window.open(`${API_BASE}/orders/admin/export?${new URLSearchParams(params)}`, '_blank')
    ElMessage.success('正在导出订单数据...')
  } catch (error: any) {
    let errorMsg = '导出订单失败'
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      errorMsg = '⚠️ 无法连接到后端服务，请确保后端服务已启动'
    } else if (error.code === 'ECONNABORTED') {
      errorMsg = '⚠️ 请求超时，请检查网络连接'
    } else if (error.response) {
      errorMsg = error.response.data?.message || `服务器错误 (${error.response.status})`
    }
    
    ElMessage.error({
      message: errorMsg,
      duration: 5000,
      showClose: true
    })
  }
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.order-manage {
  padding: 10px;
}

.el-card {
  padding: 10px;
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

h4 {
  margin: 10px 0;
  color: #666;
}
</style>
