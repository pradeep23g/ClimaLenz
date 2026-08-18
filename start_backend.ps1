# ClimaLenz Backend Launcher Script (PowerShell)
# Usage: .\start_backend.ps1

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "🚀 Launching ClimaLenz Backend Services via Python Runner..." -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan

$PythonExe = ".\venv\Scripts\python.exe"

if (-not (Test-Path $PythonExe)) {
    Write-Host "⚠️  Virtual environment python.exe not found at $PythonExe. Using system python." -ForegroundColor Yellow
    $PythonExe = "python"
}

& $PythonExe start_backend.py
