@echo off
chcp 65001 >nul
set "NODE_DIR=C:\Program Files\nodejs"
set "NODE=%NODE_DIR%\node.exe"
set "NPM=%NODE_DIR%\npm.cmd"

if not exist "%NODE%" (
    echo 错误: 找不到Node.js, 请检查安装路径
    pause
    exit /b 1
)

echo 使用Node.js: %NODE%
echo 使用npm: %NPM%

cd /d "%~dp0"
echo 当前目录: %cd%

REM 启动后端服务器
echo 正在启动后端服务器...
start "Backend Server" cmd /k "cd apps\server && %NPM% run start:dev"

REM 等待后端服务器启动
echo 等待后端服务器启动...
timeout /t 5 /nobreak >nul

REM 启动前端H5客户端
echo 正在启动前端H5客户端...
start "H5 Client" cmd /k "cd apps\h5-client && %NODE% "%NODE_DIR%\node_modules\vite\bin\vite.js" --host 0.0.0.0 --port 5174"

REM 等待前端H5客户端启动
echo 等待前端H5客户端启动...
timeout /t 3 /nobreak >nul

REM 启动管理后台
echo 正在启动管理后台...
start "Admin Panel" cmd /k "cd apps\admin-panel && %NODE% "%NODE_DIR%\node_modules\vite\bin\vite.js" --host 0.0.0.0 --port 3005"

echo 所有服务已启动完毕！
echo 后端服务器: http://localhost:3003
echo 前端H5客户端: http://localhost:5174
echo 管理后台: http://localhost:3005
echo 按任意键关闭此窗口...
pause >nul
