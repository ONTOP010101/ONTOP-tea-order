<template>
  <div class="order-display-screen">
    <div class="screen-header">
      <h1>订单显示屏</h1>
      <div class="current-time">{{ currentTime }}</div>
      <div class="header-actions">
        <el-button type="primary" size="medium" @click="loadOrders" class="refresh-button">
          <el-icon>
            <Refresh />
          </el-icon>
          刷新
        </el-button>
      </div>
    </div>
    
    <!-- 订单状态统计 -->
    <div class="order-stats">
      <div 
        class="stat-card" 
        :class="{ active: selectedStatus === 'pending' }"
        @click="selectStatus('pending')"
      >
        <div class="stat-label">待接单</div>
        <div class="stat-value">{{ pendingOrdersCount }}</div>
      </div>
      <div 
        class="stat-card" 
        :class="{ active: selectedStatus === 'preparing' }"
        @click="selectStatus('preparing')"
      >
        <div class="stat-label">备餐中</div>
        <div class="stat-value">{{ preparingOrdersCount }}</div>
      </div>
      <div 
        class="stat-card" 
        :class="{ active: selectedStatus === 'completed' }"
        @click="selectStatus('completed')"
      >
        <div class="stat-label">已出餐</div>
        <div class="stat-value">{{ completedOrdersCount }}</div>
      </div>
      <div 
        class="stat-card" 
        :class="{ active: selectedStatus === 'cancelled' }"
        @click="selectStatus('cancelled')"
      >
        <div class="stat-label">已取消</div>
        <div class="stat-value">{{ cancelledOrdersCount }}</div>
      </div>
    </div>
    
    <!-- 订单卡片容器 -->
    <div class="order-cards-container">
      <div 
        v-for="order in filteredOrders" 
        :key="order.id"
        class="order-card"
        :class="order.status"
      >
        <div class="order-header">
          <div class="order-no">{{ order.order_no }}</div>
          <div class="order-time">{{ formatDate(order.created_at) }}</div>
        </div>
        <div class="order-items">
          <div 
          v-for="(item, index) in order.items" 
          :key="index"
          class="order-item"
        >
          <div class="item-main-info">
            <div class="item-name">{{ item.name }}</div>
            <!-- 显示规格组 -->
            <div v-if="item.specs?.text" class="item-specs">
              <span class="spec-item">{{ item.specs.text }}</span>
            </div>
          </div>
          <div class="item-quantity">x{{ item.quantity }}</div>
          <!-- 价格隐藏 -->
        </div>
        </div>
        <div class="order-footer">
          <!-- 总价隐藏 -->
          <div class="order-remark" v-if="order.remark">{{ order.remark }}</div>
        </div>
        <div class="order-actions">
          <el-button 
            v-if="order.status === 'pending'" 
            type="primary" 
            size="small"
            @click="updateOrderStatus(order, 'preparing')"
          >
            开始备餐
          </el-button>
          <el-button 
            v-if="order.status === 'preparing' || order.status === 'processing' || order.status === 'making'" 
            type="success" 
            size="small"
            @click="updateOrderStatus(order, 'completed')"
          >
            已出餐
          </el-button>
          <el-button 
            v-if="order.status === 'pending'" 
            type="danger" 
            size="small"
            @click="updateOrderStatus(order, 'cancelled')"
          >
            取消订单
          </el-button>
        </div>
      </div>
      <div v-if="filteredOrders.length === 0" class="empty-orders">
        暂无订单
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import axios from 'axios'
import { io } from 'socket.io-client'

// 配置axios实例，确保其他电脑可以正常访问
const apiClient = axios.create({
  timeout: 10000, // 增加超时时间到10秒
  headers: {
    'Content-Type': 'application/json'
  }
})

// 定义订单类型
interface OrderItem {
  id: number
  name: string
  price: number
  quantity: number
  image: string
  specs?: any
}

interface Order {
  id: number
  order_no: string
  user_id: number
  session_id?: string
  created_at: string
  updated_at: string
  total_amount: number
  discount_amount: number
  final_amount: number
  status: 'pending' | 'preparing' | 'processing' | 'making' | 'ready' | 'completed' | 'cancelled'
  items: OrderItem[]
  remark?: string
}

// 订单数据
const orders = ref<Order[]>([])
const loading = ref(false)
const currentTime = ref('')
const selectedStatus = ref('pending')

