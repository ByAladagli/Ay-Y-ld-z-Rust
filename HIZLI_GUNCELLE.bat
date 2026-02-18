@echo off
title AY YILDIZ GITHUB PUSH
color 0b
cls
echo.
echo ==========================================
echo   AY YILDIZ - GITHUB'A YUKLEME ARACI
echo ==========================================
echo.
echo  Giris yapmaniz gerekirse lutfen acilan pencerede yapin.
echo.

cd /d "%~dp0"
git add .
git commit -m "SEO ve Site Haritasi Guncellemesi"
git remote remove origin >nul 2>&1
git remote add origin https://github.com/ByAladagli/Ay-Y-ld-z-Rust.git
git branch -M main
git push -u origin main

if %errorlevel% == 0 (
    color 0a
    echo.
    echo   [OK] BASARIYLA YUKLENDI!
) else (
    color 0c
    echo.
    echo   [HATA] Yukleme basarisiz oldu. Internet veya sifre hatasi.
)
echo.
pause
