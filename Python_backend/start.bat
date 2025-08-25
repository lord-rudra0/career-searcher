@echo off
echo Creating Python virtual environment...
python -m venv venv || (
    echo Failed to create virtual environment
    exit /b 1
)

echo Activating virtual environment...
call venv\Scripts\activate || (
    echo Failed to activate virtual environment
    exit /b 1
)

echo Installing Python dependencies...
pip install -r requirements.txt || (
    echo Failed to install Python dependencies
    exit /b 1
)

echo Starting servers...
node start.js

if errorlevel 1 (
    echo Failed to start servers
    exit /b 1
) 