// 筛选订单
const pendingOrders = ref<Order[]>([])
const preparingOrders = ref<Order[]>([])
const completedOrders = ref<Order[]>([])
const cancelledOrders = ref<Order[]>([])

// 订单数量统计
const allOrdersCount = computed(() => orders.value.length)
const pendingOrdersCount = computed(() => pendingOrders.value.length)
const preparingOrdersCount = computed(() => preparingOrders.value.length)
const completedOrdersCount = computed(() => completedOrders.value.length)
const cancelledOrdersCount = computed(() => cancelledOrders.value.length)

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 更新当前时间
const updateCurrentTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN')
}

// 选择状态
const selectStatus = (status: string) => {
  selectedStatus.value = status
}

// 过滤订单
const filteredOrders = computed(() => {
  return orders.value.filter(order => {
    if (selectedStatus.value === 'pending') {
      return order.status === 'pending'
    } else if (selectedStatus.value === 'preparing') {
      return order.status === 'preparing' || order.status === 'processing' || order.status === 'making'
    } else if (selectedStatus.value === 'completed') {
      return order.status === 'completed'
    } else if (selectedStatus.value === 'cancelled') {
      return order.status === 'cancelled'
    }
    return order.status === 'pending' // 默认显示待接单
  })
})

// 加载订单
const loadOrders = async () => {
  try {
    loading.value = true
    console.log('🔄 开始加载订单...')
    // 使用相对路径，通过vite.config.ts中的代理配置访问服务器
    // 注意：这里获取所有订单，明确不添加sessionId参数，确保能看到所有用户的订单
    const response = await apiClient.get('/api/orders/admin/all', {
      params: {}
    })
    console.log('📦 收到订单数据:', response.data)
    
    // 正确处理API响应格式：{ code: 200, data: { list: [], total: 0 } }
    let orderList = []
    if (response.data.code === 200) {
      // 标准API响应格式
      orderList = response.data.data?.list || []
    } else {
      // 直接返回数据的格式（兼容旧格式）
      orderList = response.data?.list || response.data || []
    }
    
    // 对订单进行倒序排序：旧订单在前，新订单在后（根据创建时间）
    orderList.sort((a, b) => {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    
    orders.value = orderList
    console.log('📋 订单总数:', orders.value.length)
    filterOrders()
    console.log('✅ 订单加载完成，待接单数量:', pendingOrders.value.length)
  } catch (error: any) {
    console.error('❌ 加载订单失败:', error.message, error.response?.data)
    // 更详细的错误提示
    let errorMsg = '加载订单失败'
    if (error.code === 'ECONNABORTED') {
      errorMsg = '网络连接超时，请检查网络'
    } else if (error.response) {
      errorMsg = error.response.data?.message || errorMsg
    } else if (error.request) {
      errorMsg = '服务器无响应，请检查服务器状态'
    }
    ElMessage.error(errorMsg)
  } finally {
    loading.value = false
  }
}

// 筛选订单
const filterOrders = () => {
  pendingOrders.value = orders.value.filter(order => order.status === 'pending')
  preparingOrders.value = orders.value.filter(order => 
    order.status === 'preparing' || 
    order.status === 'processing' || 
    order.status === 'making'
  )
  completedOrders.value = orders.value.filter(order => order.status === 'completed')
  cancelledOrders.value = orders.value.filter(order => order.status === 'cancelled')
}

// 更新订单状态
const updateOrderStatus = async (order: Order, status: 'pending' | 'preparing' | 'completed' | 'cancelled') => {
  try {
    // 使用相对路径，通过vite.config.ts中的代理配置访问服务器
    await apiClient.put(`/api/orders/${order.id}/status`, { status })
    ElMessage.success('订单状态更新成功')
    loadOrders()
  } catch (error: any) {
    console.error('更新订单状态失败:', error)
    let errorMsg = '订单状态更新失败'
    if (error.response?.data?.message) {
      errorMsg = error.response.data.message
    }
    ElMessage.error(errorMsg)
  }
}

// 定时器引用
let timer: number | null = null
// Socket连接引用
let socket: any = null
// 超时订单检测定时器
let timeoutCheckTimer: number | null = null
// 上次播报时间
let lastTimeoutAnnounceTime: number = 0

// 播放新订单语音提示
const playNewOrderSound = () => {
  try {
    // 播放叮咚音效
    const dingSound = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
    dingSound.play().catch(err => console.error('播放音效失败:', err));
    
    // 使用Web Speech API播放语音提示，确保每个订单只播报一次
    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance('您有新的订单请及时处理');
      speech.lang = 'zh-CN';
      speech.rate = 0.9;
      speech.pitch = 1.1;
      speech.volume = 1;
      
      // 设置甜妹声音（选择女性声音）
      let voices = window.speechSynthesis.getVoices();
      let femaleVoice = voices.find(voice => 
        voice.lang === 'zh-CN' && (voice.name.includes('Female') || voice.name.includes('女') || voice.gender === 'female')
      );
      
      // 如果没有找到女性声音，尝试使用默认中文声音
      if (!femaleVoice) {
        femaleVoice = voices.find(voice => voice.lang === 'zh-CN') || voices[0];
      }
      
      if (femaleVoice) {
        speech.voice = femaleVoice;
      }
      
      // 检查当前是否有正在播放的语音，如果有则不重复播放
      if (!window.speechSynthesis.speaking) {
        window.speechSynthesis.speak(speech);
      }
    }
  } catch (error) {
    console.error('播放语音提示失败:', error);
  }
};

// 播放超时订单语音提示
const playTimeoutOrderSound = () => {
  try {
    // 使用Web Speech API播放超时提示
    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance('注意！您有超时订单未接,请及时处理');
      speech.lang = 'zh-CN';
      speech.rate = 0.9;
      speech.pitch = 1.1;
      speech.volume = 1;
      
      // 设置甜妹声音（选择女性声音）
      let voices = window.speechSynthesis.getVoices();
      let femaleVoice = voices.find(voice => 
        voice.lang === 'zh-CN' && (voice.name.includes('Female') || voice.name.includes('女') || voice.gender === 'female')
      );
      
      // 如果没有找到女性声音，尝试使用默认中文声音
      if (!femaleVoice) {
        femaleVoice = voices.find(voice => voice.lang === 'zh-CN') || voices[0];
      }
      
      if (femaleVoice) {
        speech.voice = femaleVoice;
      }
      
      // 检查当前是否有正在播放的语音，如果有则不重复播放
      if (!window.speechSynthesis.speaking) {
        window.speechSynthesis.speak(speech);
        // 更新上次播报时间
        lastTimeoutAnnounceTime = Date.now();
      }
    }
  } catch (error) {
    console.error('播放超时提示失败:', error);
  }
};

