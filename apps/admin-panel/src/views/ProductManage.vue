<template>
  <div class="product-manage">
    <el-card>
      <div class="header-actions">
        <h3>商品列表</h3>
        <div class="action-buttons">
          <el-button-group size="small" style="margin-right: 10px">
            <el-button 
              :type="viewMode === 'table' ? 'primary' : 'default'"
              @click="viewMode = 'table'"
            >
              <el-icon><List /></el-icon>
              列表
            </el-button>
            <el-button 
              :type="viewMode === 'card' ? 'primary' : 'default'"
              @click="viewMode = 'card'"
            >
              <el-icon><Grid /></el-icon>
              卡片
            </el-button>
          </el-button-group>
          <el-button type="warning" @click="showImportDialog = true">
            <el-icon><Upload /></el-icon>
            导入Excel
          </el-button>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增商品
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
          @clear="loadProducts"
        >
          <template #append>
            <el-button :icon="Search" @click="loadProducts" />
          </template>
        </el-input>
        <el-select v-model="searchCategory" placeholder="选择分类" clearable @change="loadProducts" style="width: 200px; margin-left: 10px">
          <el-option label="全部分类" value="" />
          <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
        </el-select>
        <el-button type="info" @click="handleTimeLimitedProducts" style="margin-left: 10px">
          <el-icon><Clock /></el-icon>
          限时推荐商品管理
        </el-button>
      </div>

      <!-- 商品列表 -->
      <!-- 表格视图 -->
      <el-table v-if="viewMode === 'table'" :data="products" border style="margin-top: 20px" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="商品图片" width="120">
          <template #default="{ row }">
            <el-image :src="getImageUrl(row.image)" style="width: 80px; height: 80px" fit="cover" />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" width="200" />
        <el-table-column prop="category.name" label="分类" width="120" />
        <el-table-column label="价格" width="120">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: bold">¥{{ row.price }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="100" />
        <el-table-column prop="sales" label="销量" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="row.status === 1 ? 'warning' : 'success'"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '下架' : '上架' }}
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 卡片视图 -->
      <div v-else-if="viewMode === 'card'" class="product-cards" v-loading="loading">
        <el-card v-for="product in products" :key="product.id" class="product-card">
          <div class="card-image">
            <el-image :src="getImageUrl(product.image)" fit="cover" />
          </div>
          <div class="card-content">
            <h4 class="product-name">{{ product.name }}</h4>
            <div class="product-category">{{ product.category?.name || '未分类' }}</div>
            <div class="product-price">¥{{ product.price }}</div>
            <div class="product-stats">
              <span>库存: {{ product.stock }}</span>
              <span>销量: {{ product.sales }}</span>
            </div>
            <div class="product-status">
              <el-tag :type="product.status === 1 ? 'success' : 'info'" size="small">
                {{ product.status === 1 ? '上架' : '下架' }}
              </el-tag>
            </div>
            <div class="card-actions">
              <el-button size="small" @click="handleEdit(product)">编辑</el-button>
              <el-button 
                size="small" 
                :type="product.status === 1 ? 'warning' : 'success'"
                @click="handleToggleStatus(product)"
              >
                {{ product.status === 1 ? '下架' : '上架' }}
              </el-button>
              <el-button size="small" type="danger" @click="handleDelete(product)">删除</el-button>
            </div>
          </div>
        </el-card>
        <div v-if="products.length === 0" class="empty-cards">
          <el-empty description="暂无商品数据" :image-size="100" />
        </div>
      </div>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100, 500]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadProducts"
        @current-change="loadProducts"
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
        <el-form-item label="商品名称" prop="name">
          <el-input 
            v-model="formData.name" 
            placeholder="请输入中文商品名称" 
            @input="handleChineseInput('name')"
          />
        </el-form-item>
        
        <el-alert
          title="💡 智能提示"
          type="success"
          :closable="false"
          style="margin-bottom: 15px"
        >
          只需填写中文名称和描述,系统将自动翻译为英语、阿拉伯语、西班牙语、葡萄牙语
        </el-alert>
        
        <el-form-item label="商品分类" prop="category_id">
          <el-select v-model="formData.category_id" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>

        <el-divider content-position="left">多语言名称</el-divider>

        <el-form-item label="英文名称">
          <el-input v-model="formData.name_en" placeholder="自动翻译生成" disabled />
        </el-form-item>

        <el-form-item label="阿拉伯语名称">
          <el-input v-model="formData.name_ar" placeholder="自动翻译生成" disabled />
        </el-form-item>

        <el-form-item label="西班牙语名称">
          <el-input v-model="formData.name_es" placeholder="自动翻译生成" disabled />
        </el-form-item>

        <el-form-item label="葡萄牙语名称">
          <el-input v-model="formData.name_pt" placeholder="自动翻译生成" disabled />
        </el-form-item>

        <el-form-item label="商品图片" prop="image">
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
          <div style="margin-top: 10px; font-size: 12px; color: #999">点击上传图片，支持jpg/png格式</div>
        </el-form-item>

        <el-form-item label="商品价格" prop="price">
          <el-input-number v-model="formData.price" :min="0" :precision="2" :step="0.1" />
        </el-form-item>

        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="formData.stock" :min="0" />
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" />
          <span style="margin-left: 10px; color: #999; font-size: 12px;">数字越大越靠前</span>
        </el-form-item>

        <el-form-item label="商品描述" prop="description">
          <el-input 
            v-model="formData.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入中文商品描述" 
            @input="handleChineseInput('description')"
          />
        </el-form-item>

        <el-divider content-position="left">多语言描述</el-divider>

        <el-form-item label="英文描述">
          <el-input v-model="formData.description_en" type="textarea" :rows="2" placeholder="自动翻译生成" disabled />
        </el-form-item>

        <el-form-item label="阿拉伯语描述">
          <el-input v-model="formData.description_ar" type="textarea" :rows="2" placeholder="自动翻译生成" disabled />
        </el-form-item>

        <el-form-item label="西班牙语描述">
          <el-input v-model="formData.description_es" type="textarea" :rows="2" placeholder="自动翻译生成" disabled />
        </el-form-item>

        <el-form-item label="葡萄牙语描述">
          <el-input v-model="formData.description_pt" type="textarea" :rows="2" placeholder="自动翻译生成" disabled />
        </el-form-item>

        <el-form-item label="商品状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">上架</el-radio>
            <el-radio :label="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-divider content-position="left">规格组绑定</el-divider>

        <el-form-item label="绑定的规格组">
          <div v-if="loadingSpecGroups" class="spec-groups-loading">
            <el-skeleton :rows="3" animated />
          </div>
          <div v-else>
            <el-tag
              v-for="group in boundSpecGroups"
              :key="group.id"
              closable
              @close="unbindSpecGroup(group)"
              style="margin-right: 10px; margin-bottom: 10px;"
            >
              {{ group.name }} ({{ group.isRequired ? '必选' : '可选' }}-{{ group.isMultiple ? '多选' : '单选' }})
            </el-tag>
            <div v-if="boundSpecGroups.length === 0" class="empty-bound-groups">
              暂无绑定的规格组
            </div>
          </div>
        </el-form-item>

        <el-form-item label="可绑定的规格组">
          <el-select
            v-model="selectedSpecGroup"
            placeholder="选择规格组"
            style="width: 100%"
            @change="bindSpecGroup"
            filterable
          >
            <el-option
              v-for="group in availableSpecGroups"
              :key="group.id"
              :label="`${group.name} (${group.isRequired ? '必选' : '可选'}-${group.isMultiple ? '多选' : '单选'})`"
              :value="group"
            />
          </el-select>
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
      title="导入Excel添加产品"
      width="500px"
      destroy-on-close
    >
      <div class="import-dialog-content">
        <p class="import-hint">请上传包含产品信息的Excel文件，支持直接添加新产品</p>
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
              支持 .xlsx 和 .xls 格式的Excel文件
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
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Search, Plus, Upload, MagicStick, Grid, List, Clock } from '@element-plus/icons-vue'
import axios from 'axios'
import * as XLSX from 'xlsx'

