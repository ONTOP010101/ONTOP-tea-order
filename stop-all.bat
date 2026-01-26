@echo off
chcp 65001 >nul

echo 正在停止所有服务...

REM 查找并杀死占用3003端口的进程
echo 正在关闭后端服务器（端口3003）...
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :3003') do taskkill /pid %%i /f >nul 2>&1

REM 查找并杀死占用5174端口的进程
echo 正在关闭前端H5客户端（端口5174）...
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5174') do taskkill /pid %%i /f >nul 2>&1

REM 查找并杀死占用3005端口的进程
echo 正在关闭管理后台（端口3005）...
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :3005') do taskkill /pid %%i /f >nul 2>&1

REM 查找并杀死与Node.js相关的进程
echo 正在清理残留的Node.js进程...
taskkill /f /im node.exe >nul 2>&1

echo 所有服务已停止完毕！
echo 按任意键关闭此窗口...
pause >nul
