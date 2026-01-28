const axios = require('axios');

// 配置
const API_BASE = 'http://localhost:3004/api'; // 后端API地址

// 函数：获取所有商品
async function getAllProducts() {
  try {
    const response = await axios.get(`${API_BASE}/products`, {
      params: {
        page: 1,
        pageSize: 1000, // 足够大的页面大小来获取所有商品
        status: 'all' // 获取所有状态的商品
      },
      timeout: 10000
    });
    
    if (response.data.code === 200) {
      return response.data.data.list;
    } else {
      console.error('获取商品列表失败:', response.data.message);
      return [];
    }
  } catch (error) {
    console.error('请求失败:', error.message);
    return [];
  }
}

// 函数：删除商品
async function deleteProduct(id) {
  try {
    const response = await axios.delete(`${API_BASE}/products/${id}`, {
      timeout: 5000
    });
    
    if (response.data.code === 200) {
      console.log(`✅ 成功删除商品 ID: ${id}`);
      return true;
    } else {
      console.error(`❌ 删除商品 ID: ${id} 失败:`, response.data.message);
      return false;
    }
  } catch (error) {
    console.error(`❌ 删除商品 ID: ${id} 失败:`, error.message);
    return false;
  }
}

// 函数：删除新添加的商品
async function deleteNewProducts() {
  console.log('🔍 获取所有商品...');
  const products = await getAllProducts();
  
  if (products.length === 0) {
    console.log('⚠️  没有找到商品');
    return;
  }
  
  console.log(`📊 找到 ${products.length} 个商品`);
  
  // 按创建时间排序，最新的在前
  products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  // 显示最新的10个商品
  console.log('\n📅 最新添加的商品:');
  products.slice(0, 10).forEach((product, index) => {
    console.log(`${index + 1}. ID: ${product.id}, 名称: ${product.name}, 创建时间: ${product.created_at}`);
  });
  
  // 确认删除
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('\n💡 请输入要删除的商品ID范围（例如：60-80），或输入"all"删除所有商品，或输入"latest"删除最新添加的10个商品: ', async (answer) => {
    readline.close();
    
    let idsToDelete = [];
    
    if (answer.toLowerCase() === 'all') {
      // 删除所有商品
      idsToDelete = products.map(p => p.id);
      console.log(`\n⚠️  准备删除所有 ${idsToDelete.length} 个商品`);
    } else if (answer.toLowerCase() === 'latest') {
      // 删除最新的10个商品
      idsToDelete = products.slice(0, 10).map(p => p.id);
      console.log(`\n⚠️  准备删除最新的 ${idsToDelete.length} 个商品`);
    } else if (answer.includes('-')) {
      // 删除ID范围的商品
      const [start, end] = answer.split('-').map(Number);
      idsToDelete = products.filter(p => p.id >= start && p.id <= end).map(p => p.id);
      console.log(`\n⚠️  准备删除ID范围 ${start}-${end} 的 ${idsToDelete.length} 个商品`);
    } else {
      // 删除单个ID的商品
      const id = Number(answer);
      if (products.some(p => p.id === id)) {
        idsToDelete = [id];
        console.log(`\n⚠️  准备删除商品 ID: ${id}`);
      } else {
        console.log('❌ 无效的ID');
        return;
      }
    }
    
    if (idsToDelete.length === 0) {
      console.log('❌ 没有找到符合条件的商品');
      return;
    }
    
    // 二次确认
    readline.createInterface({
      input: process.stdin,
      output: process.stdout
    }).question(`\n✅ 确认删除 ${idsToDelete.length} 个商品？(yes/no): `, async (confirm) => {
      if (confirm.toLowerCase() === 'yes') {
        console.log('\n🚀 开始删除商品...');
        
        let successCount = 0;
        let failCount = 0;
        
        for (const id of idsToDelete) {
          const success = await deleteProduct(id);
          if (success) {
            successCount++;
          } else {
            failCount++;
          }
          // 等待100ms，避免请求过快
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`\n📊 删除完成：`);
        console.log(`✅ 成功删除: ${successCount} 个商品`);
        console.log(`❌ 删除失败: ${failCount} 个商品`);
        console.log(`📈 总操作: ${idsToDelete.length} 个商品`);
      } else {
        console.log('\n❌ 取消删除操作');
      }
    });
  });
}

// 运行脚本
console.log('🚀 删除新添加商品脚本');
console.log('====================================');
console.log('此脚本用于删除因Excel导入导致图片加载失败的商品');
console.log('====================================\n');

deleteNewProducts();
