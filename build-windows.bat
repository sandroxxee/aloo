@echo off
echo =======================================================
echo    ASSET INTELLIGENCE - GERADOR DE INSTALADOR WINDOWS
echo =======================================================
echo.
echo [1/3] Instalando dependencias do projeto...
call npm install
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Compilando frontend Vite e servidor Node.js...
call npm run build
if %errorlevel% neq 0 (
    echo [ERRO] Falha na compilacao do aplicativo.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] Gerando Instalador Windows EXE (Electron Builder)...
call npx electron-builder --win nsis portable
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao gerar instalador Electron para Windows.
    pause
    exit /b %errorlevel%
)

echo.
echo =======================================================
echo    INSTALADOR CRIADO COM SUCESSO!
echo    Verifique a pasta "release\" no seu computador:
echo    - Asset Intelligence Setup 1.0.0.exe (Instalador)
echo    - Asset Intelligence 1.0.0.exe (Portavel)
echo =======================================================
echo.
pause
