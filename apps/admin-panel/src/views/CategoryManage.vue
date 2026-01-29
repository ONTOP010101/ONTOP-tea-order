<template>
  <div class="category-manage">
    <el-card>
      <div class="header-actions">
        <h3>分类管理</h3>
        <div class="action-buttons">
          <el-button type="warning" @click="showImportDialog = true">
            <el-icon><Upload /></el-icon>
            导入Excel
          </el-button>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增分类
          </el-button>
        </div>
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

    <!-- Excel导入对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="导入Excel添加分类"
      width="500px"
      destroy-on-close
    >
      <div class="import-dialog-content">
        <p class="import-hint">请上传包含分类信息的Excel文件，支持直接添加新分类</p>
        <el-upload
          class="upload-excel"
          action="#"
          :auto-upload="false"
          :on-change="handleExcelFile"
          accept=".xlsx,.xls"
          :limit="1"
          :file-list="excelFileList"
        >
          <el-button type="primary">选择Excel文件</el-button>
          <template #tip>
            <div class="el-upload__tip">
              支持 .xlsx 和 .xls 格式的Excel文件<br>
              导入模板只需包含：分类名称、图片
            </div>
          </template>
        </el-upload>
        <el-button 
          type="success" 
          style="margin-top: 20px" 
          @click="importExcel"
          :loading="importLoading"
          :disabled="!excelFile"
        >
          开始导入
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Plus, Search, Upload } from '@element-plus/icons-vue'
import axios from 'axios'
import * as XLSX from 'xlsx'

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

// Excel导入相关
const showImportDialog = ref(false)
const excelFile = ref<File | null>(null)
const excelFileList = ref<any[]>([])
const importLoading = ref(false)

// 调用翻译映射表
const translationMap: Record<string, { en: string; ar: string; es: string; pt: string }> = {
  // 基础词汇
  '苹果': { en: 'Apple', ar: 'تفاح', es: 'Manzana', pt: 'Maçã' },
  '香蕉': { en: 'Banana', ar: 'موز', es: 'Plátano', pt: 'Banana' },
  '橙子': { en: 'Orange', ar: 'برتقال', es: 'Naranja', pt: 'Laranja' },
  '咖啡': { en: 'Coffee', ar: 'قهوة', es: 'Café', pt: 'Café' },
  '茶': { en: 'Tea', ar: 'شاي', es: 'Té', pt: 'Chá' },
  '奶茶': { en: 'Milk Tea', ar: 'شاي بالحليب', es: 'Té con leche', pt: 'Chá com leite' },
  '蛋糕': { en: 'Cake', ar: 'كعكة', es: 'Pastel', pt: 'Bolo' },
  '新鲜': { en: 'Fresh', ar: 'طازج', es: 'Fresco', pt: 'Fresco' },
  '美味': { en: 'Delicious', ar: 'لذيذ', es: 'Delicioso', pt: 'Delicioso' },
  '经典': { en: 'Classic', ar: 'كلاسيكي', es: 'Clásico', pt: 'Clássico' },
  '特制': { en: 'Special', ar: 'خاص', es: 'Especial', pt: 'Especial' },
  '推荐': { en: 'Recommended', ar: 'موصى به', es: 'Recomendado', pt: 'Recomendado' }
}

// 智能翻译函数
const intelligentTranslate = (text: string): { en: string; ar: string; es: string; pt: string } => {
  if (!text || !text.trim()) {
    return { en: '', ar: '', es: '', pt: '' }
  }

  const cleanText = text.trim()

  // 1. 优先精确匹配
  if (translationMap[cleanText]) {
    return translationMap[cleanText]
  }

  // 2. 智能分词翻译
  let enResult = cleanText
  let arResult = cleanText
  let esResult = cleanText
  let ptResult = cleanText
  
  // 按长度排序，优先匹配长词汇
  const sortedKeys = Object.keys(translationMap).sort((a, b) => b.length - a.length)
  
  // 尝试替换文本中的已知词汇
  for (const key of sortedKeys) {
    if (enResult.includes(key)) {
      const translation = translationMap[key]
      enResult = enResult.replace(new RegExp(key, 'g'), translation.en)
      arResult = arResult.replace(new RegExp(key, 'g'), translation.ar)
      esResult = esResult.replace(new RegExp(key, 'g'), translation.es)
      ptResult = ptResult.replace(new RegExp(key, 'g'), translation.pt)
    }
  }

  // 3. 如果没有找到任何匹配，返回原文
  if (enResult === cleanText) {
    return {
      en: cleanText,
      ar: cleanText,
      es: cleanText,
      pt: cleanText
    }
  }

  return { en: enResult, ar: arResult, es: esResult, pt: ptResult }
}