const API_BASE = '/api'  // 使用相对路径，通过Vite代理转发

const router = useRouter()

// 翻译映射表 - 5种语言全覆盖
const translationMap: Record<string, { en: string; ar: string; es: string; pt: string }> = {
  // 饮品类
  '拿铁咖啡': { en: 'Latte', ar: 'لاتيه', es: 'Café con leche', pt: 'Café com leite' },
  '美式咖啡': { en: 'Americano', ar: 'أمريكانو', es: 'Café americano', pt: 'Café americano' },
  '卡布奇诺': { en: 'Cappuccino', ar: 'كابتشينو', es: 'Capuchino', pt: 'Cappuccino' },
  '摩卡咖啡': { en: 'Mocha', ar: 'موكا', es: 'Café moka', pt: 'Café mocha' },
  '冰柠檬茶': { en: 'Iced Lemon Tea', ar: 'شاي الليمون المثلج', es: 'Té helado de limón', pt: 'Chá gelado de limão' },
  '红茶玛奇朵': { en: 'Black Tea Macchiato', ar: 'ماكياتو الشاي الأسود', es: 'Macchiato de té negro', pt: 'Macchiato de chá preto' },
  '抹茶拿铁': { en: 'Matcha Latte', ar: 'لاتيه ماتشا', es: 'Latte de matcha', pt: 'Latte de matcha' },
  '奶茶': { en: 'Milk Tea', ar: 'شاي بالحليب', es: 'Té con leche', pt: 'Chá com leite' },
  
  // 甜点类
  '提拉米苏': { en: 'Tiramisu', ar: 'تيراميسو', es: 'Tiramisú', pt: 'Tiramisu' },
  '芝士蛋糕': { en: 'Cheese Cake', ar: 'كعكة الجبن', es: 'Pastel de queso', pt: 'Bolo de queijo' },
  '布朗尼': { en: 'Brownie', ar: 'براوني', es: 'Brownie', pt: 'Brownie' },
  '马卡龙': { en: 'Macaron', ar: 'ماكارون', es: 'Macarrón', pt: 'Macaron' },
  '泡芙': { en: 'Puff', ar: 'بوف', es: 'Profiterol', pt: 'Bomba' },
  '慕斯': { en: 'Mousse', ar: 'موس', es: 'Mousse', pt: 'Musse' },
  
  // 水果类
  '苹果': { en: 'Apple', ar: 'تفاح', es: 'Manzana', pt: 'Maçã' },
  '香蕉': { en: 'Banana', ar: 'موز', es: 'Plátano', pt: 'Banana' },
  '橙子': { en: 'Orange', ar: 'برتقال', es: 'Naranja', pt: 'Laranja' },
  '草莓': { en: 'Strawberry', ar: 'فراولة', es: 'Fresa', pt: 'Morango' },
  '西瓜': { en: 'Watermelon', ar: 'بطيخ', es: 'Sandía', pt: 'Melancia' },
  '葡萄': { en: 'Grape', ar: 'عنب', es: 'Uva', pt: 'Uva' },
  '芒果': { en: 'Mango', ar: 'مانجو', es: 'Mango', pt: 'Manga' },
  '桃子': { en: 'Peach', ar: 'خوخ', es: 'Durazno', pt: 'Pêssego' },
  '梨': { en: 'Pear', ar: 'كمثرى', es: 'Pera', pt: 'Pera' },
  '樱桃': { en: 'Cherry', ar: 'كرز', es: 'Cereza', pt: 'Cereja' },
  
  // 描述性词汇
  '经典': { en: 'Classic', ar: 'كلاسيكي', es: 'Clásico', pt: 'Clássico' },
  '香浓': { en: 'Rich', ar: 'غني', es: 'Rico', pt: 'Rico' },
  '醇厚': { en: 'Mellow', ar: 'ناعم', es: 'Suave', pt: 'Suave' },
  '清爽': { en: 'Refreshing', ar: 'منعش', es: 'Refrescante', pt: 'Refrescante' },
  '浓郁': { en: 'Strong', ar: 'قوي', es: 'Fuerte', pt: 'Forte' },
  '甜品': { en: 'Dessert', ar: 'حلوى', es: 'Postre', pt: 'Sobremesa' },
  '意式': { en: 'Italian', ar: 'إيطالي', es: 'Italiano', pt: 'Italiano' },
  '口感绵密': { en: 'Creamy texture', ar: 'قوام كريمي', es: 'Textura cremosa', pt: 'Textura cremosa' },
  '奶香四溢': { en: 'Rich milky aroma', ar: 'رائحة حليب غنية', es: 'Aroma lácteo rico', pt: 'Aroma de leite rico' },
  '新鲜': { en: 'Fresh', ar: 'طازج', es: 'Fresco', pt: 'Fresco' },
  '美味': { en: 'Delicious', ar: 'لذيذ', es: 'Delicioso', pt: 'Delicioso' },
  '特制': { en: 'Special', ar: 'خاص', es: 'Especial', pt: 'Especial' },
  '热销': { en: 'Hot Sale', ar: 'مبيعات ساخنة', es: 'Más vendido', pt: 'Mais vendido' },
  '推荐': { en: 'Recommended', ar: 'موصى به', es: 'Recomendado', pt: 'Recomendado' }
}

