Write-Host "Starting Pathways Backend and Frontend in a persistent background session..." -ForegroundColor Green

# Create logs directory
if (!(Test-Path logs)) {
    New-Item -ItemType Directory -Path logs | Out-Null
}

# Create file to track PIDs
$Pids = @()

# Start user-service
Write-Host "Starting User Service (Port 8081)..."
$UserJob = Start-Process java -ArgumentList "-jar", "user-service/target/user-service-1.0.0.jar" -RedirectStandardOutput "logs/user-service.log" -RedirectStandardError "logs/user-service-error.log" -PassThru -NoNewWindow
$Pids += $UserJob.Id

# Start path-service
Write-Host "Starting Path Service (Port 8082)..."
$PathJob = Start-Process java -ArgumentList "-jar", "path-service/target/path-service-1.0.0.jar" -RedirectStandardOutput "logs/path-service.log" -RedirectStandardError "logs/path-service-error.log" -PassThru -NoNewWindow
$Pids += $PathJob.Id

# Start chat-service
Write-Host "Starting Chat Service (Port 8083)..."
$ChatJob = Start-Process java -ArgumentList "-jar", "chat-service/target/chat-service-1.0.0.jar" -RedirectStandardOutput "logs/chat-service.log" -RedirectStandardError "logs/chat-service-error.log" -PassThru -NoNewWindow
$Pids += $ChatJob.Id

# Wait a few seconds for core services to start up before starting gateway
Start-Sleep -Seconds 8

# Start gateway-service
Write-Host "Starting Gateway Service (Port 8080)..."
$GatewayJob = Start-Process java -ArgumentList "-jar", "gateway-service/target/gateway-service-1.0.0.jar" -RedirectStandardOutput "logs/gateway-service.log" -RedirectStandardError "logs/gateway-service-error.log" -PassThru -NoNewWindow
$Pids += $GatewayJob.Id

# Start React Frontend
Write-Host "Starting React Frontend (Port 5173)..."
$FrontendJob = Start-Process npm.cmd -ArgumentList "run", "dev" -WorkingDirectory "frontend" -RedirectStandardOutput "logs/frontend.log" -RedirectStandardError "logs/frontend-error.log" -PassThru -NoNewWindow
$Pids += $FrontendJob.Id

# Save PIDs to file for cleanup
$Pids | Out-File -FilePath .pids.txt -Encoding utf8

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "All processes launched! Running persistent session..." -ForegroundColor Green
Write-Host "Gateway: http://localhost:9090"
Write-Host "Frontend: http://localhost:5173"
Write-Host "==========================================" -ForegroundColor Green

# Block forever to keep child processes alive
try {
    while ($true) {
        Start-Sleep -Seconds 5
    }
} finally {
    # Ensure cleanup on script termination
    Write-Host "Persistent session ending, cleaning up child processes..."
    foreach ($ProcId in $Pids) {
        if ($ProcId -and (Get-Process -Id $ProcId -ErrorAction SilentlyContinue)) {
            Stop-Process -Id $ProcId -Force
        }
    }
}
