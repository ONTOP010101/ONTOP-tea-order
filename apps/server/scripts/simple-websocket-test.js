const { io } = require('socket.io-client');

console.log('🚀 简化WebSocket连接测试脚本');
console.log('正在测试连接...');

// 测试WebSocket连接
const socket = io('http://103.212.12.52:3000/order', {
  path: '/socket.io',
  transports: ['websocket'],
  reconnection: false,
  timeout: 5000
});

// 连接事件
socket.on('connect', () => {
  console.log('✅ 连接成功！');
  console.log('Socket ID:', socket.id);
  console.log('连接状态:', socket.connected);
  
  // 5秒后关闭连接
  setTimeout(() => {
    console.log('🔌 关闭连接');
    socket.disconnect();
    process.exit(0);
  }, 2000);
});

// 连接错误事件
socket.on('connect_error', (error) => {
  console.error('❌ 连接错误:', error.message);
  console.error('错误对象:', error);
  process.exit(1);
});

// 连接超时事件
socket.on('connect_timeout', (timeout) => {
  console.error('⏱️  连接超时:', timeout);
  process.exit(1);
});

// 断开连接事件
socket.on('disconnect', (reason) => {
  console.log('📴 断开连接，原因:', reason);
  process.exit(0);
});

// 全局错误处理
process.on('uncaughtException', (error) => {
  console.error('💥 未捕获的异常:', error.message);
  console.error('错误堆栈:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 超时处理
setTimeout(() => {
  console.error('⏰ 测试超时，退出');
  process.exit(1);
}, 10000);