const translating = ref(false)

// 智能翻译函数 - 支持5种语言
const intelligentTranslate = (text: string): { en: string; ar: string; es: string; pt: string } => {
  if (!text || !text.trim()) {
    return { en: '', ar: '', es: '', pt: '' }
  }

  const cleanText = text.trim()

  // 1. 优先精确匹配
  if (translationMap[cleanText]) {
    return translationMap[cleanText]
  }

  // 2. 智能分词翻译（只处理已知词汇，避免错误匹配）
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

// 调用后端真正的翻译API
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

// 自动翻译功能 - 调用真正的API
const autoTranslate = async () => {
  translating.value = true
  
  try {
    // 翻译名称
    if (formData.name && formData.name.trim()) {
      const translated = await callTranslationAPI(formData.name)
      // 总是更新翻译结果，无论是新增还是编辑
      formData.name_en = translated.en
      formData.name_ar = translated.ar
      formData.name_es = translated.es
      formData.name_pt = translated.pt
    }
    
    // 翻译描述
    if (formData.description && formData.description.trim()) {
      const translated = await callTranslationAPI(formData.description)
      // 总是更新翻译结果，无论是新增还是编辑
      formData.description_en = translated.en
      formData.description_ar = translated.ar
      formData.description_es = translated.es
      formData.description_pt = translated.pt
    }
  } catch (error) {
    console.error('自动翻译出错:', error)
    ElMessage.warning('自动翻译失败，请稍后重试')
  } finally {
    translating.value = false
  }
}

// 监听中文输入,自动触发翻译
const handleChineseInput = (field: 'name' | 'description') => {
  const value = formData[field]
  if (value && /[\u4e00-\u9fa5]/.test(value)) {
    // 检测到中文,自动翻译
    autoTranslate()
  }
}

// 数据
const products = ref([])
const categories = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const searchCategory = ref('')
const viewMode = ref('table') // table 或 card

// 规格组相关数据
const boundSpecGroups = ref([])
const availableSpecGroups = ref([])
const selectedSpecGroup = ref(null)
const loadingSpecGroups = ref(false)

const pagination = reactive({
  page: 1,
  pageSize: 500,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('新增商品')
const submitting = ref(false)
const formRef = ref<FormInstance>()

// Excel导入相关
const showImportDialog = ref(false)
const excelFile = ref<File | null>(null)
const excelFileList = ref<any[]>([])
const importLoading = ref(false)

const formData = reactive({
  id: null,
  name: '',
  name_en: '',
  name_ar: '',
  name_es: '',
  name_pt: '',
  category_id: null,
  image: '',
  price: 0,
  stock: 0,
  sort: 0,
  description: '',
  description_en: '',
  description_ar: '',
  description_es: '',
  description_pt: '',
  status: 1
})

const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择分类', trigger: 'change' }],
  image: [{ required: true, message: '请上传商品图片', trigger: 'change' }]
}

// 加载商品列表
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
  // 处理相对路径，确保图片能正确加载
  if (imageUrl.startsWith('/')) {
    // 绝对路径，使用后端服务器地址
    return `http://localhost:3003${imageUrl}`
  }
  // 相对路径，使用后端服务器的uploads目录
  return `http://localhost:3003/uploads/${imageUrl}`
}

const loadProducts = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      status: 'all'
    }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (searchCategory.value) params.category_id = searchCategory.value

    const { data } = await axios.get(`${API_BASE}/products`, { 
      params,
      timeout: 15000, // 增加超时时间
      withCredentials: true // 允许携带凭证，解决跨域问题
    })
    
    // 处理统一响应格式：{ code: 200, message: 'success', data: { list, total, page, pageSize } }
    if (data.code === 200) {
      products.value = data.data.list || []
      pagination.total = data.data.total || 0
    } else {
      products.value = []
      pagination.total = 0
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '加载商品列表失败，请检查网络连接')
    products.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 加载分类列表
