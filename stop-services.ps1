Write-Host "Stopping Pathways services..." -ForegroundColor Yellow

if (Test-Path .pids.txt) {
    $Pids = Get-Content .pids.txt
    foreach ($ProcId in $Pids) {
        if ($ProcId -and (Get-Process -Id $ProcId -ErrorAction SilentlyContinue)) {
            Write-Host "Stopping process ID $ProcId..."
            Stop-Process -Id $ProcId -Force
        }
    }
    Remove-Item .pids.txt
    Write-Host "All Pathways processes stopped successfully." -ForegroundColor Green
} else {
    Write-Host "No active Pathways service PIDs found in .pids.txt. Attempting generic cleanup..." -ForegroundColor Yellow
    # Generic cleanup fallback if PID file is missing
    Get-Process -Name java -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Pathways*" } | Stop-Process -Force
    Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*vite*" } | Stop-Process -Force
    Write-Host "Generic cleanup complete." -ForegroundColor Green
}
