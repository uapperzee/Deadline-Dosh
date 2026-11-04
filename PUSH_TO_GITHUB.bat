@echo off
title Push Deadline Dost to GitHub
cd /d "D:\deadline dost"
echo ========================================================
echo  Deadline Dost - GitHub Push
echo  Repository: https://github.com/ShreelPatel21/deadlinedost
echo ========================================================
echo.
echo Pushing to GitHub main branch...
git push -u origin main --force
echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo  SUCCESS! Pushed to GitHub successfully!
    echo ========================================================
) else (
    echo ========================================================
    echo  Push failed. Please sign in when prompted.
    echo ========================================================
)
echo.
pause