const loadCategories = async () => {
  try {
    const { data } = await axios.get(`${API_BASE}/categories`, {
      timeout: 15000, // 增加超时时间
      withCredentials: true // 允许携带凭证，解决跨域问题
    })
    
    // 处理统一响应格式：{ code: 200, message: 'success', data: [...categories] }
    if (data.code === 200) {
      categories.value = data.data || []
    } else {
      categories.value = []
    }
  } catch (error: any) {
    let errorMsg = '加载分类列表失败'
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      errorMsg = '⚠️ 无法连接到后端服务'
    } else if (error.response) {
      errorMsg = error.response.data?.message || `服务器错误 (${error.response.status})`
    }
    
    ElMessage.error({
      message: errorMsg,
      duration: 3000
    })
    categories.value = []
  }
}

// 新增商品
const handleAdd = () => {
  dialogTitle.value = '新增商品'
  resetForm()
  dialogVisible.value = true
}

// 加载商品绑定的规格组
const loadBoundSpecGroups = async (productId: number) => {
  loadingSpecGroups.value = true
  try {
    const { data } = await axios.get(`${API_BASE}/spec/product/${productId}/groups`)
    if (data.code === 200) {
      boundSpecGroups.value = data.data || []
    }
  } catch (error: any) {
    ElMessage.error('加载绑定的规格组失败')
  } finally {
    loadingSpecGroups.value = false
  }
}

