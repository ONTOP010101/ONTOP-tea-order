@echo off
chcp 65001 > nul

:: 打印客户端自启动配置生成脚本
:: 此脚本会自动获取当前路径并生成正确的注册表文件

echo ====================================
echo       自启动配置生成脚本
 echo ====================================
echo.
echo 正在生成自启动配置...
echo.

:: 获取当前脚本所在目录
set "SCRIPT_DIR=%~dp0"
echo 当前脚本目录: %SCRIPT_DIR%

:: 生成注册表文件路径
set "REG_FILE=%SCRIPT_DIR%add-startup.reg"
echo 注册表文件路径: %REG_FILE%
echo.

:: 使用echo命令逐行写入注册表文件
echo Windows Registry Editor Version 5.00 > "%REG_FILE%"
echo. >> "%REG_FILE%"
echo [HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run] >> "%REG_FILE%"
echo "PrintClient"="%SCRIPT_DIR%start-print-client.bat" >> "%REG_FILE%"
echo. >> "%REG_FILE%"
echo [HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Run] >> "%REG_FILE%"
echo "PrintClient"="%SCRIPT_DIR%start-print-client.bat" >> "%REG_FILE%"
echo. >> "%REG_FILE%"
echo REM ==================================== >> "%REG_FILE%"
echo REM       开机自启注册表脚本 >> "%REG_FILE%"
echo REM ==================================== >> "%REG_FILE%"
echo REM 双击此文件添加打印客户端到开机自启 >> "%REG_FILE%"
echo REM >> "%REG_FILE%"
echo REM 注意： >> "%REG_FILE%"
echo REM 1. 此脚本会添加两个启动项： >> "%REG_FILE%"
echo REM    - 当前用户启动项 >> "%REG_FILE%"
echo REM    - 系统全局启动项 >> "%REG_FILE%"
echo REM 2. 路径已自动配置，无需手动修改 >> "%REG_FILE%"
echo REM 3. 执行后会弹出确认对话框 >> "%REG_FILE%"
echo REM ==================================== >> "%REG_FILE%"

:: 检查文件是否生成成功
if exist "%REG_FILE%" (
    echo 注册表文件生成成功: %REG_FILE%
    echo.
    
    :: 显示生成的内容
    echo 生成的注册表内容:
    echo ------------------------------------
    type "%REG_FILE%"
    echo ------------------------------------
    echo.
    
    :: 提示用户
    echo ====================================
    echo 操作完成!
    echo ====================================
    echo 请双击生成的 %REG_FILE% 文件来配置自启动
    echo 配置完成后，打印客户端将在开机时自动启动
    echo 并在后台无窗口运行
    echo.
    echo ====================================
    echo       生成完成
     echo ====================================
) else (
    echo 错误: 注册表文件生成失败
    echo 请检查权限和路径是否正确
)

:: 等待5秒后自动关闭窗口
echo 窗口将在5秒后自动关闭...
ping localhost -n 6 > nul
exit