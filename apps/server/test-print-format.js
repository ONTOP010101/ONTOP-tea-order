// 测试打印格式的脚本
const { OrderService } = require('./dist/modules/order/order.service');

// 创建一个模拟的OrderService实例
const orderService = new OrderService(
  null, // orderRepository
  null, // orderGateway
  null, // productService
  null, // specService
  null  // userService
);

// 调用测试方法
orderService.testPrintFormat().then(() => {
  console.log('测试完成');
}).catch((error) => {
  console.error('测试失败:', error);
});
