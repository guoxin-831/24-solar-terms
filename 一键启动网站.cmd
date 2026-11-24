@echo off
chcp 936 >nul
setlocal EnableExtensions
title 二十四节气网站 · 本地服务

cd /d "%~dp0"

set "URL=http://localhost:8000/web/index.html?t=%RANDOM%%RANDOM%"
set "PORT=8000"

rem 1. 端口已在监听：直接打开浏览器
netstat -ano -p tcp | findstr "LISTENING" | findstr /C:":%PORT% " >nul 2>nul
if not errorlevel 1 (
    echo 检测到本地服务已在运行，直接打开浏览器……
    start "" "%URL%"
    goto :end
)

rem 2. 选择 Python：优先项目虚拟环境，其次系统 Python
set "PY=%~dp0.venv\Scripts\python.exe"
if not exist "%PY%" (
    where python >nul 2>nul
    if not errorlevel 1 (
        set "PY=python"
    ) else (
        echo [错误] 未找到 Python：既没有 .venv 虚拟环境，系统也没有 python 命令。
        echo 请先安装 Python 或重建虚拟环境后再试。
        pause
        exit /b 1
    )
)

rem 3. 新窗口最小化启动静态服务器
echo 正在启动本地服务，端口 %PORT% ……
start "二十四节气网站服务（关闭此窗口即停止）" /min "%PY%" -m http.server %PORT% --bind 127.0.0.1

rem 4. 轮询等待端口就绪（用 ping 计时，兼容性好），再打开浏览器
set /a TRIES=0
:waitloop
set /a TRIES+=1
ping -n 2 127.0.0.1 >nul
netstat -ano -p tcp | findstr "LISTENING" | findstr /C:":%PORT% " >nul 2>nul
if not errorlevel 1 goto :ready
if %TRIES% GEQ 10 (
    echo [错误] 服务启动超时，请检查 %PORT% 端口是否被占用。
    pause
    exit /b 1
)
goto :waitloop

:ready
echo 服务已启动：%URL%
start "" "%URL%"
echo.
echo 浏览器应已自动打开。停止服务：关闭任务栏上最小化的“二十四节气网站服务”窗口。

:end
echo 本窗口可以直接关闭，不影响网站运行。
ping -n 4 127.0.0.1 >nul
endlocal