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
echo 当前脚本目录: %SCRIPT_DIR%

:: 检查必要文件是否存在
if not exist "%SCRIPT_DIR%run-print-client.vbs" (
    echo 错误: 找不到 run-print-client.vbs 文件
echo 请确保脚本文件在正确的位置
echo. 
goto ERROR
)

if not exist "%SCRIPT_DIR%print-client.js" (
    echo 错误: 找不到 print-client.js 文件
echo 请确保脚本文件在正确的位置
echo. 
goto ERROR
)

:: 检查Node.js是否安装
where node > nul 2>nul
if %errorlevel% neq 0 (
    echo 错误: 未找到Node.js
    echo 请先安装Node.js才能运行打印客户端
echo 下载地址: https://nodejs.org/
echo. 
goto ERROR
)

:: 显示Node.js版本
node --version
echo. 

:: 创建日志目录
if not exist "%SCRIPT_DIR%logs" (
    mkdir "%SCRIPT_DIR%logs"
    echo 创建日志目录: %SCRIPT_DIR%logs
echo. 
)

:: 调用VBScript文件实现无窗口运行
echo 正在执行后台启动...
cscript //nologo "%SCRIPT_DIR%run-print-client-simple.vbs"

if %errorlevel% neq 0 (
    echo 错误: VBScript执行失败
echo 请检查错误信息并尝试手动运行
echo. 
goto ERROR
)

echo 启动命令已发送，请查看日志文件确认运行状态
echo 客户端日志: %SCRIPT_DIR%logs\print-client.log
echo VBScript日志: %SCRIPT_DIR%logs\debug.log
echo.
echo ====================================
echo       启动完成
 echo ====================================
echo 打印客户端已在后台无窗口运行
echo. 

:: 等待2秒后自动关闭窗口
echo 窗口将在2秒后自动关闭...
ping localhost -n 3 > nul
goto END

:ERROR
echo ====================================
echo       启动失败
 echo ====================================
echo 请检查以上错误信息并解决问题后重试
echo. 
echo 按任意键退出...
pause > nul

:END
exit
