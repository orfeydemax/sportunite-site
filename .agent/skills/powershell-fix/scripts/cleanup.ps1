Write-Host "🧹 Starting Antigravity Terminal Cleanup..." -ForegroundColor Cyan

# Define processes to inspect
$targets = @("node", "conhost")

foreach ($procName in $targets) {
    $list = Get-Process -Name $procName -ErrorAction SilentlyContinue
    if ($list) {
        Write-Host "Found $($list.Count) instances of $procName." -ForegroundColor Yellow
        # In a real environment, we might want to filter by start time or parent.
        # For now, as per user request to "Kill All", we do so.
        $list | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "Killed $procName." -ForegroundColor Green
    }
}

# PowerShell itself - tricky because WE are running in it.
# We kill all *other* powershells.
$currentPid = $PID
$shells = Get-Process -Name "powershell" -ErrorAction SilentlyContinue | Where-Object { $_.Id -ne $currentPid }

if ($shells) {
    Write-Host "Found $($shells.Count) other PowerShell processes. Killing..." -ForegroundColor Red
    $shells | Stop-Process -Force -ErrorAction SilentlyContinue
}

Write-Host "✅ Cleanup Complete. You can now run your command." -ForegroundColor Green