// 检查待接单订单是否超时
const checkTimeoutOrders = () => {
  try {
    const now = Date.now();
    const oneMinute = 60 * 1000; // 1分钟的毫秒数
    
    // 过滤出待接单且超时1分钟的订单
    const timeoutOrders = pendingOrders.value.filter(order => {
      const orderTime = new Date(order.created_at).getTime();
      return now - orderTime >= oneMinute;
    });
    
    console.log('🔍 检查超时订单:', timeoutOrders.length, '个待接单订单超时');
    
    // 如果有待接单超时订单，且距离上次播报超过1分钟，则播报
    if (timeoutOrders.length > 0) {
      const timeSinceLastAnnounce = now - lastTimeoutAnnounceTime;
      if (timeSinceLastAnnounce >= oneMinute) {
        console.log('⏰ 播放超时订单提示');
        playTimeoutOrderSound();
      }
    }
  } catch (error) {
    console.error('检查超时订单失败:', error);
  }
};

// 初始化语音合成，确保能获取到语音列表
const initSpeechSynthesis = () => {
  if ('speechSynthesis' in window) {
    // 确保语音列表已加载
    window.speechSynthesis.getVoices();
    
    // 监听语音列表加载完成事件
    window.speechSynthesis.onvoiceschanged = () => {
      console.log('✅ 语音列表已加载');
    };
  }
};

onMounted(() => {
  // 初始化语音合成
  initSpeechSynthesis();
  
  // 加载订单
  loadOrders()
  // 设置定时器，每秒更新时间
  timer = window.setInterval(updateCurrentTime, 1000)
  // 初始更新时间
  updateCurrentTime()
  // 设置定时器，每5秒刷新一次订单
  window.setInterval(loadOrders, 5000)
  
  // 建立WebSocket连接
  initWebSocket()
  
  // 设置超时订单检查定时器，每30秒检查一次
  timeoutCheckTimer = window.setInterval(checkTimeoutOrders, 30000);
  
  // 立即执行一次订单加载，确保页面显示最新订单
  setTimeout(() => {
    loadOrders()
  }, 1000)
})

