# Startup Guide

## 1. Database Setup
- Ensure PostgreSQL is running.
- Create a database named `resume_analyzer`.
- Update `backend/.env` with your database credentials if different from default.

## 2. Backend Setup
- Navigate to `backend/`.
- Add your API Key to `.env`: `GEMINI_API_KEY="your_key_here"`.
- Run migrations:
  ```bash
  npx prisma migrate dev --name init
  ```
- Start the server:
  ```bash
  npm start
  ```
- Server runs on `http://localhost:3000`.

## 3. OCR Service Setup
- Navigate to `python-tesseract-ocr/`.
- Install requirements:
  ```bash
  pip install -r requirements.txt
  ```
- Start the Flask app:
  ```bash
  python main.py
  ```
- Service runs on `http://localhost:8000`.

## 4. Frontend Setup
- Navigate to `frontend/`.
- Start the dev server:
  ```bash
  npm run dev
  ```
- Open `http://localhost:5173` in your browser.

## 5. Usage
- Register a new account.
- Login.
- Upload a PDF resume.
- View the analysis!
