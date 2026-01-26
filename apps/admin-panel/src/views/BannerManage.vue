<template>
  <div class="banner-manage">
    <el-card>
      <div class="header-actions">
        <h3>Banner列表</h3>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增Banner
        </el-button>
      </div>

      <!-- Banner列表 -->
      <el-table :data="banners" border style="margin-top: 20px" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="Banner图片" width="180">
          <template #default="{ row }">
            <el-image :src="getImageUrl(row.image)" style="width: 150px; height: 60px" fit="cover" />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" width="200" />
        <el-table-column prop="link" label="链接" width="250" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="100" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'">
              {{ row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="row.is_active ? 'warning' : 'success'"
              @click="handleToggleStatus(row)"
            >
              {{ row.is_active ? '禁用' : '启用' }}
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="resetForm"
    >
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="Banner标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入Banner标题" />
        </el-form-item>

        <el-form-item label="Banner链接" prop="link">
          <el-input v-model="formData.link" placeholder="请输入Banner链接（可选）" />
        </el-form-item>

        <el-form-item label="Banner图片" prop="image">
          <el-upload
            class="image-uploader"
            :action="`${API_BASE}/upload`"
            :show-file-list="false"
            :on-success="handleImageSuccess"
            :before-upload="beforeImageUpload"
            accept="image/*"
          >
            <el-image v-if="formData.image" :src="getImageUrl(formData.image)" class="uploaded-image" fit="cover" />
            <el-icon v-else class="image-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div style="margin-top: 10px; font-size: 12px; color: #999">点击上传图片，支持jpg/png格式，建议尺寸：750x300</div>
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" :step="1" />
          <span style="margin-left: 10px; color: #999; font-size: 12px;">数字越小越靠前</span>
        </el-form-item>

        <el-form-item label="状态" prop="is_active">
          <el-radio-group v-model="formData.is_active">
            <el-radio :label="true">启用</el-radio>
            <el-radio :label="false">禁用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="开始时间">
          <el-date-picker
            v-model="formData.start_time"
            type="datetime"
            placeholder="选择开始时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>

        <el-form-item label="结束时间">
          <el-date-picker
            v-model="formData.end_time"
            type="datetime"
            placeholder="选择结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
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

// 数据
const banners = ref([])
const loading = ref(false)

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('新增Banner')
const submitting = ref(false)
const formRef = ref<FormInstance>()

const formData = reactive({
  id: null,
  title: '',
  link: '',
  image: '',
  sort: 0,
  is_active: true,
  start_time: null,
  end_time: null
})

const rules = {
  title: [{ required: true, message: '请输入Banner标题', trigger: 'blur' }],
  image: [{ required: true, message: '请上传Banner图片', trigger: 'change' }]
}

// 获取完整图片URL
const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) return ''
  return imageUrl.startsWith('http') ? imageUrl : imageUrl
}

// 加载Banner列表
const loadBanners = async () => {
  loading.value = true
  try {
    const params: any = {
      includeInactive: 'true'  // 包含禁用的Banner
    }
    
    const { data } = await axios.get(`${API_BASE}/banners`, {
      params,
      timeout: 15000, // 15秒超时
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (data.code === 200) {
      banners.value = (data.data || []).map((banner: any) => {
        // 将日期字符串转换为Date对象
        return {
          ...banner,
          start_time: banner.start_time ? new Date(banner.start_time) : null,
          end_time: banner.end_time ? new Date(banner.end_time) : null
        }
      })
    } else {
      banners.value = []
    }
  } catch (error: any) {
    // 更详细的错误处理
    let errorMsg = '加载Banner列表失败'
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
    banners.value = []
  } finally {
    loading.value = false
  }
}

// 新增Banner
const handleAdd = () => {
  dialogTitle.value = '新增Banner'
  resetForm()
  dialogVisible.value = true
}

// 编辑Banner
const handleEdit = (row: any) => {
  dialogTitle.value = '编辑Banner'
  formData.id = row.id
  formData.title = row.title
  formData.link = row.link || ''
  formData.image = row.image
  formData.sort = row.sort || 0
  formData.is_active = row.is_active
  // 将日期字符串转换为Date对象
  formData.start_time = row.start_time ? new Date(row.start_time) : null
  formData.end_time = row.end_time ? new Date(row.end_time) : null
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
        title: formData.title,
        link: formData.link,
        image: formData.image,
        sort: formData.sort,
        is_active: formData.is_active,
        start_time: formData.start_time,
        end_time: formData.end_time
      }

      if (formData.id) {
        // 更新
        await axios.put(`${API_BASE}/banners/${formData.id}`, payload)
        ElMessage.success('更新成功')
      } else {
        // 新增
        await axios.post(`${API_BASE}/banners`, payload)
        ElMessage.success('新增成功')
      }

      dialogVisible.value = false
      loadBanners()
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

// 切换启用/禁用状态
const handleToggleStatus = async (row: any) => {
  const newStatus = !row.is_active
  const action = newStatus ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(`确定要${action}该Banner吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await axios.put(`${API_BASE}/banners/${row.id}`, { is_active: newStatus })
    ElMessage.success(`${action}成功`)
    loadBanners()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || `${action}失败`)
    }
  }
}

// 删除Banner
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该Banner吗？删除后无法恢复！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    })

    await axios.delete(`${API_BASE}/banners/${row.id}`)
    ElMessage.success('删除成功')
    loadBanners()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

// 重置表单
const resetForm = () => {
  formData.id = null
  formData.title = ''
  formData.link = ''
  formData.image = ''
  formData.sort = 0
  formData.is_active = true
  formData.start_time = null
  formData.end_time = null
  formRef.value?.clearValidate()
}

// 图片上传成功处理
const handleImageSuccess = (response: any) => {
  // 处理统一响应格式：{ code, message, data: { ...bannerData } }
  let imageUrl = ''
  
  if (response.code === 200 && response.data) {
    const innerData = response.data
    if (innerData.success && innerData.data?.url) {
      imageUrl = innerData.data.url
    } else if (innerData.url) {
      imageUrl = innerData.url
    }
  } else if (response.success && response.data?.url) {
    imageUrl = response.data.url
  } else if (response.url) {
    imageUrl = response.url
  }
  
  if (imageUrl) {
    // 直接使用相对路径，通过代理访问
    formData.image = imageUrl.startsWith('http') ? imageUrl : imageUrl
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error('图片上传失败：无法获取图片URL')
  }
}

// 图片上传前验证
const beforeImageUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

onMounted(() => {
  loadBanners()
})
</script>

<style scoped>
.banner-manage {
  min-height: calc(100vh - 120px);
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

h3 {
  margin: 0;
  color: #333;
}

.image-uploader {
  display: inline-block;
}

.image-uploader :deep(.el-upload) {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  width: 200px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-uploader :deep(.el-upload:hover) {
  border-color: #409eff;
}

.image-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.uploaded-image {
  width: 200px;
  height: 80px;
  display: block;
}
</style>