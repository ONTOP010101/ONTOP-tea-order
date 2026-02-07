' 打印客户端后台运行脚本
' 实现无窗口运行Node.js脚本，增强权限处理

Option Explicit

Dim objShell, strScriptDir, strNodeCommand, objFSO

' 创建Shell对象
Set objShell = CreateObject("WScript.Shell")

' 创建文件系统对象
Set objFSO = CreateObject("Scripting.FileSystemObject")

' 获取当前脚本目录
strScriptDir = Left(WScript.ScriptFullName, Len(WScript.ScriptFullName) - Len(WScript.ScriptName))

' 确保路径以反斜杠结尾
If Right(strScriptDir, 1) <> "\" Then
    strScriptDir = strScriptDir & "\"
End If

' 构建Node.js命令
strNodeCommand = "node """ & strScriptDir & "print-client.js"""

' 输出调试信息到日志文件
Dim debugLogPath
debugLogPath = strScriptDir & "logs\debug.log"

' 确保日志目录存在
Dim logsDir
logsDir = strScriptDir & "logs"
If Not objFSO.FolderExists(logsDir) Then
    objFSO.CreateFolder(logsDir)
End If

' 写入调试信息
Dim objLogFile
Set objLogFile = objFSO.CreateTextFile(debugLogPath, True)
objLogFile.WriteLine "[" & Now() & "] 启动VBScript脚本"
objLogFile.WriteLine "[" & Now() & "] 当前脚本目录: " & strScriptDir
objLogFile.WriteLine "[" & Now() & "] 执行命令: " & strNodeCommand
objLogFile.WriteLine "[" & Now() & "] 开始执行Node.js脚本..."
objLogFile.Close

' 增强的无窗口执行
' 使用ShellExecute方法以更可靠的方式执行
' 0 - 隐藏窗口
' True - 等待执行完成
On Error Resume Next

' 尝试使用ShellExecute方法
objShell.ShellExecute "node", strScriptDir & "print-client.js", strScriptDir, "open", 0

If Err.Number <> 0 Then
    ' 出错时回退到Run方法
    Set objLogFile = objFSO.OpenTextFile(debugLogPath, 8, True)
    objLogFile.WriteLine "[" & Now() & "] ShellExecute失败，使用Run方法: " & Err.Description
    objLogFile.Close
    objShell.Run strNodeCommand, 0, False
End If

On Error GoTo 0

' 写入执行完成信息
Set objLogFile = objFSO.OpenTextFile(debugLogPath, 8, True)
objLogFile.WriteLine "[" & Now() & "] 执行命令已发送"
objLogFile.WriteLine "[" & Now() & "] 打印客户端应在后台运行"
objLogFile.Close

' 释放对象
Set objLogFile = Nothing
Set objFSO = Nothing
Set objShell = Nothing

' 脚本结束
WScript.Quit 0
