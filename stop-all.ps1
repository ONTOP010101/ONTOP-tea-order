Write-Host "Stopping all services..." -ForegroundColor Yellow

# Find and kill processes using port 3003
Write-Host "Stopping backend server (port 3003)..." -ForegroundColor Yellow
$processes3003 = netstat -ano | Select-String ":3003" | ForEach-Object { $_.Line.Split()[-1] }
foreach ($processId in $processes3003) {
    if ($processId -match '\d+') {
        try {
            Stop-Process -Id $processId -Force
        } catch {
            # Ignore terminated processes
        }
    }
}

# Find and kill processes using port 5174
Write-Host "Stopping H5 client (port 5174)..." -ForegroundColor Yellow
$processes5174 = netstat -ano | Select-String ":5174" | ForEach-Object { $_.Line.Split()[-1] }
foreach ($processId in $processes5174) {
    if ($processId -match '\d+') {
        try {
            Stop-Process -Id $processId -Force
        } catch {
            # Ignore terminated processes
        }
    }
}

# Find and kill processes using port 3005
Write-Host "Stopping admin panel (port 3005)..." -ForegroundColor Yellow
$processes3005 = netstat -ano | Select-String ":3005" | ForEach-Object { $_.Line.Split()[-1] }
foreach ($processId in $processes3005) {
    if ($processId -match '\d+') {
        try {
            Stop-Process -Id $processId -Force
        } catch {
            # Ignore terminated processes
        }
    }
}

# Kill all Node.js processes
Write-Host "Cleaning up Node.js processes..." -ForegroundColor Yellow
try {
    Stop-Process -Name "node" -Force
} catch {
    # Ignore errors if no node processes are running
}

Write-Host "All services stopped!" -ForegroundColor Green
