@echo off

:: 打印客户端启动脚本
:: 双击此文件启动打印客户端，会在后台无窗口运行

echo ====================================
echo       打印客户端启动脚本
 echo ====================================
echo. 
echo 正在启动打印客户端...
echo 服务将在后台运行，无需保持窗口打开
echo. 

:: 检查当前目录
set "SCRIPT_DIR=%~dp0"
echo 当前目录: %SCRIPT_DIR%

:: 调用VBScript文件实现无窗口运行
cscript "%SCRIPT_DIR%run-print-client.vbs"

echo 启动命令已发送，请查看日志文件确认运行状态
echo 日志文件: %SCRIPT_DIR%logs\print-client.log
echo.
echo ====================================
echo       启动完成
 echo ====================================

:: 等待2秒后自动关闭窗口
ping localhost -n 3 > nul
exit