const initWebSocket = () => {
  try {
    // 使用当前页面的源地址动态构建WebSocket连接URL，确保其他电脑可以正常访问
    const wsUrl = `${window.location.protocol}//${window.location.hostname}:3003/order`;
    socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    // 连接成功事件
    socket.on('connect', () => {
      console.log('✅ WebSocket连接成功，命名空间：/order');
      // 加入制作端房间
      socket.emit('join-production', {});
      console.log('✅ 已加入制作端房间：production-room');
      ElMessage.success('已连接到实时订单推送服务');
    });
    
    // 接收新订单事件 - 监听所有可能的事件名称
    socket.on('new-order', (data: any) => {
      console.log('🎉 收到新订单事件:', data);
      // 立即刷新订单列表，确保第一时间显示
      loadOrders();
      // 显示明显提示，吸引注意
      ElMessage({
        message: '🎉 收到新订单！',
        type: 'success',
        duration: 3000,
        customClass: 'new-order-notification'
      });
      // 播放语音提示
      playNewOrderSound();
    });
    
    // 接收订单状态变更事件
    socket.on('order-status-change', (data: any) => {
      console.log('📋 订单状态变更事件:', data);
      // 立即刷新订单列表
      loadOrders();
    });
    
    // 监听所有事件，用于调试
    socket.onAny((event: string, ...args: any[]) => {
      console.log(`🔔 收到事件: ${event}`, args);
      // 如果是新订单或状态变更事件，确保刷新订单
      if (event === 'new-order' || event === 'order-status-change') {
        console.log('🔄 事件触发订单刷新');
      }
    });
    
    // 测试用：手动触发订单刷新
    window.refreshOrders = () => {
      console.log('🎯 手动触发订单刷新');
      loadOrders();
    };
    
    // 连接错误事件
    socket.on('connect_error', (error: any) => {
      console.error('❌ WebSocket连接错误:', error);
      ElMessage.warning('实时订单推送服务连接失败，将使用定时刷新');
    });
    
    // 断开连接事件
    socket.on('disconnect', (reason: any) => {
      console.log('❌ WebSocket断开连接，原因:', reason);
      ElMessage.warning('实时订单推送服务已断开');
    });
    
    // 重连事件
    socket.on('reconnect', (attemptNumber: number) => {
      console.log(`🔄 WebSocket重连成功，尝试次数: ${attemptNumber}`);
      ElMessage.success('实时订单推送服务已重新连接');
    });
  } catch (error) {
    console.error('❌ 初始化WebSocket失败:', error);
    ElMessage.warning('实时订单推送服务初始化失败，将使用定时刷新');
  }
}

onUnmounted(() => {
  // 清除定时器
  if (timer) {
    clearInterval(timer)
  }
  
  // 清除超时订单检查定时器
  if (timeoutCheckTimer) {
    clearInterval(timeoutCheckTimer);
  }
  
  // 关闭WebSocket连接
  if (socket) {
    socket.disconnect()
    socket = null
  }
})
</script>

<style scoped>
.order-display-screen {
  width: 100vw;
  height: 100vh;
  background-color: #f0f2f5;
  padding: 20px;
  box-sizing: border-box;
  overflow-y: auto;
  font-size: 16px;
}

.screen-header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.screen-header h1 {
  margin: 0;
  font-size: 30px;
  color: #303133;
  flex: 1;
}

.header-actions {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-left: auto;
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 20px;
  font-size: 16px;
  font-weight: bold;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.refresh-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

.refresh-button:active {
  transform: translateY(0);
}

.refresh-button .el-icon {
  font-size: 18px;
}

.stat-card:nth-child(5) {
  border-top: 4px solid #909399;
}

.current-time {
  font-size: 20px;
  color: #606266;
  font-weight: bold;
  margin-right: 20px;
}

.order-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  min-width: 140px;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.stat-card.active {
  background-color: #409eff;
  color: #fff;
  transform: translateY(-5px);
  box-shadow: 0 4px 20px rgba(64, 158, 255, 0.4);
}

.stat-card.active .stat-label,
.stat-card.active .stat-value {
  color: #fff;
}

.stat-card:nth-child(1) {
  border-top: 4px solid #e6a23c;
}

.stat-card:nth-child(2) {
  border-top: 4px solid #67c23a;
}

.stat-card:nth-child(3) {
  border-top: 4px solid #f56c6c;
}

.stat-card:nth-child(4) {
  border-top: 4px solid #909399;
}

.stat-label {
  font-size: 16px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: #303133;
  transition: all 0.3s ease;
}

.order-cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.order-card {
  background-color: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-left: 5px solid #e5e7eb;
  position: relative;
  overflow: hidden;
}

.order-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #e5e7eb 0%, transparent 100%);
  transition: all 0.3s ease;
}

