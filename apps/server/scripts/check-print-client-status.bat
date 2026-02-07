@echo off

:: 打印客户端状态检查脚本
:: 用于检查打印客户端的运行状态和依赖情况

echo ====================================
echo       打印客户端状态检查
 echo ====================================
echo.

:: 检查当前目录
set "SCRIPT_DIR=%~dp0"
echo 检查目录: %SCRIPT_DIR%
echo.

:: 检查必要文件
echo 1. 检查必要文件:
echo ------------------------------------
if exist "%SCRIPT_DIR%print-client.js" (
    echo ✅ print-client.js 存在
) else (
    echo ❌ print-client.js 不存在
)

if exist "%SCRIPT_DIR%run-print-client.vbs" (
    echo ✅ run-print-client.vbs 存在
) else (
    echo ❌ run-print-client.vbs 不存在
)

if exist "%SCRIPT_DIR%start-print-client.bat" (
    echo ✅ start-print-client.bat 存在
) else (
    echo ❌ start-print-client.bat 不存在
)

if exist "%SCRIPT_DIR%print-client-config.json" (
    echo ✅ print-client-config.json 存在
) else (
    echo ⚠️  print-client-config.json 不存在，将使用默认配置
)
echo.

:: 检查Node.js
echo 2. 检查Node.js依赖:
echo ------------------------------------
where node > nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Node.js 已安装
    node --version
) else (
    echo ❌ Node.js 未安装
    echo    请下载并安装: https://nodejs.org/
)
echo.

:: 检查依赖包
echo 3. 检查依赖包:
echo ------------------------------------
if exist "%SCRIPT_DIR%node_modules" (
    echo ✅ node_modules 目录存在
    if exist "%SCRIPT_DIR%node_modules\socket.io-client" (
        echo ✅ socket.io-client 已安装
    ) else (
        echo ❌ socket.io-client 未安装
        echo    请运行: npm install
    )
) else (
    echo ❌ node_modules 目录不存在
    echo    请运行: npm install
)
echo.

:: 检查自启动配置
echo 4. 检查自启动配置:
echo ------------------------------------
reg query "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" /v "PrintClient" > nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ 当前用户自启动已配置
    for /f "tokens=3*" %%a in ('reg query "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" /v "PrintClient"') do (
        echo    路径: %%a %%b
    )
) else (
    echo ❌ 当前用户自启动未配置
)

reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "PrintClient" > nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ 系统全局自启动已配置
    for /f "tokens=3*" %%a in ('reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "PrintClient"') do (
        echo    路径: %%a %%b
    )
) else (
    echo ❌ 系统全局自启动未配置
)
echo.

:: 检查运行状态
echo 5. 检查运行状态:
echo ------------------------------------
tasklist | findstr "node.exe" > nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Node.js 进程正在运行
    tasklist | findstr "node.exe"
) else (
    echo ⚠️  未发现 Node.js 进程
    echo    打印客户端可能未启动
)
echo.

:: 检查日志文件
echo 6. 检查日志文件:
echo ------------------------------------
if exist "%SCRIPT_DIR%logs" (
    echo ✅ 日志目录存在
    dir "%SCRIPT_DIR%logs" /b
) else (
    echo ⚠️  日志目录不存在
)
echo.

:: 检查网络连接
echo 7. 检查网络连接:
echo ------------------------------------
ping localhost -n 2 > nul
if %errorlevel% equ 0 (
    echo ✅ 本地网络连接正常
) else (
    echo ❌ 本地网络连接异常
)
echo.

:: 显示操作提示
echo ====================================
echo       操作提示
 echo ====================================
echo 1. 配置自启动:
echo    运行 create-startup-reg.bat 生成配置文件
echo    然后双击生成的 add-startup.reg 文件
echo.
echo 2. 启动客户端:
echo    双击 start-print-client.bat 文件
echo    或运行: %SCRIPT_DIR%start-print-client.bat
echo.
echo 3. 停止客户端:
echo    在任务管理器中结束 node.exe 进程
echo.
echo 4. 查看日志:
echo    日志文件位于: %SCRIPT_DIR%logs\
echo ====================================
echo       检查完成
 echo ====================================

:: 等待用户输入
pause