const { io } = require('socket.io-client');
const fs = require('fs');
const path = require('path');

// 加载配置文件
let config;
try {
  config = require('./print-client-config.json');
  
  // 兼容旧配置格式
  if (config.logLevel && !config.log) {
    config.log = {
      level: config.logLevel,
      dir: 'logs',
      maxFiles: 7
    };
  }
  
  if (!config.reconnection) {
    config.reconnection = {
      attempts: 'infinity',
      delay: 1000,
      delayMax: 5000
    };
  }
  
  if (!config.heartbeat) {
    config.heartbeat = {
      interval: 5000
    };
  }
  
} catch (error) {
  console.error('❌ 配置文件加载失败，使用默认配置:', error.message);
  config = {
    serverUrl: 'http://localhost:3003',
    printerType: 'txt',
    escpos: {
      type: 'usb',
      network: {
        host: 'localhost',
        port: 9100
      }
    },
    log: {
      level: 'info',
      dir: 'logs',
      maxFiles: 7
    },
    reconnection: {
      attempts: 'infinity',
      delay: 1000,
      delayMax: 5000
    },
    heartbeat: {
      interval: 5000
    }
  };
}

// 确保日志目录存在
const logsDir = path.join(__dirname, config.log.dir || 'logs');
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log(`创建日志目录: ${logsDir}`);
  }
} catch (error) {
  console.error(`创建日志目录失败: ${error.message}`);
}

// 日志清理函数
function cleanOldLogs() {
  try {
    const maxFiles = config.log?.maxFiles || 7;
    
    // 读取日志目录中的所有文件
    const files = fs.readdirSync(logsDir);
    
    // 过滤出日志文件
    const logFiles = files.filter(file => {
      return file.startsWith('print-client-') && file.endsWith('.log');
    });
    
    // 按日期排序（旧的在前）
    logFiles.sort((a, b) => {
      const dateA = a.replace('print-client-', '').replace('.log', '');
      const dateB = b.replace('print-client-', '').replace('.log', '');
      return new Date(dateA) - new Date(dateB);
    });
    
    // 需要删除的文件数量
    const filesToDelete = logFiles.length - maxFiles;
    
    if (filesToDelete > 0) {
      console.log(`发现 ${logFiles.length} 个日志文件，需要保留 ${maxFiles} 个，将删除 ${filesToDelete} 个旧文件`);
      
      // 删除旧文件
      for (let i = 0; i < filesToDelete; i++) {
        const fileToDelete = logFiles[i];
        const filePath = path.join(logsDir, fileToDelete);
        
        try {
          fs.unlinkSync(filePath);
          console.log(`删除旧日志文件: ${fileToDelete}`);
        } catch (error) {
          console.error(`删除日志文件失败 ${fileToDelete}: ${error.message}`);
        }
      }
    } else {
      console.log(`日志文件数量正常: ${logFiles.length}/${maxFiles}`);
    }
  } catch (error) {
    console.error(`日志清理失败: ${error.message}`);
  }
}

// 执行日志清理
cleanOldLogs();

// 日志文件路径
const logFilePath = path.join(logsDir, `print-client-${new Date().toISOString().split('T')[0]}.log`);

// 日志函数
function log(level, message) {
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  const currentLevel = levels[config.log?.level || config.logLevel] || 1;
  
  if (levels[level] >= currentLevel) {
    const timestamp = new Date().toLocaleString('zh-CN');
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    // 输出到控制台
    console.log(logMessage);
    
    // 输出到文件
    try {
      fs.appendFileSync(logFilePath, logMessage + '\n');
    } catch (error) {
      console.error(`写入日志文件失败: ${error.message}`);
    }
  }
}

// 连接到服务器WebSocket
const socket = io(`${config.serverUrl}/order`, {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: config.reconnection.attempts === 'infinity' ? Infinity : parseInt(config.reconnection.attempts) || Infinity,
  reconnectionDelay: config.reconnection.delay || 1000,
  reconnectionDelayMax: config.reconnection.delayMax || 5000,
  timeout: 10000
});

// 连接事件
socket.on('connect', () => {
  log('info', `✅ 连接到服务器成功，Socket ID: ${socket.id}`);
  log('info', `连接状态: ${socket.connected}`);
  log('info', `Socket实例: ${socket}`);
});

// 断开连接事件
socket.on('disconnect', (reason) => {
  log('warn', `❌ 与服务器断开连接，原因: ${reason}，正在尝试重连...`);
});

// 重连成功事件
socket.on('reconnect', (attemptNumber) => {
  log('info', `✅ 重连成功，尝试次数: ${attemptNumber}`);
  log('info', `重连后Socket ID: ${socket.id}`);
});

// 重连失败事件
socket.on('reconnect_error', (error) => {
  log('error', `❌ 重连失败: ${error.message}`);
  log('error', `错误堆栈: ${error.stack}`);
});

// 连接错误事件
socket.on('connect_error', (error) => {
  log('error', `❌ 连接错误: ${error.message}`);
  log('error', `错误堆栈: ${error.stack}`);
  log('error', `尝试连接的URL: ${config.serverUrl}/order`);
});

// 连接超时事件
socket.on('connect_timeout', (timeout) => {
  log('error', `⏱️  连接超时: ${timeout}ms`);
});

// 监听打印任务
socket.on('print-order', async (data) => {
  log('info', `📄 收到打印任务: ${data.data.order.order_no}`);
  
  try {
    const order = data.data.order;
    const printContent = data.data.printContent;
    
    // 执行本地打印
    await executePrint(order, printContent);
    
    log('info', `✅ 打印任务执行成功: ${order.order_no}`);
  } catch (error) {
    log('error', `❌ 打印任务执行失败: ${error.message}`);
  }
});

