const fs = require('fs');
const path = require('path');

// 模拟订单数据
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

// 生成HTML打印内容
function generateHtmlPrintContent(order) {
  const items = order.items || [];
  const orderNo = order.order_no;
  const dateStr = new Date(order.created_at).toLocaleString('zh-CN');
  
  // 生成HTML内容
  let html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>订单收据</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.5;
      width: 80mm;
      margin: 0 auto;
      padding: 10px;
    }
    .divider {
      border-top: 2px solid #000;
      margin: 5px 0;
    }
    .header {
      text-align: center;
      margin: 10px 0;
    }
    .header h1 {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .header h2 {
      font-size: 14px;
      font-weight: normal;
    }
    .order-info {
      margin: 10px 0;
    }
    .order-info .label {
      font-weight: bold;
    }
    .order-info .value {
      float: right;
    }
    .items {
      margin: 10px 0;
    }
    .items table {
      width: 100%;
      border-collapse: collapse;
    }
    .items th {
      text-align: left;
      border-bottom: 1px solid #000;
      padding: 5px 0;
    }
    .items td {
      padding: 5px 0;
    }
    .items .quantity {
      text-align: right;
    }
    .remark {
      margin: 10px 0;
    }
    .time {
      margin: 10px 0;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="divider"></div>
  <div class="header">
    <h1>ON TOP</h1>
    <h2>悦翔茶歇</h2>
  </div>
  <div class="divider"></div>
  <div class="order-info">
    <span class="label">订单号:</span>
    <span class="value">${orderNo}</span>
  </div>
  <div class="divider"></div>
  <div class="items">
    <table>
      <thead>
        <tr>
          <th>商品名称</th>
          <th class="quantity">数量</th>
        </tr>
      </thead>
      <tbody>
`;

  // 添加商品明细
  items.forEach((item) => {
    const name = item.name || '未知商品';
    const quantity = item.quantity || 1;
    
    html += `
        <tr>
          <td>${name}</td>
          <td class="quantity">${quantity}</td>
        </tr>
`;
    
    // 显示规格组信息
    if (item.specs && item.specs.text) {
      html += `
        <tr>
          <td colspan="2">温度: ${item.specs.text}</td>
        </tr>
`;
    }
  });

  html += `
      </tbody>
    </table>
  </div>
  <div class="divider"></div>
  <div class="remark">
    <div class="label">备注:</div>
    <div>${order.remark || '无'}</div>
  </div>
  <div class="divider"></div>
  <div class="time">
    时间: ${dateStr}
  </div>
</body>
</html>
`;

  return html;
}

// 打印HTML内容
function printHtml(htmlContent, orderNo) {
  const tempHtmlPath = path.join(__dirname, `order_${orderNo}.html`);
  
  console.log('开始HTML打印流程，订单号:', orderNo);
  
  try {
    // 保存HTML文件
    fs.writeFileSync(tempHtmlPath, htmlContent);
    console.log('临时HTML文件创建成功:', tempHtmlPath);
    
    // 尝试使用child_process.spawn打开HTML文件
    console.log('尝试使用系统默认程序打开HTML文件');
    const { spawn } = require('child_process');
    
    if (process.platform === 'win32') {
      // Windows系统
      console.log('使用Windows默认程序打开HTML文件');
      spawn('cmd.exe', ['/c', 'start', '', tempHtmlPath], { detached: true, stdio: 'ignore' });
    } else if (process.platform === 'darwin') {
      // macOS系统
      console.log('使用macOS默认程序打开HTML文件');
      spawn('open', [tempHtmlPath], { detached: true, stdio: 'ignore' });
    } else {
      // Linux系统
      console.log('使用Linux默认程序打开HTML文件');
      spawn('xdg-open', [tempHtmlPath], { detached: true, stdio: 'ignore' });
    }
    
    console.log('HTML打印流程完成，文件已保存到:', tempHtmlPath);
    
    // 清理临时文件
    setTimeout(() => {
      try {
        if (fs.existsSync(tempHtmlPath)) {
          fs.unlinkSync(tempHtmlPath);
          console.log('临时文件已清理:', tempHtmlPath);
        }
      } catch (error) {
        console.error('清理临时文件失败:', error);
      }
    }, 10000); // 10秒后清理文件
  } catch (error) {
    console.error('HTML打印过程中发生错误:', error);
    
    // 清理临时文件
    try {
      if (fs.existsSync(tempHtmlPath)) {
        fs.unlinkSync(tempHtmlPath);
        console.log('临时文件已清理:', tempHtmlPath);
      }
    } catch (error) {
      console.error('清理临时文件失败:', error);
    }
    
    // 抛出错误，以便上层可以回退到TXT格式
    throw error;
  }
}

// 测试HTML打印功能
function testHtmlPrint() {
  console.log('开始测试HTML格式打印功能...');
  
  try {
    // 生成HTML打印内容
    console.log('生成HTML打印内容...');
    const htmlContent = generateHtmlPrintContent(testOrder);
    console.log('HTML测试打印内容生成成功');
    
    // 执行HTML打印测试
    console.log('执行HTML打印测试...');
    printHtml(htmlContent, testOrder.order_no);
    console.log('HTML打印测试完成');
  } catch (error) {
    console.error('测试HTML打印功能失败:', error);
  }
}

// 运行测试
testHtmlPrint();
