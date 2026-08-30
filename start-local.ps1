param(
  [int]$Port = 4173
)

$root = $PSScriptRoot
Write-Host "邀请函已启动：http://localhost:$Port"
Start-Process -WindowStyle Hidden -FilePath "python" -ArgumentList "-m", "http.server", "$Port", "--bind", "127.0.0.1" -WorkingDirectory $root
Start-Process "http://localhost:$Port"
