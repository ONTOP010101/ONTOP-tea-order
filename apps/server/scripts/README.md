# 分布式打印客户端部署指南

## 概述

本指南详细介绍如何部署和使用分布式打印客户端，实现多电脑打印功能。客户端通过WebSocket接收服务器推送的打印任务，并在本地执行打印操作。

## 系统要求

### 服务器端
- Node.js 16.0+ 
- Nest.js 框架
- Socket.IO 服务
- 端口 3003 可访问

### 客户端
- Windows 操作系统
- Node.js 16.0+ 
- 已安装打印机驱动
- 网络连接到服务器

## 快速开始

### 1. 安装客户端

1. **复制文件到客户端电脑**
   - 将 `print-client.js`、`print-client-config.json`、`start-print-client.bat` 和 `run-print-client.vbs` 文件复制到客户端电脑的某个目录（例如 `D:\客户端接收订单并打印\`）
   - 在客户端目录下创建 `logs` 文件夹

2. **安装依赖**
   ```bash
   # 在客户端目录下执行
   npm install socket.io-client
   ```

### 2. 配置客户端

1. **编辑配置文件**
   - 打开 `print-client-config.json` 文件
   - 修改以下配置：

   ```json
   {
     "serverUrl": "http://服务器IP地址:3003",
     "printerType": "txt",
     "log": {
       "level": "info",
       "dir": "logs",
       "maxFiles": 7
     },
     "reconnection": {
       "attempts": "infinity",
       "delay": 1000,
       "delayMax": 5000
     }
   }
   ```

   **重要配置说明：**
   - `serverUrl`：服务器的IP地址和端口，例如 `http://192.168.40.253:3003`
   - `printerType`：打印方式，可选 `txt`（普通打印机）或 `escpos`（热敏打印机）
   - `log.level`：日志级别，可选 `debug`、`info`、`warn`、`error`

### 3. 启动客户端

#### 方法A：使用批处理文件（推荐）

1. **双击运行**
   - 双击 `start-print-client.bat` 文件
   - 观察启动状态和日志信息
   - 客户端会在后台运行，无需保持窗口打开

#### 方法B：手动启动

1. **打开命令提示符**
   ```bash
   D:
   cd D:\客户端接收订单并打印
   node print-client.js
   ```

### 4. 设置开机自启

1. **使用注册表脚本**
   - 双击 `add-startup.reg` 文件
   - 按照提示完成注册表添加
   - 重启电脑后客户端会自动启动

## 故障排查

### 常见问题

#### 1. WebSocket连接失败

**症状：**
- 客户端日志显示 "websocket error"
- 连接状态检查显示 `false`

**解决方案：**
- 确认服务器IP地址和端口配置正确
- 测试网络连接：`ping 服务器IP地址`
- 检查服务器是否正在运行：`netstat -ano | findstr :3003`
- 暂时禁用防火墙测试连接
- 确认服务器的WebSocket服务正常启动

#### 2. 打印任务接收但不执行

**症状：**
- 客户端日志显示 "收到打印任务"
- 但打印机没有出纸

**解决方案：**
- 确认打印机已正确安装并设为默认打印机
- 测试打印机是否正常：打印测试页
- 检查打印命令是否执行：创建并运行 `test-print.js` 脚本
- 查看客户端日志中的打印执行错误信息

#### 3. 客户端启动失败

**症状：**
- 双击批处理文件无反应
- 命令提示符显示模块缺失错误

**解决方案：**
- 确认Node.js已正确安装：`node -v`
- 安装缺失的依赖：`npm install socket.io-client`
- 检查文件路径是否包含中文字符
- 以管理员身份运行命令提示符

### 测试工具

#### 1. 连接测试脚本

创建 `test-connection.js` 文件：

```javascript
const { io } = require('socket.io-client');

// 测试不同的连接方式
const testConnections = [
  'http://服务器IP地址:3003/order',
  'http://服务器IP地址:3003',
  'ws://服务器IP地址:3003/order',
  'ws://服务器IP地址:3003'
];

testConnections.forEach((url, index) => {
  console.log(`\n测试连接 ${index + 1}: ${url}`);
  
  const socket = io(url, {
    transports: ['websocket', 'polling'],
    reconnection: false,
    timeout: 5000
  });
  
  socket.on('connect', () => {
    console.log(`✅ 连接成功: ${url}`);
    socket.disconnect();
  });
  
  socket.on('connect_error', (error) => {
    console.error(`❌ 连接失败: ${error.message}`);
  });
});
```

运行测试：
```bash
node test-connection.js
```

#### 2. 打印测试脚本

创建 `test-print.js` 文件：

```javascript
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// 创建测试文件
const testContent = '测试打印内容\n这是一个测试页面';
const testFilePath = path.join(__dirname, 'test_print.txt');
fs.writeFileSync(testFilePath, testContent);

// 测试打印命令
const printCommand = `notepad /p "${testFilePath}"`;
console.log('执行打印命令:', printCommand);

exec(printCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('打印失败:', error.message);
  } else {
    console.log('打印成功');
  }
  
  // 清理测试文件
  try {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('测试文件已清理');
    }
  } catch (error) {
    console.error('清理文件失败:', error.message);
  }
});
```

运行测试：
```bash
node test-print.js
```

## 日志管理

### 日志文件

- 日志文件存储在 `logs` 目录下
- 文件命名格式：`print-client-日期.log`
- 日志级别可在配置文件中设置
- 自动保留最近7天的日志文件

### 查看日志

1. **实时查看**
   ```bash
   tail -f logs\print-client-$(date +%Y-%m-%d).log
   ```

2. **查看历史日志**
   - 直接打开 `logs` 目录下的日志文件
   - 分析错误信息和连接状态

## 高级配置

### 热敏打印机配置

如果使用热敏打印机，可修改配置文件：

```json
{
  "printerType": "escpos",
  "escpos": {
    "type": "usb", // 可选: usb, network
    "network": {
      "host": "打印机IP地址",
      "port": 9100
    }
  }
}
```

### 网络打印机配置

对于网络打印机，确保：
- 打印机已分配固定IP地址
- 端口 9100 可访问
- 打印机支持网络打印

## 安全注意事项

1. **网络安全**
   - 建议在局域网内使用
   - 如需外网访问，配置防火墙规则
   - 考虑使用HTTPS和认证机制

2. **数据安全**
   - 打印内容可能包含敏感信息
   - 确保客户端电脑物理安全
   - 定期清理日志文件

3. **系统安全**
   - 保持Node.js和依赖库更新
   - 定期扫描客户端电脑病毒
   - 使用强密码保护客户端电脑

## 版本历史

### v1.0.0
- 初始版本
- 支持WebSocket连接
- 支持TXT和ESC/POS打印
- 支持开机自启

### v1.1.0
- 优化WebSocket连接配置
- 添加连接测试工具
- 增强错误处理和日志
- 优化打印执行逻辑

## 联系支持

如果遇到无法解决的问题，请提供以下信息寻求支持：

1. **客户端日志文件**
   - 最近的日志文件内容
   - 错误信息的完整堆栈

2. **服务器信息**
   - 服务器IP地址和端口
   - 服务器运行状态
   - 服务器日志中的相关信息

3. **网络环境**
   - 网络拓扑结构
   - 防火墙设置
   - 网络连接测试结果

4. **打印机信息**
   - 打印机型号
   - 连接方式（USB/网络）
   - 驱动版本

---

**注意：** 本部署指南仅供参考，具体配置可能因网络环境和硬件设备而异。如有疑问，请咨询技术支持。