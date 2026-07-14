# =========================================================
#  run-tests.ps1
#  Lance tests backend (PHPUnit) + frontend (Jest),
#  regenere le rapport Excel, et tente de l'actualiser
#  automatiquement s'il est deja ouvert.
#
#  A placer a la racine du projet :
#  C:\Users\User\Desktop\stage20252026\run-tests.ps1
# =========================================================

# --- Configuration : ajustez si votre dossier a un autre nom ---
$root = $PSScriptRoot   # dossier ou se trouve ce script
$excelFileName = "rapport-tests.xlsx"

function Write-Step($num, $total, $title) {
    Write-Host ""
    Write-Host "===================================" -ForegroundColor Cyan
    Write-Host " $num/$total - $title" -ForegroundColor Cyan
    Write-Host "===================================" -ForegroundColor Cyan
}

# --- 1/3 : Tests Backend (PHPUnit) ---
Write-Step 1 3 "Tests Backend (PHPUnit)"
Set-Location "$root\server"
php artisan test
if ($LASTEXITCODE -ne 0) {
    Write-Host "Des tests backend ont echoue (voir ci-dessus)." -ForegroundColor Yellow
}

# --- 2/3 : Tests Frontend (Jest) ---
Write-Step 2 3 "Tests Frontend (Jest)"
Set-Location "$root\client"
npx jest
if ($LASTEXITCODE -ne 0) {
    Write-Host "Des tests frontend ont echoue (voir ci-dessus)." -ForegroundColor Yellow
}

# --- 3/3 : Generation du rapport Excel/CSV ---
Write-Step 3 3 "Generation du rapport Excel"
node "$root\generate-excel-report.js"

# --- Bonus : actualisation automatique d'Excel si deja ouvert ---
Write-Host ""
Write-Host "Tentative d'actualisation automatique d'Excel..." -ForegroundColor Yellow
try {
    $excel = [Runtime.InteropServices.Marshal]::GetActiveObject("Excel.Application")
    $refreshed = $false
    foreach ($wb in $excel.Workbooks) {
        if ($wb.Name -eq $excelFileName) {
            $wb.RefreshAll()
            Start-Sleep -Seconds 2   # laisse le temps a Power Query de finir
            $wb.Save()
            $refreshed = $true
        }
    }
    if ($refreshed) {
        Write-Host "Excel actualise et enregistre automatiquement !" -ForegroundColor Green
    } else {
        Write-Host "Excel est ouvert mais '$excelFileName' n'est pas parmi les classeurs ouverts." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Excel n'est pas ouvert. Ouvrez '$excelFileName' et cliquez sur 'Actualiser tout' si besoin." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Termine !" -ForegroundColor Green
Set-Location $root