// 调用后端翻译API
const callTranslationAPI = async (text: string): Promise<{ en: string; ar: string; es: string; pt: string }> => {
  try {
    const response = await axios.post(`${API_BASE}/translation/translate`, { text })
    if (response.data.code === 200) {
      const data = response.data.data
      // 处理后端返回的格式：{ original, en, ar, es, pt }
      if (data.en && data.ar && data.es && data.pt) {
        return {
          en: data.en,
          ar: data.ar,
          es: data.es,
          pt: data.pt
        }
      }
    }
    throw new Error(response.data.message || '翻译失败')
  } catch (error) {
    console.error('调用翻译API失败:', error)
    // 降级到本地翻译映射表
    return intelligentTranslate(text)
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
  
  // 检查是否为空或无效
  if (!imageUrl || imageUrl.trim() === '') {
    return ''
  }
  
  // 处理 DISPIMG 格式的特殊 URL
  if (imageUrl.includes('=DISPIMG(')) {
    return ''
  }
  
  if (imageUrl.startsWith('http')) {
    return imageUrl
  }
  if (imageUrl.startsWith('/')) {
    return `http://localhost:3003${imageUrl}`
  }
  return `http://localhost:3003/uploads/${imageUrl}`
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
    // 如果是完整URL直接使用，否则拼接后端地址
    formData.icon = imageUrl.startsWith('http') ? imageUrl : `http://localhost:3003${imageUrl}`
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

// 处理Excel文件选择
const handleExcelFile = (file: any) => {
  excelFile.value = file.raw
  excelFileList.value = [file]
}

// 解析Excel文件
const parseExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        
        // 清理数据中的图片占位符
        const cleanedData = jsonData.map((item: any) => {
          const cleanedItem: any = {}
          
          // 清理所有字段
          for (const key in item) {
            let value = item[key]
            
            // 处理 DISPIMG 格式
            if (typeof value === 'string' && value.includes('=DISPIMG(')) {
              value = ''
            }
            
            cleanedItem[key] = value
          }
          
          return cleanedItem
        })
        
        resolve(cleanedData)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = (error) => {
      reject(error)
    }
    reader.readAsBinaryString(file)
  })
}

// 导入Excel文件
const importExcel = async () => {
  if (!excelFile.value) {
    ElMessage.warning('请先选择Excel文件')
    return
  }
  
  importLoading.value = true
  
  try {
    // 解析Excel文件
    const categories = await parseExcelFile(excelFile.value)
    
    if (categories.length === 0) {
      ElMessage.warning('Excel文件中没有数据')
      return
    }
    
    // 调用API添加分类
    const successCount = await addCategories(categories)
    
    ElMessage.success(`成功导入 ${successCount} 个分类`)
    showImportDialog.value = false
    excelFile.value = null
    excelFileList.value = []
    loadCategories() // 重新加载分类列表
  } catch (error) {
    ElMessage.error('导入Excel失败，请检查文件格式')
  } finally {
    importLoading.value = false
  }
}

// 添加分类到数据库
const addCategories = async (categories: any[]): Promise<number> => {
  let successCount = 0
  
  for (const category of categories) {
    try {
      // 检查分类数据完整性
      const categoryName = category.category || category.分类名称 || category.name || category.分类 || ''
      if (!categoryName) {
        continue
      }
      
      // 构建分类数据结构
      const categoryData = {
        name: categoryName,
        icon: category.image || category.图片 || '',
        sort: category.sort || 0
      }
      
      // 调用分类添加API
      await axios.post(`${API_BASE}/categories`, categoryData)
      successCount++
    } catch (error) {
      // 继续处理下一个分类
    }
  }
  
  return successCount
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

.action-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* Excel导入相关样式 */
.import-dialog-content {
  padding: 20px 0;
}

.import-hint {
  color: #606266;
  margin-bottom: 20px;
  line-height: 1.5;
}

.upload-excel {
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
