' 打印客户端后台运行脚本
' 实现无窗口运行Node.js脚本

Option Explicit

Dim objShell, strScriptDir, strNodeCommand

' 创建Shell对象
Set objShell = CreateObject("WScript.Shell")

' 获取当前脚本目录
strScriptDir = Left(WScript.ScriptFullName, Len(WScript.ScriptFullName) - Len(WScript.ScriptName))

' 构建Node.js命令
strNodeCommand = "node """ & strScriptDir & "print-client.js"""

' 输出调试信息到临时文件（可选）
' Dim objFSO, objFile
' Set objFSO = CreateObject("Scripting.FileSystemObject")
' Set objFile = objFSO.CreateTextFile(strScriptDir & "debug.log", True)
' objFile.WriteLine "当前目录: " & strScriptDir
' objFile.WriteLine "执行命令: " & strNodeCommand
' objFile.Close

' 执行命令，设置窗口样式为隐藏
' 0 - 隐藏窗口
' True - 等待命令执行完成（False 表示异步执行）
objShell.Run strNodeCommand, 0, False

' 释放对象
Set objShell = Nothing

' 脚本结束
WScript.Quit 0
