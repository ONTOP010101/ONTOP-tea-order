# Set Node.js and npm full paths
$NODE_DIR = "C:\Program Files\nodejs"
$NODE = "$NODE_DIR\node.exe"
$NPM = "$NODE_DIR\npm.cmd"

# Check if Node.js exists
if (-not (Test-Path $NODE)) {
    Write-Host "Error: Cannot find Node.js, please check the installation path" -ForegroundColor Red
    exit 1
}

Write-Host "Using Node.js: $NODE" -ForegroundColor Green
Write-Host "Using npm: $NPM" -ForegroundColor Green

# Set current directory to script location
Set-Location $PSScriptRoot
Write-Host "Current directory: $PWD" -ForegroundColor Green

# Start backend server
Write-Host "Starting backend server..." -ForegroundColor Yellow
# Create a batch file for backend server
$backendBat = Join-Path $PSScriptRoot "start-backend.bat"
@"
@echo off
cd apps\server
"$NODE" dist\main
"@ | Out-File -FilePath $backendBat -Encoding ASCII
# Start the batch file
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "$backendBat" -WindowStyle Normal -WorkingDirectory $PWD

# Wait for backend server to start
Write-Host "Waiting for backend server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Start H5 client
Write-Host "Starting H5 client..." -ForegroundColor Yellow
# Create a batch file for H5 client
$h5Bat = Join-Path $PSScriptRoot "start-h5.bat"
@"
@echo off
set NODE_PATH="$NODE_DIR"
set PATH="$NODE_DIR";%PATH%
cd apps\h5-client
"$NPM" run dev
"@ | Out-File -FilePath $h5Bat -Encoding ASCII
# Start the batch file
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "$h5Bat" -WindowStyle Normal -WorkingDirectory $PWD

# Wait for H5 client to start
Write-Host "Waiting for H5 client to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start admin panel
Write-Host "Starting admin panel..." -ForegroundColor Yellow
# Create a batch file for admin panel
$adminBat = Join-Path $PSScriptRoot "start-admin.bat"
@"
@echo off
set NODE_PATH="$NODE_DIR"
set PATH="$NODE_DIR";%PATH%
cd apps\admin-panel
"$NPM" run dev
"@ | Out-File -FilePath $adminBat -Encoding ASCII
# Start the batch file
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "$adminBat" -WindowStyle Normal -WorkingDirectory $PWD

# Clean up temporary batch files after a delay
Start-Sleep -Seconds 1
Remove-Item -Path $backendBat -Force
Remove-Item -Path $h5Bat -Force
Remove-Item -Path $adminBat -Force

Write-Host "All services started successfully!" -ForegroundColor Green
Write-Host "Backend server: http://localhost:3003" -ForegroundColor Cyan
Write-Host "H5 client: http://localhost:5174" -ForegroundColor Cyan
Write-Host "Admin panel: http://localhost:3005" -ForegroundColor Cyan
