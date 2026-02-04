const { OrderService } = require('../dist/modules/order/order.service');
const { OrderGateway } = require('../dist/modules/websocket/order.gateway');

// 创建模拟的依赖项
const mockOrderRepository = null;
const mockOrderGateway = new OrderGateway();
const mockProductService = null;
const mockSpecService = null;
const mockUserService = null;

// 创建OrderService实例
const orderService = new OrderService(
  mockOrderRepository,
  mockOrderGateway,
  mockProductService,
  mockSpecService,
  mockUserService
);

// 创建测试订单数据
const testOrder = {
  order_no: 'TEST001',
  created_at: new Date(),
  items: [
    {
      name: '绿茶',
      quantity: 1
    },
    {
      name: '老红糖生姜鲜奶',
      quantity: 1
    }
  ],
  remark: '测试订单'
};

// 测试WebSocket打印功能
async function testWebSocketPrint() {
  console.log('开始测试WebSocket打印功能...');
  
  try {
    // 调用printOrder方法
    await orderService.printOrder(testOrder, 'txt');
    console.log('✅ 打印测试完成');
  } catch (error) {
    console.error('❌ 打印测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

// 执行测试
testWebSocketPrint();