// 执行打印
async function executePrint(order, printContent) {
  if (config.printerType === 'escpos') {
    await printWithEscPos(order, printContent);
  } else {
    await printWithTxt(order, printContent);
  }
}

// 使用ESC/POS打印
async function printWithEscPos(order, printContent) {
  try {
    log('info', '尝试使用ESC/POS格式打印');
    
    // 动态加载escpos库
    const escpos = require('escpos');
    
    let device;
    if (config.escpos.type === 'usb') {
      // 尝试使用USB打印机
      const devices = escpos.USB.findPrinter();
      if (devices && devices.length > 0) {
        log('info', '找到USB打印机');
        device = new escpos.USB();
      } else {
        throw new Error('未找到USB打印机');
      }
    } else if (config.escpos.type === 'network') {
      // 使用网络打印机
      log('info', `连接到网络打印机: ${config.escpos.network.host}:${config.escpos.network.port}`);
      device = new escpos.Network(config.escpos.network.host, config.escpos.network.port);
    } else {
      throw new Error('无效的打印机类型配置');
    }
    
    const printer = new escpos.Printer(device);
    
    return new Promise((resolve, reject) => {
      device.open((error) => {
        if (error) {
          reject(new Error(`打印机连接失败: ${error.message}`));
          return;
        }
        
        try {
          // 初始化打印机
          printer
            .font('a')
            .align('ct')
            .style('bu')
            .size(1, 1)
            .text('ON TOP')
            .text('悦翔茶歇')
            .align('lt')
            .style('normal')
            .size(1, 0)
            .setLineHeight(30)
            .text('--------------------------------');
          
          // 打印订单号
          printer
            .text(`订单号: ${order.order_no}`)
            .text('--------------------------------');
          
          // 打印商品明细
          printer
            .text('商品明细')
            .text('--------------------------------');
          
          // 打印商品列表
          const items = order.items || [];
          items.forEach((item) => {
            const name = item.name || '未知商品';
            const quantity = item.quantity || 1;
            printer.text(`${name}  X${quantity}`);
            
            if (item.specs && item.specs.text) {
              printer.text(`温度:${item.specs.text}`);
            }
          });
          
          // 打印备注
          printer
            .text('--------------------------------')
            .text('备注:')
            .text(order.remark || '无')
            .text('--------------------------------');
          
          // 打印时间
          const dateStr = new Date(order.created_at).toLocaleString('zh-CN');
          printer.text(`时间: ${dateStr}`);
          
          // 执行切纸并关闭连接
          printer
            .cut()
            .close();
          
          log('info', '✅ ESC/POS打印成功');
          resolve();
        } catch (error) {
          reject(new Error(`打印执行失败: ${error.message}`));
        }
      });
    });
  } catch (error) {
    log('error', `❌ ESC/POS打印失败: ${error.message}`);
    // 失败后尝试TXT格式
    await printWithTxt(order, printContent);
  }
}

// 使用TXT格式打印
async function printWithTxt(order, printContent) {
  try {
    log('info', '尝试使用TXT格式打印');
    
    // 创建临时TXT文件
    const tempFilePath = path.join(__dirname, `order_${order.order_no}.txt`);
    fs.writeFileSync(tempFilePath, printContent);
    log('info', `临时TXT文件创建成功: ${tempFilePath}`);
    
    // 使用notepad命令打印
    const { exec } = require('child_process');
    const printCommand = `notepad /p "${tempFilePath}"`;
    
    return new Promise((resolve, reject) => {
      exec(printCommand, (error, stdout, stderr) => {
        if (error) {
          log('error', `❌ 命令行打印失败: ${error.message}`);
          reject(new Error(`命令行打印失败: ${error.message}`));
        } else {
          log('info', '✅ TXT打印成功');
          resolve();
        }
        
        // 清理临时文件
        try {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
            log('info', '临时打印文件已删除');
          }
        } catch (error) {
          log('warn', `临时文件清理失败: ${error.message}`);
        }
      });
    });
  } catch (error) {
    log('error', `❌ TXT打印失败: ${error.message}`);
    throw error;
  }
}

// 错误处理
process.on('uncaughtException', (error) => {
  log('error', `❌ 未捕获的异常: ${error.message}`);
  log('error', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  log('error', `❌ 未处理的Promise拒绝: ${reason?.message || reason}`);
});

// 启动消息
log('info', '🚀 打印客户端启动成功');
log('info', `服务器地址: ${config.serverUrl}`);
log('info', `WebSocket连接URL: ${config.serverUrl}/order`);
log('info', `打印机类型: ${config.printerType}`);
if (config.printerType === 'escpos') {
  log('info', `ESC/POS连接类型: ${config.escpos.type}`);
  if (config.escpos.type === 'network') {
    log('info', `网络打印机地址: ${config.escpos.network.host}:${config.escpos.network.port}`);
  }
}
log('info', `日志级别: ${config.log?.level || config.logLevel}`);
log('info', `连接传输方式: ['websocket', 'polling']`);
log('info', `重连设置: ${config.reconnection?.attempts || 'infinity'}次尝试, ${config.reconnection?.delay || 1000}ms延迟`);
log('info', `超时设置: 10000ms`);
log('info', `初始连接状态: ${socket.connected}`);

// 主动检查连接状态
setInterval(() => {
  log('debug', `连接状态检查: ${socket.connected}`);
  log('debug', `Socket ID: ${socket.id}`);
  log('debug', `Socket状态: ${socket.connected ? '已连接' : '未连接'}`);
}, config.heartbeat.interval || 5000);

log('info', '等待打印任务...');
