<template>
  <div class="order-manage">
    <h1>订单管理</h1>
    

    <!-- 订单列表表格 -->
    <div style="background: white; padding: 20px; margin: 20px 0; border: 1px solid #eaeaea;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3>订单列表</h3>
        <button @click="exportOrders" class="export-btn">导出订单</button>
      </div>
      <div v-if="orders.length === 0">
        <p>暂无订单数据</p>
      </div>
      <div v-else>
        <table class="order-table" ref="orderTable">
          <thead>
            <tr>
              <th>
                订单号
                <div class="resize-handle" @mousedown="startResize($event, 0)"></div>
              </th>
              <th>
                备注
                <div class="resize-handle" @mousedown="startResize($event, 1)"></div>
              </th>
              <th>
                下单时间
                <div class="resize-handle" @mousedown="startResize($event, 2)"></div>
              </th>
              <th>
                订单状态
                <div class="resize-handle" @mousedown="startResize($event, 3)"></div>
              </th>
              <th>
                操作
                <div class="resize-handle" @mousedown="startResize($event, 4)"></div>
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="order in orders" :key="order.id">
              <!-- 订单主行 -->
              <tr class="order-main-row">
                <td>{{ order.order_no }}</td>
                <td>{{ order.remark || '无' }}</td>
                <td>{{ formatDate(order.created_at) }}</td>
                <td>{{ getOrderStatus(order.status) }}</td>
                <td>
                  <button @click="printOrder(order)" class="print-btn">
                    确定打印订单
                  </button>
                  <button @click="toggleOrderDetail(order.id)" class="detail-btn">
                    {{ expandedOrders.includes(order.id) ? '收起订单明细' : '展开订单明细' }}
                  </button>
                </td>
              </tr>
              <!-- 订单明细行 -->
              <tr v-if="expandedOrders.includes(order.id)" class="order-detail-row">
                <td colspan="5">
                  <div class="order-detail-content">
                    <h4>订单商品明细</h4>
                    <table class="detail-table">
                      <thead>
                        <tr>
                          <th>商品名称</th>
                          <th>分类</th>
                          <th>规格</th>
                          <th>价格</th>
                          <th>数量</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(item, index) in order.items" :key="index">
                          <td>{{ item.name }}</td>
                          <td>{{ item.category || '无' }}</td>
                          <td>{{ item.specs && item.specs.text ? item.specs.text : '无' }}</td>
                          <td>{{ (parseFloat(item.price) || 0).toFixed(2) }}</td>
                          <td>{{ item.quantity }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- 导出订单浮层 -->
  <div v-if="showExportModal" class="modal-overlay" @click="showExportModal = false">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h4>导出订单</h4>
        <button class="close-btn" @click="showExportModal = false">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>导出类型</label>
          <div class="radio-group">
            <label>
              <input type="radio" v-model="selectedExportType" value="csv" />
              CSV文件
            </label>
            <label>
              <input type="radio" v-model="selectedExportType" value="print" />
              打印订单
            </label>
          </div>
        </div>
        <div class="form-group">
          <label>订单状态</label>
          <select v-model="selectedOrderStatus" class="select-control">
            <option value="all">全部订单</option>
            <option value="pending">待接单</option>
            <option value="preparing">备餐中</option>
            <option value="ready">待取餐</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
        
        <!-- 日期选择面板（仅当订单状态为已完成时显示） -->
        <div v-if="selectedOrderStatus === 'completed'" class="form-group">
          <label>日期范围</label>
          <div class="date-range-selector">
            <input 
              type="date" 
              v-model="startDate" 
              class="date-input"
              placeholder="开始日期"
            />
            <span style="margin: 0 10px;">至</span>
            <input 
              type="date" 
              v-model="endDate" 
              class="date-input"
              placeholder="结束日期"
            />
          </div>
        </div>
        <div class="form-group">
          <label>分类导出</label>
          <select v-model="selectedCategory" class="select-control">
            <option value="all">全部分类</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>选择字段:</label>
          <div class="checkbox-group">
            <label>
              <input type="checkbox" :checked="selectedFields.includes('order_no')" @change="toggleField('order_no')" />
              订单号
            </label>
            <label>
              <input type="checkbox" :checked="selectedFields.includes('category')" @change="toggleField('category')" />
              分类
            </label>
            <label>
              <input type="checkbox" :checked="selectedFields.includes('product_name')" @change="toggleField('product_name')" />
              商品名称
            </label>
            <label>
              <input type="checkbox" :checked="selectedFields.includes('remark')" @change="toggleField('remark')" />
              备注
            </label>
            <label>
              <input type="checkbox" :checked="selectedFields.includes('created_at')" @change="toggleField('created_at')" />
              下单时间
            </label>
            <label>
              <input type="checkbox" :checked="selectedFields.includes('status')" @change="toggleField('status')" />
              订单状态
            </label>
            <label>
              <input type="checkbox" :checked="selectedFields.includes('price')" @change="toggleField('price')" />
              价格
            </label>
            <label>
              <input type="checkbox" :checked="selectedFields.includes('specs')" @change="toggleField('specs')" />
              规格
            </label>
          </div>
          <div class="checkbox-actions">
            <button @click="selectAllFields" class="action-btn primary">全选</button>
            <button @click="clearSelectedFields" class="action-btn secondary">清除</button>
          </div>
          <div class="sort-display" v-if="selectedFields.length > 0">
            <span 
              v-for="(field, index) in selectedFields" 
              :key="field"
              class="field-tag"
            >
              {{ fieldDisplayNames[field] }}
            </span>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn cancel-btn" @click="showExportModal = false">取消</button>
        <button class="btn confirm-btn" @click="confirmExport">确认导出</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import * as XLSX from 'xlsx'

// 类型定义
interface Order {
  id: string
  order_no: string
  remark: string
  created_at: string
  status: string
  items: OrderItem[]
}

interface OrderItem {
  name: string
  category: string
  specs: {
    text: string
  }
  price: string
  quantity: number
}

// 响应数据类型
interface ApiResponse {
  code: number
  data: {
    list: Order[]
  }
}

// 状态管理
const loading = ref(false)
const orders = ref<Order[]>([])
const expandedOrders = ref<string[]>([])
const orderTable = ref<HTMLElement | null>(null)

// 拖拽调整列宽的状态
const resizing = ref(false)
const currentColumn = ref(-1)
const startX = ref(0)
const startWidth = ref(0)

const formatDate = (date: string) => {
  return new Date(date).toLocaleString()
}

const getOrderStatus = (status: any) => {
  console.log('Order status value:', status, typeof status)
  
  // 处理空值情况
  if (!status) {
    console.log('Status is empty:', status)
    return '未知状态'
  }
  
  // 状态映射 - 使用字符串键
  const statusMap: Record<string, string> = {
    'pending': '待接单',
    'preparing': '备餐中',
    'ready': '待取餐',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  
  const result = statusMap[status] || '未知状态'
  console.log('Status mapping result:', result)
  return result
}

// 开始调整列宽
const startResize = (event: MouseEvent, columnIndex: number) => {
  event.preventDefault()
  resizing.value = true
  currentColumn.value = columnIndex
  startX.value = event.clientX
  
  // 获取当前列的宽度
  const thElements = document.querySelectorAll('.order-table th')
  if (thElements[columnIndex]) {
    startWidth.value = thElements[columnIndex].offsetWidth
  }
  
  // 添加全局鼠标事件监听器
  document.addEventListener('mousemove', resize)
  document.addEventListener('mouseup', stopResize)
  
  // 添加鼠标离开窗口的事件监听器
  document.addEventListener('mouseleave', stopResize)
}

// 正在调整列宽
const resize = (event: MouseEvent) => {
  if (!resizing.value || currentColumn.value === -1) return
  
  const deltaX = event.clientX - startX.value
  const newWidth = Math.max(50, startWidth.value + deltaX) // 最小宽度50px
  
  // 设置当前列的宽度
  const thElements = document.querySelectorAll('.order-table th')
  const tdElements = document.querySelectorAll(`.order-table td:nth-child(${currentColumn.value + 1})`)
  
  if (thElements[currentColumn.value]) {
    thElements[currentColumn.value].style.width = `${newWidth}px`
    thElements[currentColumn.value].style.minWidth = `${newWidth}px`
  }
  
  // 设置所有对应数据列的宽度
  tdElements.forEach(td => {
    td.style.width = `${newWidth}px`
    td.style.minWidth = `${newWidth}px`
  })
}

// 停止调整列宽
const stopResize = () => {
  resizing.value = false
  currentColumn.value = -1
  
  // 移除全局鼠标事件监听器
  document.removeEventListener('mousemove', resize)
  document.removeEventListener('mouseup', stopResize)
  document.removeEventListener('mouseleave', stopResize)
}

const toggleOrderDetail = (orderId: string) => {
  const index = expandedOrders.value.indexOf(orderId)
  if (index > -1) {
    expandedOrders.value.splice(index, 1)
  } else {
    expandedOrders.value.push(orderId)
  }
}

// 提取所有唯一分类（保留此函数但不再使用，改为直接从API获取）
const extractCategories = () => {
  const uniqueCategories = new Set<string>()
  
  orders.value.forEach(order => {
    order.items.forEach(item => {
      if (item.category) {
        uniqueCategories.add(item.category)
      }
    })
  })
  
  // 转换为数组，不添加"全部分类"选项（在模板中单独处理）
  categories.value = Array.from(uniqueCategories)
  console.log('提取的分类:', categories.value)
}

const loadOrders = async () => {
  loading.value = true
  try {
    // 使用正确的端口和requestType参数
    const { data } = await axios.get<ApiResponse>('http://localhost:3003/api/orders/admin/all', {
      params: {
        page: 1,
        pageSize: 50,
        requestType: 'admin' // 管理后台请求，返回所有订单
      }
    })
    
    if (data.code === 200) {
      orders.value = data.data.list || []
      console.log('订单数据加载成功:', orders.value.length, '条')
      // 打印第一条订单的详细信息，了解数据结构
      if (orders.value.length > 0) {
        console.log('订单数据结构:', JSON.stringify(orders.value[0], null, 2))
      }
    }
  } catch (error) {
    console.error('加载订单失败:', error)
  } finally {
    loading.value = false
  }
}

// 浮层状态
const showExportModal = ref(false)
const selectedExportType = ref('csv')
const selectedOrderStatus = ref('all')
const selectedCategory = ref('all')

// 日期选择
const startDate = ref('')
const endDate = ref('')

// 动态分类列表
const categories = ref([])

// 字段选择和排序
const selectedFields = ref(['order_no', 'category', 'product_name', 'remark', 'created_at'])

// 字段显示名称映射
const fieldDisplayNames = {
  'order_no': '订单号',
  'category': '分类',
  'product_name': '商品名称',
  'remark': '备注',
  'created_at': '下单时间',
  'status': '订单状态',
  'price': '价格',
  'specs': '规格'
}

// 加载所有分类
const loadCategories = async () => {
  try {
    const { data } = await axios.get('/api/categories')
    if (data.code === 200) {
      categories.value = data.data.map((category: any) => category.name)
      console.log('加载的分类:', categories.value)
    }
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

// 切换字段选择
const toggleField = (field: string) => {
  const index = selectedFields.value.indexOf(field)
  if (index > -1) {
    // 取消选择
    selectedFields.value.splice(index, 1)
  } else {
    // 添加选择
    selectedFields.value.push(field)
  }
}

// 全选字段
const selectAllFields = () => {
  selectedFields.value = ['order_no', 'category', 'product_name', 'remark', 'created_at', 'status', 'price', 'specs']
}

// 清除字段选择
const clearSelectedFields = () => {
  selectedFields.value = []
}

// 获取字段显示名称
const getFieldDisplayNames = () => {
  return selectedFields.value.map(field => fieldDisplayNames[field])
}

const exportOrders = () => {
  showExportModal.value = true
}

// 确认导出
const confirmExport = () => {
  console.log('开始导出订单，类型:', selectedExportType.value, '状态:', selectedOrderStatus.value)
  
  // 检查是否有勾选字段
  if (selectedFields.value.length === 0) {
    alert('请至少勾选一个字段')
    return
  }
  
  if (orders.value.length === 0) {
    alert('暂无订单数据可导出')
    showExportModal.value = false
    return
  }
  
  // 筛选订单
  let filteredOrders = orders.value
  if (selectedOrderStatus.value !== 'all') {
    filteredOrders = filteredOrders.filter(order => order.status === selectedOrderStatus.value)
  }
  
  // 按日期范围筛选（仅当订单状态为已完成时）
  if (selectedOrderStatus.value === 'completed' && (startDate.value || endDate.value)) {
    filteredOrders = filteredOrders.filter(order => {
      const orderDate = new Date(order.created_at)
      if (startDate.value) {
        const start = new Date(startDate.value)
        if (orderDate < start) return false
      }
      if (endDate.value) {
        const end = new Date(endDate.value)
        end.setHours(23, 59, 59, 999)
        if (orderDate > end) return false
      }
      return true
    })
  }
  
  // 按分类筛选
  if (selectedCategory.value !== 'all') {
    filteredOrders = filteredOrders.filter(order => {
      // 检查订单中是否有商品属于选中的分类
      return order.items.some(item => item.category === selectedCategory.value)
    })
  }
  
  // 根据选择的类型导出
  if (selectedExportType.value === 'csv') {
    exportToExcel(filteredOrders, selectedCategory.value)
  } else if (selectedExportType.value === 'print') {
    printSelectedOrders(filteredOrders)
  }
  
  showExportModal.value = false
}

// 导出为Excel
const exportToExcel = (orderData: Order[], selectedCategory: string) => {
  // 准备导出数据
  const exportData: Record<string, string>[] = []
  
  orderData.forEach(order => {
    // 如果选择了特定分类，只处理该分类的商品
    if (selectedCategory !== 'all') {
      // 过滤出该分类的商品
      const filteredItems = order.items.filter(item => item.category === selectedCategory)
      
      // 为每个符合条件的商品创建一行数据
      filteredItems.forEach((item: OrderItem) => {
        const rowData: Record<string, string> = {}
        
        selectedFields.value.forEach(field => {
          switch (field) {
            case 'order_no':
              rowData['订单号'] = order.order_no
              break
            case 'category':
              rowData['分类'] = item.category || '无'
              break
            case 'product_name':
              rowData['商品名称'] = item.name
              break
            case 'remark':
              rowData['备注'] = order.remark || '无'
              break
            case 'created_at':
              rowData['下单时间'] = formatDate(order.created_at)
              break
            case 'status':
              rowData['订单状态'] = getOrderStatus(order.status)
              break
            case 'price':
              rowData['价格'] = (parseFloat(item.price) || 0).toFixed(2)
              break
            case 'specs':
              rowData['规格'] = item.specs && item.specs.text ? item.specs.text : '无'
              break
          }
        })
        
        exportData.push(rowData)
      })
    } else {
      // 如果选择了全部分类，处理所有商品
      if (order.items && order.items.length > 0) {
        order.items.forEach((item: OrderItem) => {
          const rowData: Record<string, string> = {}
          
          selectedFields.value.forEach(field => {
            switch (field) {
              case 'order_no':
                rowData['订单号'] = order.order_no
                break
              case 'category':
                rowData['分类'] = item.category || '无'
                break
              case 'product_name':
                rowData['商品名称'] = item.name
                break
              case 'remark':
                rowData['备注'] = order.remark || '无'
                break
              case 'created_at':
                rowData['下单时间'] = formatDate(order.created_at)
                break
              case 'status':
                rowData['订单状态'] = getOrderStatus(order.status)
                break
              case 'price':
                rowData['价格'] = (parseFloat(item.price) || 0).toFixed(2)
                break
              case 'specs':
                rowData['规格'] = item.specs && item.specs.text ? item.specs.text : '无'
                break
            }
          })
          
          exportData.push(rowData)
        })
      } else {
        // 如果订单没有商品明细，创建一行空数据
        const rowData: Record<string, string> = {}
        
        selectedFields.value.forEach(field => {
          switch (field) {
            case 'order_no':
              rowData['订单号'] = order.order_no
              break
            case 'category':
              rowData['分类'] = '无'
              break
            case 'product_name':
              rowData['商品名称'] = '无'
              break
            case 'remark':
              rowData['备注'] = order.remark || '无'
              break
            case 'created_at':
              rowData['下单时间'] = formatDate(order.created_at)
              break
            case 'status':
              rowData['订单状态'] = getOrderStatus(order.status)
              break
            case 'price':
              rowData['价格'] = '0.00'
              break
            case 'specs':
              rowData['规格'] = '无'
              break
          }
        })
        
        exportData.push(rowData)
      }
    }
  })
  
  // 如果没有数据，直接返回
  if (exportData.length === 0) {
    alert('没有符合条件的数据可导出')
    return
  }
  
  // 创建工作簿和工作表
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(exportData)
  
  // 设置列宽（适配A4尺寸，根据实际内容调整）
  const columnWidths = selectedFields.value.map(field => {
    switch (field) {
      case 'order_no': return { wch: 22 } // 订单号需要更宽
      case 'category': return { wch: 15 } // 分类
      case 'product_name': return { wch: 25 } // 商品名称
      case 'remark': return { wch: 30 } // 备注可能较长
      case 'created_at': return { wch: 25 } // 下单时间
      case 'status': return { wch: 15 } // 订单状态
      case 'price': return { wch: 15 } // 价格
      case 'specs': return { wch: 35 } // 规格可能较长
      default: return { wch: 18 } // 默认宽度
    }
  })
  
  worksheet['!cols'] = columnWidths
  
  // 设置行高
  worksheet['!rows'] = [
    { hpt: 36 }, // 标题行高，更加突出
    ...Array(exportData.length).fill({ hpt: 24 }) // 数据行高，提高可读性
  ]
  
  // 获取标题行的单元格地址
  const headers = Object.keys(exportData[0])
  headers.forEach((header, index) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index })
    // 更新标题行的样式
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = {
        font: { bold: true, sz: 18, color: { rgb: '000000' }, name: 'Microsoft YaHei' },
        fill: { patternType: 'solid', fgColor: { rgb: 'F2F2F2' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'medium', color: { rgb: '000000' } },
          bottom: { style: 'medium', color: { rgb: '000000' } },
          left: { style: 'medium', color: { rgb: '000000' } },
          right: { style: 'medium', color: { rgb: '000000' } }
        }
      }
    }
  })
  
  // 更新数据行的样式
  for (let row = 1; row <= exportData.length; row++) {
    headers.forEach((header, index) => {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: index })
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { sz: 12, color: { rgb: '333333' }, name: 'Microsoft YaHei' },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: {
            top: { style: 'thin', color: { rgb: 'CCCCCC' } },
            bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
            left: { style: 'thin', color: { rgb: 'CCCCCC' } },
            right: { style: 'thin', color: { rgb: 'CCCCCC' } }
          }
        }
      }
    })
  }
  
  // 将工作表添加到工作簿
  XLSX.utils.book_append_sheet(workbook, worksheet, '订单数据')
  
  // 生成Excel文件并下载
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `订单数据_${new Date().toISOString().slice(0, 10)}.xlsx`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  console.log('订单导出完成')
}

