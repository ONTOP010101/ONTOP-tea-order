// 测试打印格式的脚本，直接写入文件
const fs = require('fs');
const path = require('path');

// 模拟短名称拆分和对齐函数
function splitShortName(name, threshold = 2) {
  if (!name || name.length > threshold) {
    return name;
  }
  
  // 计算需要填充的空格数量，总宽度保持一致
  const totalWidth = 22; // 与商品名称列宽度一致
  const availableSpaces = totalWidth - name.length;
  const spacesPerChar = Math.floor(availableSpaces / (name.length - 1));
  
  let result = '';
  for (let i = 0; i < name.length; i++) {
    result += name[i];
    if (i < name.length - 1) {
      result += ' '.repeat(spacesPerChar);
    }
  }
  
  // 填充剩余空格
  const remainingSpaces = totalWidth - result.length;
  if (remainingSpaces > 0) {
    result += ' '.repeat(remainingSpaces);
  }
  
  return result;
}

function getAlignedStr(name, targetWidth = 22) {
  // 先拆分短名称
  const splitName = splitShortName(name);
  
  // 计算宽度并补位，确保返回固定长度的字符串
  let result = splitName;
  if (result.length > targetWidth) {
    result = result.substring(0, targetWidth);
  } else if (result.length < targetWidth) {
    result = result.padEnd(targetWidth, ' ');
  }
  
  // 确保长度固定
  while (result.length < targetWidth) {
    result += ' ';
  }
  while (result.length > targetWidth) {
    result = result.substring(0, targetWidth);
  }
  
  return result;
}

// 生成测试内容
function generateTestContent() {
  const items = [
    { name: '绿茶', quantity: 1 },
    { name: '老红糖生姜鲜奶', quantity: 1 }
  ];
  
  let content = '';
  content += '商品名称                      数量\n';
  content += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  
  items.forEach(item => {
    const { name, quantity } = item;
    const formattedName = getAlignedStr(name);
    const quantityStr = quantity.toString();
    const paddedQuantity = quantityStr.padStart(10, ' ');
    content += `${formattedName}${paddedQuantity}\n`;
  });
  
  return content;
}

// 生成测试内容并写入文件
const testContent = generateTestContent();
const testFilePath = path.join(__dirname, 'test-print-output.txt');

fs.writeFileSync(testFilePath, testContent, 'utf8');
console.log('测试内容已写入文件:', testFilePath);
console.log('\n测试内容:');
console.log(testContent);

// 显示文件的十六进制内容，查看实际的空格数量
const fileContent = fs.readFileSync(testFilePath, 'utf8');
console.log('\n文件内容（十六进制）:');
for (let i = 0; i < fileContent.length; i++) {
  const char = fileContent[i];
  const code = char.charCodeAt(0).toString(16).padStart(2, '0');
  process.stdout.write(`${code} `);
  if ((i + 1) % 16 === 0) {
    process.stdout.write('\n');
  }
}
console.log('\n');
