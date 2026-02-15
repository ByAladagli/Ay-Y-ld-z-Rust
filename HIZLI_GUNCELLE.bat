@echo off
title AY YILDIZ SITE GUNCELLEME ARACI
color 0a
cls

echo ========================================================
echo   AY YILDIZ RUST - SITE GUNCELLEME ARACI
echo ========================================================
echo.
echo  1. Dosyalar Git'e ekleniyor...
git init
git add .
git commit -m "Site ve Launcher Guncellemesi (v2.1)"

echo.
echo  2. Uzak sunucu (GitHub) baglantisi kontrol ediliyor...
git remote remove origin
git remote add origin https://github.com/ByAladagli/Ay-Y-ld-z-Rust.git

echo.
echo  3. Dosyalar YUKLENIYOR...
echo  (Giris penceresi acilirsa bilgilerinizi girin)
echo.
git branch -M main
git push -u origin main --force

echo.
echo ========================================================
if %errorlevel% == 0 (
    echo   ISLEM BASARILI!
    echo   Site 1-2 dakika icinde guncellenecektir.
    echo   (Hem GitHub Pages hem Netlify guncellenir)
) else (
    echo   HATA! Yukleme yapilamadi. Internetinizi kontrol edin.
)
echo ========================================================
echo.
pause
