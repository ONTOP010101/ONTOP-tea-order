@echo off

:: 简化版自启动配置生成脚本
:: 此脚本会自动获取当前路径并生成正确的注册表文件

echo 正在生成自启动配置...

:: 获取当前脚本所在目录
set "SCRIPT_DIR=%~dp0"

:: 生成注册表文件路径
set "REG_FILE=%SCRIPT_DIR%add-startup.reg"

:: 清空文件
break > "%REG_FILE%"

:: 写入注册表内容
echo Windows Registry Editor Version 5.00 >> "%REG_FILE%"
echo. >> "%REG_FILE%"
echo [HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run] >> "%REG_FILE%"
echo "PrintClient"="%SCRIPT_DIR%start-print-client.bat" >> "%REG_FILE%"
echo. >> "%REG_FILE%"
echo [HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Run] >> "%REG_FILE%"
echo "PrintClient"="%SCRIPT_DIR%start-print-client.bat" >> "%REG_FILE%"

:: 检查文件是否生成成功
if exist "%REG_FILE%" (
    echo 成功生成: %REG_FILE%
    echo.
    echo 请双击 %REG_FILE% 来配置自启动
) else (
    echo 生成失败，请检查权限
)

:: 等待3秒后关闭
echo 3秒后自动关闭...
ping -n 4 localhost > nul
exit