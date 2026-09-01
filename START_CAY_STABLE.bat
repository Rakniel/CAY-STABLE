@echo off
cd /d "%~dp0"
echo.
echo ==============================================
echo   CAY-STABLE - TEST CLUB 0.2
echo ==============================================
echo.
echo Le navigateur va s'ouvrir automatiquement.
echo Laisse cette fenetre ouverte pendant le test.
echo Pour arreter le serveur : CTRL+C
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve_cay_stable.ps1"
pause