// 加载商品可绑定的规格组
const loadAvailableSpecGroups = async (productId: number) => {
  loadingSpecGroups.value = true
  try {
    const { data } = await axios.get(`${API_BASE}/spec/product/${productId}/unbound-groups`)
    if (data.code === 200) {
      availableSpecGroups.value = data.data || []
    }
  } catch (error: any) {
    ElMessage.error('加载可绑定的规格组失败')
  } finally {
    loadingSpecGroups.value = false
  }
}

// 绑定规格组到商品
const bindSpecGroup = async () => {
  if (!selectedSpecGroup.value || !formData.id) return
  
  try {
    const { data } = await axios.post(`${API_BASE}/spec/product/${formData.id}/bind/${selectedSpecGroup.value.id}`)
    if (data.code === 200) {
      ElMessage.success('规格组绑定成功')
      // 重新加载规格组数据
      await loadBoundSpecGroups(formData.id)
      await loadAvailableSpecGroups(formData.id)
      selectedSpecGroup.value = null
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '规格组绑定失败')
  }
}

// 从商品解绑规格组
const unbindSpecGroup = async (group: any) => {
  if (!formData.id) return
  
  try {
    const { data } = await axios.delete(`${API_BASE}/spec/product/${formData.id}/unbind/${group.id}`)
    if (data.code === 200) {
      ElMessage.success('规格组解绑成功')
      // 重新加载规格组数据
      await loadBoundSpecGroups(formData.id)
      await loadAvailableSpecGroups(formData.id)
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '规格组解绑失败')
  }
}