// 打印选中的订单
const printSelectedOrders = (orderData: any[]) => {
  console.log('打印选中的订单:', orderData.length)
  // 这里可以实现批量打印功能
  alert(`将打印 ${orderData.length} 个订单`)
}

// 转换数据为CSV格式
const convertToCSV = (data: any[]) => {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const csvHeaders = headers.join(',')
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header]
      // 处理包含逗号或引号的值
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return '"' + value.replace(/"/g, '""') + '"'
      }
      return value
    }).join(',')
  })
  
  return [csvHeaders, ...csvRows].join('\n')
}

const printOrder = (order: Order) => {
  console.log('打印订单:', order.order_no)
  
  // 生成完整的打印HTML
  const printHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>订单打印</title>
      <style>
        @page {
          margin: 0;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
          font-size: 22px;
          font-weight: normal;
          color: #000000;
          line-height: 1.5;
          background-color: white;
          margin: 0;
          padding: 20px;
        }
        .print-content {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 10px;
        }
        .header h1,
        .header h2 {
          margin: 0;
          padding: 0;
          font-weight: normal;
        }
        .header h2 {
          margin-bottom: 10px;
        }
        .divider {
          margin: 10px 0;
          text-align: center;
          font-weight: normal;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          font-weight: normal;
        }
        .info-label {
          flex-shrink: 0;
        }
        .info-value {
          text-align: right;
          flex-grow: 1;
        }
        .info-row.remark {
          display: block;
          text-align: center;
        }
        .info-row.remark .info-label {
          display: block;
          margin-bottom: 5px;
        }
        .info-row.remark .info-value {
          text-align: center;
        }
        .product-header {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          font-weight: normal;
        }
        .product-item {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          font-weight: normal;
        }
        .product-name {
          flex-grow: 1;
        }
        .product-spec {
          font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
          font-size: 18px;
          font-weight: normal;
          color: #000000;
          margin-left: 20px;
          margin-top: 2px;
        }
      </style>
    </head>
    <body>
      <div class="print-content">
        <div class="header">
          <h1>ON TOP</h1>
          <h2>悦翔茶歇</h2>
          <div class="divider">============================================</div>
        </div>
        
        <div class="info-row">
          <span class="info-label">订单号:</span>
          <span class="info-value">${order.order_no}</span>
        </div>
        
        <div class="divider">============================================</div>
        
        <div class="product-header">
          <span>商品名称</span>
          <span>数量</span>
        </div>
        
        <div class="divider">============================================</div>
        
        <div class="product-list">
  `
  
  let printContent = printHtml
  
  if (order.items && order.items.length > 0) {
    order.items.forEach((item: OrderItem) => {
      printContent += `
        <div class="product-item">
          <span class="product-name">${item.name}</span>
          <span class="product-quantity">${item.quantity}</span>
        </div>
      `
      
      // 显示规格组信息
      if (item.specs && item.specs.text) {
        printContent += `
          <div class="product-spec">${item.specs.text}</div>
        `
      }
    })
  }
  
  printContent += `
        </div>
        
        <div class="divider">============================================</div>
        
        <div class="info-row remark">
          <span class="info-label">备注:</span>
          <span class="info-value">${order.remark || '无'}</span>
        </div>
        
        <div class="divider">============================================</div>
        
        <div class="info-row">
          <span class="info-label">时间:</span>
          <span class="info-value">${formatDate(order.created_at)}</span>
        </div>
      </div>
    </body>
    </html>
  `
  
  // 创建新窗口打印
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(printContent)
    printWindow.document.close()
    
    // 等待页面加载完成后打印
    printWindow.onload = function() {
      printWindow.print()
      
      // 等待打印完成后关闭
      setTimeout(function() {
        printWindow.close()
      }, 500)
    }
  }
}

onMounted(() => {
  loadOrders()
  loadCategories()
  console.log('OrderManage 组件挂载成功')
})
</script>

<style scoped>
.order-manage {
  padding: 20px;
  min-height: 600px;
}

h1 {
  color: #333;
  font-size: 24px;
  margin-bottom: 20px;
}

h3 {
  color: #666;
  font-size: 18px;
  margin-bottom: 15px;
}

h4 {
  color: #333;
  font-size: 16px;
  margin: 10px 0;
}

p {
  color: #666;
  margin: 5px 0;
}

.order-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e8e8e8;
  table-layout: fixed;
}

.order-table th {
  position: relative;
}

.order-table th:hover {
  cursor: pointer;
}

/* 可调整列宽的样式 */
.resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 5px;
  cursor: col-resize;
  background-color: transparent;
}

.resize-handle:hover {
  background-color: #1890ff;
}

/* 启用列宽调整 */
.order-table th,
.order-table td {
  overflow: auto;
}

.order-table th,
.order-table td {
  border-right: 1px solid #e8e8e8;
}

.order-table th:last-child,
.order-table td:last-child {
  border-right: none;
}

.order-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.order-table th {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
  background-color: #f5f5f5;
  font-weight: bold;
  color: #333;
}

.order-table th:nth-child(2),
.order-table td:nth-child(2) {
  width: 150px;
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-table th:nth-child(5),
.order-table td:nth-child(5) {
  width: 300px;
  max-width: 300px;
}

.order-main-row:hover {
  background-color: #fafafa;
}

.order-detail-row {
  background-color: #f9f9f9;
}

.order-detail-content {
  padding: 15px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: white;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.detail-table td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #e8e8e8;
}

.detail-table th {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #e8e8e8;
  background-color: #f0f0f0;
  font-weight: bold;
  font-size: 14px;
}

/* 调整明细表格列宽 */
  .detail-table th:nth-child(2),
  .detail-table td:nth-child(2) {
    width: 200px;
    min-width: 200px;
  }
  
  /* 调整规格列宽（调大） */
  .detail-table th:nth-child(3),
  .detail-table td:nth-child(3) {
    width: 250px;
    min-width: 250px;
  }
  
  /* 调整数量列宽（调小一半） */
  .detail-table th:nth-child(5),
  .detail-table td:nth-child(5) {
    width: 100px;
    min-width: 100px;
  }
  
  /* 日期选择样式 */
  .date-input {
    padding: 10px 12px;
    border: 2px solid #e8e8e8;
    border-radius: 8px;
    font-size: 14px;
    font-family: 'Microsoft YaHei', sans-serif;
    transition: all 0.3s ease;
    background-color: white;
  }
  
  .date-input:focus {
    outline: none;
    border-color: #1890ff;
    box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
  }
  
  .date-range-selector {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: linear-gradient(135deg, #f8f9ff 0%, #e6f7ff 100%);
    border-radius: 12px;
    border: 1px solid #d9efff;
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.1);
  }
  
  .date-range-selector span {
    color: #666;
    font-weight: 500;
    font-size: 14px;
  }

/* 为规格列添加调整手柄 */
.detail-table th {
  position: relative;
}

.detail-table th:nth-child(2)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 5px;
  cursor: col-resize;
  background-color: transparent;
}

.detail-table th:nth-child(2):hover::after {
  background-color: #1890ff;
}

.print-btn {
  margin-right: 10px;
  padding: 6px 12px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.print-btn:hover {
  background: #40a9ff;
}

.detail-btn {
  padding: 6px 12px;
  background: #f0f0f0;
  color: #333;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}

.detail-btn:hover {
  background: #e6f7ff;
  border-color: #91d5ff;
}

.export-btn {
  padding: 6px 12px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.export-btn:hover {
  background: #73d13d;
}

/* 浮层样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(24, 144, 255, 0.2);
  width: 800px;
  max-width: 95%;
  min-height: 500px;
  animation: modalFadeIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  overflow: hidden;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border-bottom: none;
}

.modal-header h4 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.modal-body {
  padding: 32px;
}

.form-group {
  margin-bottom: 28px;
}

.form-group label {
  display: block;
  margin-bottom: 12px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

/* 单选按钮组 */
.radio-group {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9ff 0%, #e6f7ff 100%);
  border-radius: 10px;
  border: 1px solid #d9efff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.1);
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  color: #333;
  padding: 10px 20px;
  border-radius: 8px;
  transition: all 0.3s ease;
  background-color: white;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  flex: 1;
  justify-content: center;
}

.radio-group label:hover {
  background-color: #f0f9ff;
  border-color: #1890ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
  transform: translateY(-2px);
}

.radio-group input[type="radio"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #1890ff;
}

/* 复选框组 */
.checkbox-group {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin: 16px 0 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9ff 0%, #e6f7ff 100%);
  border-radius: 10px;
  border: 1px solid #d9efff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.1);
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal;
  font-size: 14px;
  color: #333;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
  background-color: white;
  border: 1px solid #e8e8e8;
}

.checkbox-group label:hover {
  background-color: #f0f9ff;
  border-color: #91d5ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
}

.checkbox-group input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #1890ff;
  transition: all 0.2s ease;
}

.checkbox-group input[type="checkbox"]:checked {
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

/* 复选框操作按钮 */
.checkbox-actions {
  display: flex;
  gap: 16px;
  margin: 20px 0;
  justify-content: flex-start;
}

.action-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-btn.primary {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
}

.action-btn.primary:hover {
  background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.35);
  transform: translateY(-2px);
}

.action-btn.secondary {
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  color: #333;
  border: 1px solid #d9d9d9;
}

.action-btn.secondary:hover {
  background: linear-gradient(135deg, #e8e8e8 0%, #d9d9d9 100%);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

/* 排序显示 */
.sort-display {
  margin-top: 20px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 10px;
  border: 1px solid #e8e8e8;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  justify-content: flex-start;
  align-items: center;
}

.sort-display:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* 字段标签 */
.field-tag {
  padding: 12px 20px;
  background: linear-gradient(135deg, #69b1ff 0%, #1890ff 100%);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  border: 1px solid #40a9ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
  transition: all 0.3s ease;
  min-width: 90px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.field-tag::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%);
  transform: rotate(45deg);
  animation: shine 3s infinite;
  opacity: 0;
}

@keyframes shine {
  0% {
    transform: translateX(-100%) rotate(45deg);
    opacity: 0;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    transform: translateX(100%) rotate(45deg);
    opacity: 0;
  }
}

.field-tag:hover {
  background: linear-gradient(135deg, #40a9ff 0%, #096dd9 100%);
  box-shadow: 0 8px 20px rgba(24, 144, 255, 0.4);
  transform: translateY(-3px) scale(1.05);
  border-color: #1890ff;
}

.field-tag:hover::before {
  animation: shine 1.5s infinite;
}

/* 排序显示 */
.sort-display {
  margin-top: 20px;
  padding: 24px;
  background-color: #f5f5f5;
  border-radius: 10px;
  border: 1px solid #e8e8e8;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  min-height: 120px;
}

/* 订单状态选择 */
.form-group select {
  width: 100%;
  padding: 12px 20px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  max-height: 300px;
  overflow-y: auto;
}

.form-group select:hover {
  border-color: #1890ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.1);
}

.form-group select:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.2);
}

/* 自定义滚动条样式 */
.form-group select::-webkit-scrollbar {
  width: 8px;
}

.form-group select::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.form-group select::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.form-group select::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* 模态框底部 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding: 24px 32px;
  background-color: #f9f9f9;
  border-top: 1px solid #e8e8e8;
}

/* 按钮样式 */
.btn {
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.cancel-btn {
  background: white;
  color: #333;
  border: 1px solid #d9d9d9;
}

.cancel-btn:hover {
  background: #f0f9ff;
  border-color: #1890ff;
  color: #1890ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
  transform: translateY(-2px);
}

.confirm-btn {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
}

.confirm-btn:hover {
  background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.35);
  transform: translateY(-2px);
}

/* 关闭按钮 */
.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: white;
  padding: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transform: rotate(90deg) scale(1.1);
}
</style>