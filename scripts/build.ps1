Write-Host "Building Lychee Desktop..."
wails build -clean
if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful! Binary in build/bin/"
    Get-Item build/bin/lychee-desktop.exe | Select-Object Name, Length
} else {
    Write-Host "Build failed. Check errors above."
}
