@echo off
echo ======================================
echo Starting All Services...
echo ======================================

REM --- Start Express backend ---
echo Starting Node backend...
start cmd /k "cd backend && npm start"

REM --- Start React frontend ---
echo Starting React frontend...
start cmd /k "cd frontend && npm run dev"

REM --- Start Python OCR backend ---
echo Starting Python OCR backend...
start cmd /k "cd python-tesseract-ocr && venv\Scripts\activate && python main.py"

echo ======================================
echo All services launched in separate terminals.
echo ======================================
pause
