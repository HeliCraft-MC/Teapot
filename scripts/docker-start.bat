@echo off
setlocal

REM Change to the project root directory (parent of the script directory)
pushd "%~dp0.."

REM Get the current git commit hash
for /f "delims=" %%i in ('git rev-parse --short HEAD') do set COMMIT_HASH=%%i
if "%COMMIT_HASH%"=="" set COMMIT_HASH=unknown

echo Building Docker image with commit %COMMIT_HASH%...
docker build --build-arg NODE_COMMIT_TEAPOT=%COMMIT_HASH% -t hc-teapot .

REM Create necessary directories if they don't exist
if not exist "public\uploads" mkdir "public\uploads"
if not exist "data" mkdir "data"

REM Check if .env exists
if not exist ".env" (
    echo Warning: .env file not found. Creating from .env.example...
    copy .env.example .env
)

echo Running container...
docker stop hc-teapot >nul 2>&1
docker rm hc-teapot >nul 2>&1

docker run -d ^
  --name hc-teapot ^
  --restart unless-stopped ^
  -p 3000:3000 ^
  --env-file .env ^
  -v "%cd%\public\uploads:/app/public/uploads" ^
  -v "%cd%\data:/app/data" ^
  hc-teapot

echo Container started.
popd
endlocal