.order-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
}

.order-card.pending {
  border-left-color: #f79009;
  background: linear-gradient(135deg, #fff7ed 0%, #ffffff 100%);
}

.order-card.pending::before {
  background: linear-gradient(90deg, #f79009 0%, transparent 100%);
}

.order-card.processing,
.order-card.making,
.order-card.preparing {
  border-left-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%);
}

.order-card.processing::before,
.order-card.making::before,
.order-card.preparing::before {
  background: linear-gradient(90deg, #10b981 0%, transparent 100%);
}

.order-card.ready {
  border-left-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
}

.order-card.ready::before {
  background: linear-gradient(90deg, #3b82f6 0%, transparent 100%);
}

.order-card.completed {
  border-left-color: #f43f5e;
  background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
  opacity: 0.9;
}

.order-card.completed::before {
  background: linear-gradient(90deg, #f43f5e 0%, transparent 100%);
}

.order-card.cancelled {
  border-left-color: #6b7280;
  background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
  opacity: 0.8;
}

.order-card.cancelled::before {
  background: linear-gradient(90deg, #6b7280 0%, transparent 100%);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px dashed #f3f4f6;
}

.order-no {
  color: #1f2937;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.order-time {
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  background: #f9fafb;
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.order-items {
  margin-bottom: 16px;
  padding: 12px 0;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 10px 12px;
  transition: all 0.2s ease;
  border-radius: 8px;
  background-color: #ffffff;
  border: 1px solid #f3f4f6;
}

.order-item:hover {
  background: #f3f4f6;
}

.order-item:last-child {
  margin-bottom: 0;
}

.item-main-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.item-name {
  color: #1f2937;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 4px;
}

.item-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 2px;
}

.spec-item {
  font-size: 11px;
  color: #6b7280;
  background-color: #f1f5f9;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.item-quantity {
  color: #374151;
  font-size: 14px;
  font-weight: 700;
  background: #fbbf24;
  color: #78350f;
  padding: 4px 12px;
  border-radius: 20px;
  margin-left: 16px;
  white-space: nowrap;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(251, 191, 36, 0.3);
}

.item-price {
  color: #f97316;
  font-weight: 700;
  font-size: 16px;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;
  padding-top: 12px;
  border-top: 2px dashed #f3f4f6;
  flex-wrap: wrap;
  gap: 8px;
}

.order-total {
  color: #dc2626;
  font-weight: 800;
  font-size: 20px;
  letter-spacing: -0.5px;
}

.order-remark {
  color: #6b7280;
  font-size: 14px;
  background: #f3f4f6;
  padding: 6px 12px;
  border-radius: 8px;
  border-left: 3px solid #d1d5db;
  max-width: 100%;
  word-break: break-word;
  white-space: normal;
  line-height: 1.4;
}

.order-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid #f3f4f6;
  margin: 16px -20px -20px;
  background: #fafafa;
  border-radius: 0 0 12px 12px;
}

.order-actions .el-button {
  border-radius: 10px;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  padding: 14px 28px;
  font-size: 17px;
  min-width: 130px;
  flex: 1;
  max-width: 180px;
  text-align: center;
}

.order-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.empty-orders {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
  font-size: 19px;
  font-weight: 500;
  background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border: 2px dashed #e5e7eb;
}

.empty-orders::before {
  content: '📋';
  display: block;
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

/* 优化状态标签显示 */
.order-card .order-status {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.order-card.pending .order-status {
  color: #f79009;
  background: rgba(247, 144, 9, 0.1);
  border: 1px solid #f79009;
}

.order-card.preparing .order-status,
.order-card.processing .order-status,
.order-card.making .order-status {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid #10b981;
}

.order-card.ready .order-status {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid #3b82f6;
}

.order-card.completed .order-status {
  color: #f43f5e;
  background: rgba(244, 63, 94, 0.1);
  border: 1px solid #f43f5e;
}

.order-card.cancelled .order-status {
  color: #6b7280;
  background: rgba(107, 114, 128, 0.1);
  border: 1px solid #6b7280;
}
</style>