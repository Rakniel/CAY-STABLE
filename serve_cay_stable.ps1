$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8765
$prefix = "http://localhost:$port/"

function Get-ContentType([string]$path) {
  switch ([IO.Path]::GetExtension($path).ToLowerInvariant()) {
    '.html' { 'text/html; charset=utf-8'; break }
    '.js'   { 'application/javascript; charset=utf-8'; break }
    '.css'  { 'text/css; charset=utf-8'; break }
    '.json' { 'application/json; charset=utf-8'; break }
    '.svg'  { 'image/svg+xml'; break }
    '.png'  { 'image/png'; break }
    '.jpg'  { 'image/jpeg'; break }
    '.jpeg' { 'image/jpeg'; break }
    '.wasm' { 'application/wasm'; break }
    '.onnx' { 'application/octet-stream'; break }
    default { 'application/octet-stream' }
  }
}

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($prefix)
try {
  $listener.Start()
} catch {
  Write-Host "Impossible de demarrer le serveur local sur $prefix" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}

$url = $prefix + 'CAY_ANALYZER_STABLE.html'
Write-Host "CAY-STABLE TEST CLUB 0.2" -ForegroundColor Red
Write-Host "Serveur local actif : $url" -ForegroundColor Green
Write-Host "CTRL+C pour arreter." -ForegroundColor DarkGray
Start-Process $url

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $relative = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
    if ([string]::IsNullOrWhiteSpace($relative)) { $relative = 'CAY_ANALYZER_STABLE.html' }

    $candidate = [IO.Path]::GetFullPath((Join-Path $root $relative))
    $rootFull = [IO.Path]::GetFullPath($root + [IO.Path]::DirectorySeparatorChar)
    if (-not $candidate.StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase)) {
      $ctx.Response.StatusCode = 403
      $ctx.Response.Close()
      continue
    }

    if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
      $ctx.Response.StatusCode = 404
      $ctx.Response.Close()
      continue
    }

    try {
      $bytes = [IO.File]::ReadAllBytes($candidate)
      $ctx.Response.StatusCode = 200
      $ctx.Response.ContentType = Get-ContentType $candidate
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.Headers['Cache-Control'] = 'no-store'
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } catch {
      $ctx.Response.StatusCode = 500
    } finally {
      $ctx.Response.OutputStream.Close()
      $ctx.Response.Close()
    }
  }
} finally {
  if ($listener.IsListening) { $listener.Stop() }
  $listener.Close()
}
