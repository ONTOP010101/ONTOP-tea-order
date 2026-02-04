// 打印工具函数

/**
 * 格式化日期
 * @param date 日期字符串
 * @returns 格式化后的日期字符串
 */
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleString()
}

/**
 * 打印订单
 * @param order 订单信息
 */
export const printOrder = (order: any): void => {
  console.log('打印订单:', order.order_no)
  
  // 创建隐藏的打印区域
  const printArea = document.createElement('div')
  printArea.id = 'print-area'
  printArea.style.position = 'fixed'
  printArea.style.top = '-9999px'
  printArea.style.left = '-9999px'
  printArea.style.width = '100%'
  printArea.style.height = '100%'
  printArea.style.backgroundColor = 'white'
  printArea.style.padding = '0'
  printArea.style.margin = '0'
  printArea.style.zIndex = '9999'
  printArea.style.display = 'block'
  
  // 生成打印内容
  let printContent = `
    <style>
      @media print {
        body * {
          visibility: hidden;
        }
        #print-area, #print-area * {
          visibility: visible;
        }
        #print-area {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        @page {
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
        }
        .print-content {
          font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
          font-size: 22px;
          font-weight: normal;
          color: #000000;
          line-height: 1.5;
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 10px;
        }
        .header h1,
        .header h2 {
          margin: 0;
          padding: 0;
          font-weight: normal;
        }
        .header h2 {
          margin-bottom: 10px;
        }
        .divider {
          margin: 10px 0;
          text-align: center;
          font-weight: normal;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          font-weight: normal;
        }
        .info-label {
          flex-shrink: 0;
        }
        .info-value {
          text-align: right;
          flex-grow: 1;
        }
        .info-row.remark {
          display: block;
          text-align: center;
        }
        .info-row.remark .info-label {
          display: block;
          margin-bottom: 5px;
        }
        .info-row.remark .info-value {
          text-align: center;
        }
        .product-header {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          font-weight: normal;
        }
        .product-item {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          font-weight: normal;
        }
        .product-name {
          flex-grow: 1;
        }
        .product-spec {
          font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
          font-size: 18px;
          font-weight: normal;
          color: #000000;
          margin-left: 20px;
          margin-top: 2px;
        }
        .product-quantity {
          text-align: right;
          flex-shrink: 0;
          width: 50px;
        }
      }
    </style>
    <div class="print-content">
      <div class="header">
        <h1>ON TOP</h1>
        <h2>悦翔茶歇</h2>
        <div class="divider">============================================</div>
      </div>
      
      <div class="info-row">
        <span class="info-label">订单号:</span>
        <span class="info-value">${order.order_no}</span>
      </div>
      
      <div class="divider">============================================</div>
      
      <div class="product-header">
        <span>商品名称</span>
        <span>数量</span>
      </div>
      
      <div class="divider">============================================</div>
      
      <div class="product-list">
  `
  
  if (order.items && order.items.length > 0) {
    order.items.forEach((item: any) => {
      printContent += `
        <div class="product-item">
          <span class="product-name">${item.name}</span>
          <span class="product-quantity">${item.quantity}</span>
        </div>
      `
      
      // 显示规格组信息
      if (item.specs && item.specs.text) {
        printContent += `
          <div class="product-spec">${item.specs.text}</div>
        `
      }
    })
  }
  
  printContent += `
      </div>
      
      <div class="divider">============================================</div>
      
      <div class="info-row remark">
        <span class="info-label">备注:</span>
        <span class="info-value">${order.remark || '无'}</span>
      </div>
      
      <div class="divider">============================================</div>
      
      <div class="info-row">
        <span class="info-label">时间:</span>
        <span class="info-value">${formatDate(order.created_at)}</span>
      </div>
    </div>
  `
  
  printArea.innerHTML = printContent
  document.body.appendChild(printArea)
  
  // 触发打印
  window.print()
  
  // 打印完成后清理
  setTimeout(() => {
    document.body.removeChild(printArea)
  }, 100)
}
