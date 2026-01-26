<template>
  <div class="category-manage">
    <el-card>
      <div class="header-actions">
        <h3>分类管理</h3>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增分类
        </el-button>
      </div>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索分类名称"
          style="width: 300px"
          clearable
          @clear="loadCategories"
        >
          <template #append>
            <el-button :icon="Search" @click="loadCategories" />
          </template>
        </el-input>
      </div>

      <!-- 分类列表 -->
      <el-table :data="categories" border style="margin-top: 20px" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="分类图标" width="100">
          <template #default="{ row }">
            <el-image :src="getImageUrl(row.icon)" style="width: 50px; height: 50px" fit="cover" />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="分类名称" width="200" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="sort" label="排序" width="100" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="resetForm"
    >
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="分类名称" prop="name">
          <el-input 
            v-model="formData.name" 
            placeholder="请输入中文分类名称" 
            @input="handleChineseInput('name')"
          />
        </el-form-item>

        <el-alert
          title="💡 智能提示"
          type="success"
          :closable="false"
          style="margin-bottom: 15px"
        >
          只需填写中文名称,系统将自动翻译为英语、阿拉伯语、西班牙语、葡萄牙语
        </el-alert>

        <el-form-item label="英文名称">
          <el-input v-model="formData.name_en" placeholder="自动翻译生成" />
        </el-form-item>

        <el-form-item label="阿拉伯语名称">
          <el-input v-model="formData.name_ar" placeholder="自动翻译生成" />
        </el-form-item>

        <el-form-item label="西班牙语名称">
          <el-input v-model="formData.name_es" placeholder="自动翻译生成" />
        </el-form-item>

        <el-form-item label="葡萄牙语名称">
          <el-input v-model="formData.name_pt" placeholder="自动翻译生成" />
        </el-form-item>

        <el-form-item label="分类图标">
          <el-upload
            class="icon-uploader"
            :action="`${API_BASE}/upload`"
            :show-file-list="false"
            :on-success="handleIconSuccess"
            :before-upload="beforeIconUpload"
            accept="image/*"
          >
            <el-image v-if="formData.icon" :src="getImageUrl(formData.icon)" class="uploaded-icon" fit="cover" />
            <el-icon v-else class="icon-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div style="margin-top: 10px; font-size: 12px; color: #999">点击上传图标，支持jpg/png格式</div>
        </el-form-item>

        <el-form-item label="分类描述" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入分类描述" />
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" />
          <div style="font-size: 12px; color: #999; margin-top: 5px">数字越小越靠前</div>
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
import { Plus, Search } from '@element-plus/icons-vue'
import axios from 'axios'

const API_BASE = '/api'  // 使用相对路径，通过Vite代理转发

// 翻译相关
const translating = ref(false)

// 数据
const categories = ref([])
const loading = ref(false)
const searchKeyword = ref('')

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('新增分类')
const submitting = ref(false)
const formRef = ref<FormInstance>()

// 调用后端翻译API
const callTranslationAPI = async (text: string): Promise<{ en: string; ar: string; es: string; pt: string }> => {
  try {
    const response = await axios.post(`${API_BASE}/translation/translate`, { text })
    if (response.data.code === 200) {
      return response.data.data
    }
    throw new Error(response.data.message || '翻译失败')
  } catch (error) {
    console.error('调用翻译API失败:', error)
    // 降级方案：返回空字符串
    return { en: text, ar: text, es: text, pt: text }
  }
}

// 自动翻译功能
const autoTranslate = async () => {
  translating.value = true
  
  try {
    // 翻译名称
    if (formData.name && formData.name.trim()) {
      const translated = await callTranslationAPI(formData.name)
      // 更新翻译结果
      formData.name_en = translated.en
      formData.name_ar = translated.ar
      formData.name_es = translated.es
      formData.name_pt = translated.pt
    }
  } catch (error) {
    console.error('自动翻译出错:', error)
    ElMessage.warning('自动翻译失败，请稍后重试')
  } finally {
    translating.value = false
  }
}

