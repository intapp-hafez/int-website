@echo off
echo ============================================
echo   Building Integrated Technics Website
echo ============================================
echo Running production build...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed!
    exit /b %errorlevel%
)
echo Compressing dist directory to build.zip...
powershell -NoProfile -Command "Compress-Archive -Path dist\* -DestinationPath build.zip -Force"
echo [SUCCESS] Build and package complete: build.zip