// 加载规格组数据
const loadSpecGroupsForProduct = async (productId: number) => {
  await Promise.all([
    loadBoundSpecGroups(productId),
    loadAvailableSpecGroups(productId)
  ])
}

// 编辑商品
const handleEdit = (row: any) => {
  dialogTitle.value = '编辑商品'
  formData.id = row.id
  formData.name = row.name
  formData.name_en = row.name_en || ''
  formData.name_ar = row.name_ar || ''
  formData.name_es = row.name_es || ''
  formData.name_pt = row.name_pt || ''
  formData.category_id = row.category_id
  formData.image = row.image
  formData.price = row.price
  formData.stock = row.stock
  formData.sort = row.sort || 0
  formData.description = row.description || ''
  formData.description_en = row.description_en || ''
  formData.description_ar = row.description_ar || ''
  formData.description_es = row.description_es || ''
  formData.description_pt = row.description_pt || ''
  formData.status = row.status
  
  // 加载规格组数据
  loadSpecGroupsForProduct(row.id)
  
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
        name: formData.name,
        category_id: formData.category_id,
        image: formData.image,
        price: formData.price,
        stock: formData.stock,
        sort: formData.sort,
        status: formData.status
      }

      // 可选字段
      if (formData.name_en) payload.name_en = formData.name_en
      if (formData.name_ar) payload.name_ar = formData.name_ar
      if (formData.name_es) payload.name_es = formData.name_es
      if (formData.name_pt) payload.name_pt = formData.name_pt
      if (formData.description) payload.description = formData.description
      if (formData.description_en) payload.description_en = formData.description_en
      if (formData.description_ar) payload.description_ar = formData.description_ar
      if (formData.description_es) payload.description_es = formData.description_es
      if (formData.description_pt) payload.description_pt = formData.description_pt

      if (formData.id) {
        // 更新
        await axios.put(`${API_BASE}/products/${formData.id}`, payload)
        ElMessage.success('更新成功')
      } else {
        // 新增
        await axios.post(`${API_BASE}/products`, payload)
        ElMessage.success('新增成功')
      }

      dialogVisible.value = false
      loadProducts()
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

