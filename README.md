# AI Resume Analyzer

## Setup Instructions

### 1. Database Setup
Ensure you have PostgreSQL installed and running.
Create a database named `resume_analyzer`.

### 2. Backend Setup
1.  Navigate to `backend/`.
2.  Create a `.env` file (or update the existing one) with:
    ```env
    DATABASE_URL="postgresql://postgres:password@localhost:5432/resume_analyzer?schema=public"
    JWT_SECRET="your_jwt_secret"
    GEMINI_API_KEY="your_gemini_api_key"
    OCR_API_URL="http://localhost:5000/ocr"
    PORT=3000
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Run Database Migrations:
    ```bash
    npx prisma migrate dev --name init
    ```
5.  Start the server:
    ```bash
    npm start
    ```

### 3. Frontend Setup
1.  Navigate to `frontend/`.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

### 4. OCR Service (Optional/Existing)
If you have the Flask OCR service, ensure it is running on port 5000 (or update `OCR_API_URL`).

## Features
-   User Authentication (Signup/Login).
-   Resume Upload (PDF).
-   AI Analysis (ATS Score, Section Scores, Feedback).
-   Responsive UI with TailwindCSS.
