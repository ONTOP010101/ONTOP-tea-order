' 打印客户端后台运行脚本（简化版）
' 实现无窗口运行Node.js脚本

Option Explicit

Dim objShell, strScriptDir, strCommand

' 创建Shell对象
Set objShell = CreateObject("WScript.Shell")

' 获取当前脚本目录
strScriptDir = Left(WScript.ScriptFullName, Len(WScript.ScriptFullName) - Len(WScript.ScriptName))

' 构建运行命令
strCommand = "node """ & strScriptDir & "print-client.js"""

' 执行命令，隐藏窗口
' 0 - 隐藏窗口
' False - 异步执行
objShell.Run strCommand, 0, False

' 释放对象
Set objShell = Nothing

' 脚本结束
WScript.Quit 0