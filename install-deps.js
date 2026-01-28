const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 安装依赖脚本');
console.log('====================================');
console.log('此脚本用于安装运行删除商品脚本所需的依赖');
console.log('====================================\n');

// 检查package.json文件
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  console.log('📦 检测到项目的package.json文件');
  
  // 检查是否已经安装了axios
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const hasAxios = packageJson.dependencies && packageJson.dependencies.axios;
  
  if (hasAxios) {
    console.log('✅ 项目已经安装了axios依赖');
  } else {
    console.log('⚠️  项目未安装axios依赖，正在安装...');
    try {
      execSync('npm install axios', { stdio: 'inherit' });
      console.log('✅ axios依赖安装成功');
    } catch (error) {
      console.error('❌ axios依赖安装失败:', error.message);
      process.exit(1);
    }
  }
} else {
  console.log('⚠️  未找到项目的package.json文件');
  console.log('🔄 正在当前目录安装axios依赖...');
  try {
    execSync('npm init -y', { stdio: 'inherit' });
    execSync('npm install axios', { stdio: 'inherit' });
    console.log('✅ axios依赖安装成功');
  } catch (error) {
    console.error('❌ 依赖安装失败:', error.message);
    process.exit(1);
  }
}

console.log('\n🎉 依赖安装完成！');
console.log('\n📚 使用说明:');
console.log('1. 确保后端服务正在运行 (http://localhost:3004)');
console.log('2. 运行删除商品脚本: node delete-new-products.js');
console.log('3. 按照提示输入要删除的商品ID范围');
console.log('\n💡 示例:');
console.log('   - 删除ID范围60-80的商品: 输入 "60-80"');
console.log('   - 删除最新添加的10个商品: 输入 "latest"');
console.log('   - 删除所有商品: 输入 "all"');
console.log('   - 删除单个商品: 输入商品ID，例如 "65"');