// 切换上下架状态
const handleToggleStatus = async (row: any) => {
  const newStatus = row.status === 1 ? 0 : 1
  const action = newStatus === 1 ? '上架' : '下架'

  try {
    await ElMessageBox.confirm(`确定要${action}该商品吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await axios.put(`${API_BASE}/products/${row.id}/status`, { status: newStatus })
    ElMessage.success(`${action}成功`)
    loadProducts()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || `${action}失败`)
    }
  }
}

// 删除商品
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该商品吗？删除后无法恢复！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    })

    await axios.delete(`${API_BASE}/products/${row.id}`)
    ElMessage.success('删除成功')
    loadProducts()
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
  formData.category_id = null
  formData.image = ''
  formData.price = 0
  formData.stock = 0
  formData.sort = 0
  formData.description = ''
  formData.description_en = ''
  formData.description_ar = ''
  formData.description_es = ''
  formData.description_pt = ''
  formData.status = 1
  
  // 重置规格组相关数据
  boundSpecGroups.value = []
  availableSpecGroups.value = []
  selectedSpecGroup.value = null
  
  formRef.value?.clearValidate()
}

// 图片上传成功处理
const handleImageSuccess = (response: any) => {
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
    formData.image = imageUrl.startsWith('http') ? imageUrl : `http://localhost:3003${imageUrl}`
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
        console.error('解析Excel文件失败:', error)
        reject(error)
      }
    }
    reader.onerror = (error) => {
      console.error('读取Excel文件失败:', error)
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
  
  // 确保分类数据已加载
  if (categories.value.length === 0) {
    await loadCategories()
    // 检查分类数据是否加载成功
    if (categories.value.length === 0) {
      ElMessage.warning('分类数据加载失败，请刷新页面重试')
      return
    }
  }
  
  importLoading.value = true
  
  try {
    // 解析Excel文件
    const products = await parseExcelFile(excelFile.value)
    
    if (products.length === 0) {
      ElMessage.warning('Excel文件中没有数据')
      return
    }
    
    // 调用API添加产品
    const successCount = await addProducts(products)
    
    ElMessage.success(`成功导入 ${successCount} 个产品`)
    showImportDialog.value = false
    excelFile.value = null
    excelFileList.value = []
    loadProducts() // 重新加载商品列表
  } catch (error) {
    ElMessage.error('导入Excel失败，请检查文件格式')
  } finally {
    importLoading.value = false
  }
}

// 添加产品到数据库
const addProducts = async (products: any[]): Promise<number> => {
  let successCount = 0
  
  // 构建分类名称到ID的映射，忽略大小写
  const categoryMap: Record<string, number> = {}
  categories.value.forEach((cat: any) => {
    categoryMap[cat.name.toLowerCase()] = cat.id
  })
  
  for (const product of products) {
    try {
      // 检查产品数据完整性
      const productName = product.name || product.商品名称 || ''
      if (!productName) {
        continue
      }
      
      // 获取分类ID
      let categoryId = 1 // 默认分类ID
      const categoryName = product.category || product.分类 || ''
      if (categoryName) {
        const lowerCategoryName = categoryName.toLowerCase()
        if (categoryMap[lowerCategoryName]) {
          categoryId = categoryMap[lowerCategoryName]
        }
      }
      
      // 翻译商品名称和描述
      let nameTranslations = { en: '', ar: '', es: '', pt: '' }
      let descriptionTranslations = { en: '', ar: '', es: '', pt: '' }
      
      // 翻译商品名称
      if (productName) {
        nameTranslations = await callTranslationAPI(productName)
      }
      
      // 翻译商品描述
      const productDescription = product.description || product.描述 || ''
      if (productDescription) {
        descriptionTranslations = await callTranslationAPI(productDescription)
      }
      
      // 构建产品数据结构
      const productData = {
        name: productName,
        name_en: nameTranslations.en,
        name_ar: nameTranslations.ar,
        name_es: nameTranslations.es,
        name_pt: nameTranslations.pt,
        price: parseFloat(product.price || product.价格 || '0'),
        category_id: categoryId,
        description: productDescription,
        description_en: descriptionTranslations.en,
        description_ar: descriptionTranslations.ar,
        description_es: descriptionTranslations.es,
        description_pt: descriptionTranslations.pt,
        image: product.image || product.图片 || '',
        stock: parseInt(product.stock || product.库存 || '0'),
        status: product.status || 1
      }
      
      // 调用产品添加API
      await axios.post(`${API_BASE}/products`, productData)
      successCount++
    } catch (error) {
      // 继续处理下一个产品
    }
  }
  
  return successCount
}

// 跳转到限时推荐商品管理
const handleTimeLimitedProducts = () => {
  // 跳转到限时推荐商品管理页面
  router.push('/time-limited-products')
}

onMounted(() => {
  loadProducts()
  loadCategories()
})
</script>

<style scoped>
.product-manage {
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

/* 卡片视图样式 */
.product-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
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
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-category {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.product-price {
  font-size: 20px;
  font-weight: bold;
  color: #f56c6c;
  margin-bottom: 12px;
}

.product-stats {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
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

.card-actions :deep(.el-button:first-child) {
  margin-left: 0;
}

.card-actions :deep(.el-button:last-child) {
  margin-right: 0;
}

.empty-cards {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px 0;
}

.search-bar {
  display: flex;
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
  width: 148px;
  height: 148px;
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
  width: 148px;
  height: 148px;
  display: block;
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
</style>
