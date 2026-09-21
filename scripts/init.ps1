$ErrorActionPreference = "Stop"

$installerUrl = "https://raw.githubusercontent.com/DeusData/codebase-memory-mcp/main/install.ps1"
$installerPath = Join-Path $env:TEMP "codebase-memory-mcp-install.ps1"
Invoke-RestMethod -Uri $installerUrl | Set-Content -Path $installerPath
& powershell -ExecutionPolicy Bypass -File $installerPath --skip-config --dir=~/.local/bin
if ($LASTEXITCODE -ne 0) {
    throw "Failed to install codebase-memory-mcp"
}

$packages = @(
    "npm:@dietrichgebert/ponytail",
    "npm:pi-mcp-adapter",
    "npm:pi-subagents",
    "npm:pi-web-access",
    "npm:pi-cbm",
    "npm:pi-lmstudio"
)

foreach ($package in $packages) {
    & pi install $package
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install $package"
    }
}
