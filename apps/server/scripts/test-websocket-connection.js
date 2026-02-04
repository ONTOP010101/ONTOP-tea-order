const { io } = require('socket.io-client');

// 测试WebSocket连接
const socket = io('http://localhost:3000/order', {
  path: '/socket.io',
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000
});

// 连接事件
socket.on('connect', () => {
  console.log('✅ 连接到服务器成功，Socket ID:', socket.id);
  
  // 测试发送消息
  socket.emit('test-message', {
    message: 'Hello from test client',
    timestamp: new Date()
  });
  console.log('📤 发送测试消息');
});

// 断开连接事件
socket.on('disconnect', () => {
  console.log('❌ 与服务器断开连接');
});

// 重连事件
socket.on('reconnect', (attemptNumber) => {
  console.log('🔄 重连成功，尝试次数:', attemptNumber);
});

// 重连失败事件
socket.on('reconnect_error', (error) => {
  console.error('❌ 重连失败:', error.message);
});

// 连接错误事件
socket.on('connect_error', (error) => {
  console.error('❌ 连接错误:', error.message);
  console.error('错误堆栈:', error.stack);
});

// 监听打印任务
socket.on('print-order', (data) => {
  console.log('📄 收到打印任务:', data);
});

console.log('🚀 WebSocket连接测试脚本启动');
console.log('正在尝试连接到 http://localhost:3000/order');

// 5秒后如果没有连接成功，退出
setTimeout(() => {
  if (!socket.connected) {
    console.error('❌ 连接超时，退出测试');
    process.exit(1);
  } else {
    console.log('✅ 连接保持正常，测试完成');
    process.exit(0);
  }
}, 10000);
