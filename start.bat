@echo off
echo Starting Law Agent Project...
echo.

echo Starting Backend...
start cmd /k "cd backend && pip install -r requirements.txt && python run.py"
echo.

echo Starting Frontend...
start cmd /k "cd frontend && npm install && npm run dev"
echo.

echo All services started!
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000
echo.
pause
