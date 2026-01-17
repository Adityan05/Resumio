# Quick Deployment Guide

## 🚀 Separate Platform Deployment

Deploy each service independently:

### 1. Frontend → Vercel

- Set `VITE_API_URL` to your backend URL
- Deploy from `frontend/` directory

### 2. Backend → Azure/Render

- Set environment variables (see `.env.example`)
- Point to `backend/` directory
- Run: `npm start`

### 3. Python OCR → Render/Railway

- Set environment variables (see `.env.example`)
- Point to `python-tesseract-ocr/` directory
- Run: `python main.py`

## 📝 Environment Variables

### Frontend (Vercel)

```
VITE_API_URL=https://your-backend-url.com
```

### Backend

```
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret
GEMINI_API_KEY=your_key
OCR_API_URL=https://your-python-ocr-url.com
FRONTEND_URL=https://your-frontend.vercel.app
```

### Python OCR

```
PORT=8000
FLASK_DEBUG=False
ALLOWED_ORIGINS=https://your-backend-url.com
```

See `DEPLOYMENT.md` for detailed instructions.