// 监听中文输入,自动触发翻译
const handleChineseInput = (field: 'name') => {
  const value = formData[field]
  if (value && /[\u4e00-\u9fa5]/.test(value)) {
    // 检测到中文,自动翻译
    autoTranslate()
  }
}

const formData = reactive({
  id: null,
  name: '',
  name_en: '',
  name_ar: '',
  name_es: '',
  name_pt: '',
  icon: '',
  description: '',
  sort: 0
})

const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
}

// 获取完整图片URL
const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) return ''
  return imageUrl.startsWith('http') ? imageUrl : imageUrl
}

// 加载分类列表
const loadCategories = async () => {
  loading.value = true
  try {
    // 构建请求参数
    const params: any = {}
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    
    const { data } = await axios.get(`${API_BASE}/categories`, {
      params,
      timeout: 15000, // 15秒超时
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    // 处理统一响应格式：{ code: 200, message: 'success', data: [...categories] }
    if (data.code === 200) {
      // 如果后端不支持搜索，前端进行过滤
      let filteredCategories = data.data || []
      if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase()
        filteredCategories = filteredCategories.filter((cat: any) => 
          cat.name.toLowerCase().includes(keyword)
        )
      }
      categories.value = filteredCategories
    } else {
      categories.value = []
    }
    
  } catch (error: any) {
    // 更详细的错误处理
    let errorMsg = '加载分类列表失败'
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
    categories.value = []
  } finally {
    loading.value = false
  }
}

// 新增分类
const handleAdd = () => {
  dialogTitle.value = '新增分类'
  resetForm()
  dialogVisible.value = true
}

// 编辑分类
const handleEdit = (row: any) => {
  dialogTitle.value = '编辑分类'
  formData.id = row.id
  formData.name = row.name
  formData.name_en = row.name_en || ''
  formData.name_ar = row.name_ar || ''
  formData.name_es = row.name_es || ''
  formData.name_pt = row.name_pt || ''
  formData.icon = row.icon
  formData.description = row.description || ''
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
      const payload = {
        name: formData.name,
        name_en: formData.name_en,
        name_ar: formData.name_ar,
        name_es: formData.name_es,
        name_pt: formData.name_pt,
        icon: formData.icon,
        description: formData.description,
        sort: formData.sort
      }

      // 移除description字段，数据库表中没有这个字段
      const submitData = { ...payload }
      delete submitData.description
      
      if (formData.id) {
        // 更新
        await axios.put(`${API_BASE}/categories/${formData.id}`, submitData)
        ElMessage.success('更新成功')
      } else {
        // 新增
        await axios.post(`${API_BASE}/categories`, submitData)
        ElMessage.success('新增成功')
      }

      dialogVisible.value = false
      loadCategories()
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

// 删除分类
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该分类吗？删除后无法恢复！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    })

    await axios.delete(`${API_BASE}/categories/${row.id}`)
    ElMessage.success('删除成功')
    loadCategories()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

// 重置表单
const resetForm = () => {
  formData.id = null
  formData.name = ''
  formData.name_en = ''
  formData.name_ar = ''
  formData.name_es = ''
  formData.name_pt = ''
  formData.icon = ''
  formData.description = ''
  formData.sort = 0
  formRef.value?.clearValidate()
}

// 图标上传成功处理
const handleIconSuccess = (response: any) => {
  // 处理多层嵌套：{ code, message, data: { success, data: { url } } }
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
    // 添加完整的后端URL
    formData.icon = imageUrl.startsWith('http') ? imageUrl : imageUrl
    ElMessage.success('图标上传成功')
  } else {
    ElMessage.error('图标上传失败：无法获取图片URL')
  }
}

// 图标上传前验证
const beforeIconUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.category-manage {
  padding: 20px;
}

.search-bar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
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

.icon-uploader {
  display: inline-block;
}

.icon-uploader :deep(.el-upload) {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-uploader :deep(.el-upload:hover) {
  border-color: #409eff;
}

.icon-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.uploaded-icon {
  width: 100px;
  height: 100px;
  display: block;
}
</style>
