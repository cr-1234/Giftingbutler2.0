$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root "mobile-web"

if (Test-Path $out) {
  Remove-Item -LiteralPath $out -Recurse -Force
}

New-Item -ItemType Directory -Path $out | Out-Null

$files = @(
  "index.html",
  "admin.html",
  "manifest.json",
  "favicon.svg",
  "og-image.svg",
  "robots.txt",
  "sitemap.xml"
)

foreach ($file in $files) {
  $source = Join-Path $root $file
  if (Test-Path $source) {
    Copy-Item -LiteralPath $source -Destination (Join-Path $out $file)
  }
}

$iconSource = Join-Path $root "icons"
if (Test-Path $iconSource) {
  Copy-Item -LiteralPath $iconSource -Destination (Join-Path $out "icons") -Recurse
}

Write-Host "Prepared mobile web assets in $out"
