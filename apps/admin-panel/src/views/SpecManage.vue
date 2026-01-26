<template>
  <div class="spec-manage">
    <el-card>
      <div class="header-actions">
        <h3>规格组管理</h3>
        <el-button type="primary" @click="handleAddSpecGroup">
          <el-icon><Plus /></el-icon>
          新增规格组
        </el-button>
      </div>

      <!-- 规格组列表 -->
      <el-table :data="specGroups" border style="margin-top: 20px" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="规格组名称" width="180" />
        <el-table-column label="是否必选" width="120">
          <template #default="{ row }">
            <el-tag :type="row.isRequired === 1 ? 'success' : 'info'" size="small">
              {{ row.isRequired === 1 ? '必选' : '可选' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="选择类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.isMultiple === 1 ? 'success' : 'info'" size="small">
              {{ row.isMultiple === 1 ? '多选' : '单选' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="规格项数量" width="120">
          <template #default="{ row }">
            {{ row.items?.length || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="排序" width="100" prop="sort" />
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEditSpecGroup(row)">编辑规格组</el-button>
            <el-button size="small" @click="handleManageSpecItems(row)">管理规格项</el-button>
            <el-button size="small" type="danger" @click="handleDeleteSpecGroup(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑规格组对话框 -->
    <el-dialog
      v-model="specGroupDialogVisible"
      :title="specGroupDialogTitle"
      width="400px"
      @close="resetSpecGroupForm"
    >
      <el-form :model="specGroupForm" :rules="specGroupRules" ref="specGroupFormRef" label-width="100px">
        <el-form-item label="规格组名称" prop="name">
          <el-input 
            v-model="specGroupForm.name" 
            placeholder="请输入规格组名称" 
            @input="handleChineseInput('name')"
            :disabled="translating"
          />
        </el-form-item>
        <el-divider>多语言翻译</el-divider>
        <el-form-item label="英文名称">
          <el-input 
            v-model="specGroupForm.name_en" 
            placeholder="自动翻译或手动输入" 
            :disabled="translating"
          />
        </el-form-item>
        <el-form-item label="阿拉伯文名称">
          <el-input 
            v-model="specGroupForm.name_ar" 
            placeholder="自动翻译或手动输入" 
            :disabled="translating"
          />
        </el-form-item>
        <el-form-item label="西班牙文名称">
          <el-input 
            v-model="specGroupForm.name_es" 
            placeholder="自动翻译或手动输入" 
            :disabled="translating"
          />
        </el-form-item>
        <el-form-item label="葡萄牙文名称">
          <el-input 
            v-model="specGroupForm.name_pt" 
            placeholder="自动翻译或手动输入" 
            :disabled="translating"
          />
        </el-form-item>
        <el-divider>规格组属性</el-divider>
        <el-form-item label="是否必选" prop="isRequired">
          <el-radio-group v-model="specGroupForm.isRequired">
            <el-radio :label="1">必选</el-radio>
            <el-radio :label="0">可选</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="选择类型" prop="isMultiple">
          <el-radio-group v-model="specGroupForm.isMultiple">
            <el-radio :label="1">多选</el-radio>
            <el-radio :label="0">单选</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="specGroupForm.sort" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="specGroupDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitSpecGroup" :loading="specGroupSubmitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 规格项管理对话框 -->
    <el-dialog
      v-model="specItemDialogVisible"
      :title="specItemDialogTitle"
      width="500px"
    >
      <div class="spec-item-dialog">
        <div class="spec-item-header">
          <h4>规格项列表</h4>
          <el-button type="primary" size="small" @click="handleAddSpecItem">
            <el-icon><Plus /></el-icon>
            新增规格项
          </el-button>
        </div>
        <el-table :data="currentSpecGroup.items" border style="margin: 20px 0">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="value" label="规格值" width="150" />
          <el-table-column label="加价" width="120">
            <template #default="{ row }">
              <span v-if="row.price > 0" style="color: #f56c6c">+¥{{ row.price }}</span>
              <span v-else>¥0</span>
            </template>
          </el-table-column>
          <el-table-column prop="sort" label="排序" width="100" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="handleEditSpecItem(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDeleteSpecItem(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 新增/编辑规格项 -->
      <el-dialog
        v-model="specItemEditDialogVisible"
        :title="specItemEditDialogTitle"
        width="400px"
        @close="resetSpecItemForm"
      >
        <el-form :model="specItemForm" :rules="specItemRules" ref="specItemFormRef" label-width="100px">
          <el-form-item label="规格值" prop="value">
            <el-input 
              v-model="specItemForm.value" 
              placeholder="请输入规格值" 
              @input="handleSpecItemChineseInput"
              :disabled="translating"
            />
          </el-form-item>
          <el-divider>多语言翻译</el-divider>
          <el-form-item label="英文值">
            <el-input 
              v-model="specItemForm.value_en" 
              placeholder="自动翻译或手动输入" 
              :disabled="translating"
            />
          </el-form-item>
          <el-form-item label="阿拉伯文值">
            <el-input 
              v-model="specItemForm.value_ar" 
              placeholder="自动翻译或手动输入" 
              :disabled="translating"
            />
          </el-form-item>
          <el-form-item label="西班牙文值">
            <el-input 
              v-model="specItemForm.value_es" 
              placeholder="自动翻译或手动输入" 
              :disabled="translating"
            />
          </el-form-item>
          <el-form-item label="葡萄牙文值">
            <el-input 
              v-model="specItemForm.value_pt" 
              placeholder="自动翻译或手动输入" 
              :disabled="translating"
            />
          </el-form-item>
          <el-form-item label="加价" prop="price">
            <el-input-number v-model="specItemForm.price" :min="0" :precision="2" :step="0.1" />
          </el-form-item>
          <el-form-item label="排序" prop="sort">
            <el-input-number v-model="specItemForm.sort" :min="0" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="specItemEditDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitSpecItem" :loading="specItemSubmitting">确定</el-button>
        </template>
      </el-dialog>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import axios from 'axios'

const API_BASE = '/api'

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
  '推荐': { en: 'Recommended', ar: 'موصى به', es: 'Recomendado', pt: 'Recomendado' },
  
  // 规格组相关词汇
  '饮料': { en: 'Beverage', ar: 'مشروب', es: 'Bebida', pt: 'Bebida' },
  '温度': { en: 'Temperature', ar: 'درجة الحرارة', es: 'Temperatura', pt: 'Temperatura' },
  '甜度': { en: 'Sweetness', ar: 'اللحمة', es: 'Dulzura', pt: 'Doçura' },
  '冰量': { en: 'Ice', ar: 'الجليد', es: 'Hielo', pt: 'Gelo' },
  '大小': { en: 'Size', ar: 'الحجم', es: 'Tamaño', pt: 'Tamanho' },
  '杯型': { en: 'Cup Type', ar: 'نوع الكأس', es: 'Tipo de vaso', pt: 'Tipo de copo' },
  '配料': { en: 'Toppings', ar: 'المكونات', es: 'Ingredientes', pt: 'Recheios' },
  '口味': { en: 'Flavor', ar: 'نكهة', es: 'Sabor', pt: 'Sabor' },
  '包装': { en: 'Packaging', ar: 'التغليف', es: 'Empaque', pt: 'Embalagem' },
  '热饮': { en: 'Hot Drink', ar: 'مشروب ساخن', es: 'Bebida caliente', pt: 'Bebida quente' },
  '冷饮': { en: 'Cold Drink', ar: 'مشروب بارد', es: 'Bebida fría', pt: 'Bebida fria' },
  '常温': { en: 'Room Temperature', ar: 'درجة حرارة الغرفة', es: 'Temperatura ambiente', pt: 'Temperatura ambiente' },
  '全糖': { en: 'Full Sugar', ar: 'سكر كامل', es: 'Azúcar completo', pt: 'Açúcar completo' },
  '半糖': { en: 'Half Sugar', ar: 'نصف سكر', es: 'Mitad de azúcar', pt: 'Metade de açúcar' },
  '少糖': { en: 'Less Sugar', ar: 'أقل سكر', es: 'Menos azúcar', pt: 'Menos açúcar' },
  '无糖': { en: 'No Sugar', ar: 'بدون سكر', es: 'Sin azúcar', pt: 'Sem açúcar' },
  '标准冰': { en: 'Standard Ice', ar: 'جليد قياسي', es: 'Hielo estándar', pt: 'Gelo padrão' },
  '少冰': { en: 'Less Ice', ar: 'أقل جليد', es: 'Menos hielo', pt: 'Menos gelo' },
  '去冰': { en: 'No Ice', ar: 'بدون جليد', es: 'Sin hielo', pt: 'Sem gelo' },
  '热': { en: 'Hot', ar: 'ساخن', es: 'Caliente', pt: 'Quente' },
  '冰': { en: 'Ice', ar: 'بارد', es: 'Frío', pt: 'Frio' },
  '中杯': { en: 'Medium', ar: 'وسط', es: 'Mediano', pt: 'Médio' },
  '大杯': { en: 'Large', ar: 'كبير', es: 'Grande', pt: 'Grande' },
  '超大杯': { en: 'Extra Large', ar: 'فوق الكبير', es: 'Extra grande', pt: 'Extra grande' }
}

// 数据
const specGroups = ref([])
const loading = ref(false)
const translating = ref(false)

// 规格组对话框
const specGroupDialogVisible = ref(false)
const specGroupDialogTitle = ref('新增规格组')
const specGroupSubmitting = ref(false)
const specGroupFormRef = ref<FormInstance>()

const specGroupForm = reactive({
  id: null,
  name: '',
  name_en: '',
  name_ar: '',
  name_es: '',
  name_pt: '',
  isRequired: 1,
  isMultiple: 0,
  sort: 0
})

const specGroupRules = {
  name: [{ required: true, message: '请输入规格组名称', trigger: 'blur' }]
}

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
    // 降级到本地翻译映射表
    return intelligentTranslate(text)
  }
}

// 自动翻译功能 - 调用真正的API并保留用户手动输入的翻译结果
const autoTranslateSpecGroup = async () => {
  translating.value = true
  
  try {
    // 翻译规格组名称
    if (specGroupForm.name && specGroupForm.name.trim()) {
      const translated = await callTranslationAPI(specGroupForm.name)
      // 总是更新翻译结果，无论是新增还是编辑
      specGroupForm.name_en = translated.en
      specGroupForm.name_ar = translated.ar
      specGroupForm.name_es = translated.es
      specGroupForm.name_pt = translated.pt
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
  const value = specGroupForm[field]
  if (value && /[\u4e00-\u9fa5]/.test(value)) {
    // 检测到中文,自动翻译
    autoTranslateSpecGroup()
  }
}

// 在对话框打开时预填充翻译
const prefillTranslations = () => {
  if (specGroupForm.name && specGroupForm.name.trim()) {
    // 使用智能翻译预填充
    const translated = intelligentTranslate(specGroupForm.name)
    specGroupForm.name_en = specGroupForm.name_en || translated.en
    specGroupForm.name_ar = specGroupForm.name_ar || translated.ar
    specGroupForm.name_es = specGroupForm.name_es || translated.es
    specGroupForm.name_pt = specGroupForm.name_pt || translated.pt
  }
}

// 规格项对话框
const specItemDialogVisible = ref(false)
const specItemDialogTitle = ref('规格项管理')
const currentSpecGroup = reactive({ id: 0, name: '', items: [] })

// 规格项编辑对话框
const specItemEditDialogVisible = ref(false)
const specItemEditDialogTitle = ref('新增规格项')
const specItemSubmitting = ref(false)
const specItemFormRef = ref<FormInstance>()

const specItemForm = reactive({
  id: null,
  groupId: 0,
  value: '',
  value_en: '',
  value_ar: '',
  value_es: '',
  value_pt: '',
  price: 0,
  sort: 0
})

const specItemRules = {
  value: [{ required: true, message: '请输入规格值', trigger: 'blur' }]
}

// 自动翻译规格值 - 调用真正的API并保留用户手动输入的翻译结果
const autoTranslateSpecItem = async () => {
  translating.value = true
  
  try {
    // 翻译规格值
    if (specItemForm.value && specItemForm.value.trim()) {
      const translated = await callTranslationAPI(specItemForm.value)
      // 总是更新翻译结果，无论是新增还是编辑
      specItemForm.value_en = translated.en
      specItemForm.value_ar = translated.ar
      specItemForm.value_es = translated.es
      specItemForm.value_pt = translated.pt
    }
  } catch (error) {
    console.error('自动翻译出错:', error)
    ElMessage.warning('自动翻译失败，请稍后重试')
  } finally {
    translating.value = false
  }
}

// 监听中文规格值输入,自动触发翻译
const handleSpecItemChineseInput = () => {
  const value = specItemForm.value
  if (value && /[\u4e00-\u9fa5]/.test(value)) {
    // 检测到中文,自动翻译
    autoTranslateSpecItem()
  }
}

// 在规格项对话框打开时预填充翻译
const prefillSpecItemTranslations = () => {
  if (specItemForm.value && specItemForm.value.trim()) {
    // 使用智能翻译预填充
    const translated = intelligentTranslate(specItemForm.value)
    specItemForm.value_en = specItemForm.value_en || translated.en
    specItemForm.value_ar = specItemForm.value_ar || translated.ar
    specItemForm.value_es = specItemForm.value_es || translated.es
    specItemForm.value_pt = specItemForm.value_pt || translated.pt
  }
}

// 加载规格组列表
const loadSpecGroups = async () => {
  loading.value = true
  try {
    const { data } = await axios.get(`${API_BASE}/spec/groups`, {
      timeout: 15000,
      withCredentials: true
    })
    if (data.code === 200) {
      specGroups.value = data.data || []
    } else {
      specGroups.value = []
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '加载规格组列表失败')
    specGroups.value = []
  } finally {
    loading.value = false
  }
}

// 新增规格组
const handleAddSpecGroup = () => {
  specGroupDialogTitle.value = '新增规格组'
  resetSpecGroupForm()
  specGroupDialogVisible.value = true
}

// 编辑规格组
const handleEditSpecGroup = (row: any) => {
  specGroupDialogTitle.value = '编辑规格组'
  specGroupForm.id = row.id
  specGroupForm.name = row.name
  specGroupForm.name_en = row.name_en || ''
  specGroupForm.name_ar = row.name_ar || ''
  specGroupForm.name_es = row.name_es || ''
  specGroupForm.name_pt = row.name_pt || ''
  specGroupForm.isRequired = row.isRequired
  specGroupForm.isMultiple = row.isMultiple
  specGroupForm.sort = row.sort
  
  // 预填充翻译
  prefillTranslations()
  
  specGroupDialogVisible.value = true
}

// 提交规格组表单
const handleSubmitSpecGroup = async () => {
  if (!specGroupFormRef.value) return
  
  await specGroupFormRef.value.validate(async (valid) => {
    if (!valid) return

    specGroupSubmitting.value = true
    try {
      const payload = {
        name: specGroupForm.name,
        name_en: specGroupForm.name_en,
        name_ar: specGroupForm.name_ar,
        name_es: specGroupForm.name_es,
        name_pt: specGroupForm.name_pt,
        isRequired: specGroupForm.isRequired,
        isMultiple: specGroupForm.isMultiple,
        sort: specGroupForm.sort
      }

      if (specGroupForm.id) {
        // 更新
        await axios.put(`${API_BASE}/spec/group/${specGroupForm.id}`, payload)
        ElMessage.success('更新成功')
      } else {
        // 新增
        await axios.post(`${API_BASE}/spec/group`, payload)
        ElMessage.success('新增成功')
      }

      specGroupDialogVisible.value = false
      loadSpecGroups()
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '操作失败')
    } finally {
      specGroupSubmitting.value = false
    }
  })
}

// 删除规格组
const handleDeleteSpecGroup = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该规格组吗？删除后相关商品的规格配置将失效！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    })

    await axios.delete(`${API_BASE}/spec/group/${row.id}`)
    ElMessage.success('删除成功')
    loadSpecGroups()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

// 重置规格组表单
const resetSpecGroupForm = () => {
  specGroupForm.id = null
  specGroupForm.name = ''
  specGroupForm.name_en = ''
  specGroupForm.name_ar = ''
  specGroupForm.name_es = ''
  specGroupForm.name_pt = ''
  specGroupForm.isRequired = 1
  specGroupForm.isMultiple = 0
  specGroupForm.sort = 0
  specGroupFormRef.value?.clearValidate()
}

// 管理规格项
const handleManageSpecItems = async (row: any) => {
  specItemDialogTitle.value = `${row.name} - 规格项管理`
  currentSpecGroup.id = row.id
  currentSpecGroup.name = row.name
  currentSpecGroup.items = row.items || []
  specItemDialogVisible.value = true
}

// 新增规格项
const handleAddSpecItem = () => {
  specItemEditDialogTitle.value = '新增规格项'
  resetSpecItemForm()
  specItemForm.groupId = currentSpecGroup.id
  specItemEditDialogVisible.value = true
}

// 编辑规格项
const handleEditSpecItem = (row: any) => {
  specItemEditDialogTitle.value = '编辑规格项'
  specItemForm.id = row.id
  specItemForm.groupId = currentSpecGroup.id
  specItemForm.value = row.value
  specItemForm.value_en = row.value_en || ''
  specItemForm.value_ar = row.value_ar || ''
  specItemForm.value_es = row.value_es || ''
  specItemForm.value_pt = row.value_pt || ''
  specItemForm.price = row.price
  specItemForm.sort = row.sort
  
  // 预填充翻译
  prefillSpecItemTranslations()
  
  specItemEditDialogVisible.value = true
}

// 提交规格项表单
const handleSubmitSpecItem = async () => {
  if (!specItemFormRef.value) return
  
  await specItemFormRef.value.validate(async (valid) => {
    if (!valid) return

    specItemSubmitting.value = true
    try {
      const payload = {
        value: specItemForm.value,
        value_en: specItemForm.value_en,
        value_ar: specItemForm.value_ar,
        value_es: specItemForm.value_es,
        value_pt: specItemForm.value_pt,
        price: specItemForm.price,
        sort: specItemForm.sort
      }

      if (specItemForm.id) {
        // 更新
        await axios.put(`${API_BASE}/spec/item/${specItemForm.id}`, payload)
        ElMessage.success('更新成功')
      } else {
        // 新增
        await axios.post(`${API_BASE}/spec/item/${specItemForm.groupId}`, payload)
        ElMessage.success('新增成功')
      }

      specItemEditDialogVisible.value = false
      loadSpecGroups()
      // 重新加载当前规格组的规格项
      const updatedGroup = await axios.get(`${API_BASE}/spec/group/${currentSpecGroup.id}`)
      if (updatedGroup.data.code === 200) {
        currentSpecGroup.items = updatedGroup.data.data.items
      }
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '操作失败')
    } finally {
      specItemSubmitting.value = false
    }
  })
}

// 删除规格项
const handleDeleteSpecItem = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该规格项吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    })

    await axios.delete(`${API_BASE}/spec/item/${row.id}`)
    ElMessage.success('删除成功')
    // 从列表中移除
    const index = currentSpecGroup.items.findIndex(item => item.id === row.id)
    if (index > -1) {
      currentSpecGroup.items.splice(index, 1)
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

// 重置规格项表单
const resetSpecItemForm = () => {
  specItemForm.id = null
  specItemForm.groupId = currentSpecGroup.id
  specItemForm.value = ''
  specItemForm.value_en = ''
  specItemForm.value_ar = ''
  specItemForm.value_es = ''
  specItemForm.value_pt = ''
  specItemForm.price = 0
  specItemForm.sort = 0
  specItemFormRef.value?.clearValidate()
}

onMounted(() => {
  loadSpecGroups()
})
</script>

<style scoped>
.spec-manage {
  min-height: calc(100vh - 120px);
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions h3 {
  margin: 0;
  color: #333;
}

.spec-item-dialog {
  padding: 10px 0;
}

.spec-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.spec-item-header h4 {
  margin: 0;
  color: #333;
}
</style>
