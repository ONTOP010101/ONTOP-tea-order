const { OrderService } = require('./apps/server/dist/modules/order/order.service');

// 创建一个简单的模拟依赖
const mockOrderGateway = {
  notifyNewOrder: () => {},
  notifyOrderStatusChange: () => {}
};

const mockProductService = {
  findOne: () => Promise.resolve({})
};

const mockSpecService = {
  getSpecGroupById: () => Promise.resolve({}),
  getSpecItemById: () => Promise.resolve({})
};

const mockUserService = {
  findOne: () => Promise.resolve({ id: 1 }),
  create: () => Promise.resolve({ id: 1 })
};

const mockOrderRepository = {
  create: (order) => order,
  save: (order) => Promise.resolve(order)
};

// 创建OrderService实例
const orderService = new OrderService(
  mockOrderRepository,
  mockOrderGateway,
  mockProductService,
  mockSpecService,
  mockUserService
);

// 测试HTML打印功能
console.log('开始测试HTML打印功能...');
orderService.testPrintFormat('html')
  .then(() => {
    console.log('HTML打印测试完成！');
  })
  .catch((error) => {
    console.error('HTML打印测试失败:', error);
  });
