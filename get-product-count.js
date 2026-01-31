const axios = require('axios');

async function testFullProductLoad() {
  try {
    console.log('测试加载所有商品...');
    const response = await axios.get('http://localhost:3003/api/products', {
      params: { pageSize: 1000 }
    });
    
    console.log('API响应状态:', response.data.code);
    console.log('商品总数:', response.data.data.total);
    console.log('实际加载商品数:', response.data.data.list.length);
    console.log('分页信息:', {
      page: response.data.data.page,
      pageSize: response.data.data.pageSize
    });
    
    if (response.data.data.list.length === response.data.data.total) {
      console.log('✅ 成功加载所有商品！');
    } else {
      console.log('❌ 商品加载不完整！');
      console.log('缺失商品数:', response.data.data.total - response.data.data.list.length);
    }
  } catch (error) {
    console.error('获取商品失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

testFullProductLoad();
