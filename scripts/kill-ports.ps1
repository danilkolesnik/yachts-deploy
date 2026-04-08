$ErrorActionPreference = "Stop"

$ports = @(3000, 5000)

function Get-ListeningPidsForPort([int]$Port) {
  $lines = netstat -ano | Select-String "LISTENING" | Select-String ":$Port\s"
  if (-not $lines) { return @() }

  $pids = @()
  foreach ($line in $lines) {
    $tokens = ($line.ToString().Trim() -split "\s+")
    if ($tokens.Length -ge 5) {
      $owningPid = $tokens[-1]
      if ($owningPid -match "^\d+$") { $pids += [int]$owningPid }
    }
  }
  return $pids | Select-Object -Unique
}

foreach ($port in $ports) {
  $pids = Get-ListeningPidsForPort -Port $port
  if (-not $pids -or $pids.Count -eq 0) {
    Write-Host "Port ${port}: free"
    continue
  }

  foreach ($owningPid in $pids) {
    try {
      $proc = Get-Process -Id $owningPid -ErrorAction Stop
      Write-Host "Port ${port}: stopping PID $owningPid ($($proc.ProcessName))"
    } catch {
      Write-Host "Port ${port}: stopping PID $owningPid"
    }

    Stop-Process -Id $owningPid -Force -ErrorAction SilentlyContinue
  }
}

Start-Sleep -Milliseconds 300

foreach ($port in $ports) {
  $still = Get-ListeningPidsForPort -Port $port
  if ($still -and $still.Count -gt 0) {
    throw "Port $port is still in use by PID(s): $($still -join ', ')"
  }
}

Write-Host "Done. Ports 3000 and 5000 are free."

