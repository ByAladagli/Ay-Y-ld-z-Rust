@echo off
title AY YILDIZ GITHUB YUKLEYICI
color 0a
cls
echo.
echo ==========================================
echo   AY YILDIZ RUST - OTOMATIK YUKLEYICI
echo ==========================================
echo.
cd /d "%~dp0"

echo [1/4] Git hazirlaniyor...
if not exist .git (
    git init
) 

echo [2/4] Dosyalar paketleniyor...
git add .
git commit -m "Otomatik Guncelleme Agent Tarafindan" >nul 2>&1

echo [3/4] Uzak sunucu ayarlaniyor...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/ByAladagli/Ay-Y-ld-z-Rust.git

echo.
echo [4/4] GITHUB'A YUKLENIYOR...
echo Lutfen acilan pencerede GitHub hesabiniza giris yapin.
echo.
git branch -M main
git push -u origin main --force

if %errorlevel% == 0 (
    color 0b
    echo.
    echo   ISLEM TAMAMLANDI!
    echo   Web siteniz guncellendi.
) else (
    color 0c
    echo.
    echo   HATA OLUSTU! Lutfen interneti veya giris bilgilerini kontrol edin.
)
echo.
pause
