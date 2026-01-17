# Resumio Deployment Guide

This guide covers deploying Resumio across three separate platforms:

1. **Frontend** → Vercel
2. **Backend (Node.js)** → Azure/Render
3. **Python OCR Service** → Render/Railway/Any Python Host

---

## 📋 Prerequisites

- GitHub repository with your code
- Accounts on your chosen platforms
- Environment variables ready

---

## 🎨 Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

1. Create `.env.production` file in `frontend/` directory:

```env
VITE_API_URL=https://your-backend-url.com
```

2. Commit and push to GitHub

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure:

   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. Add Environment Variables:

   - `VITE_API_URL` = Your backend URL (e.g., `https://your-backend.onrender.com`)

6. Click "Deploy"

### Step 3: Update Backend CORS

Make sure your backend allows requests from your Vercel domain.

---

## 🚀 Backend Deployment (Azure or Render)

### Option A: Render (Easier)

1. Go to [render.com](https://render.com) and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:

   - **Name**: `resumio-backend`
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: `backend`

5. Add Environment Variables:

   ```
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_jwt_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   OCR_API_URL=https://your-python-ocr-service.com
   PORT=3000
   ```

6. Click "Create Web Service"

### Option B: Azure App Service

1. Go to Azure Portal → Create App Service
2. Configure:

   - Runtime stack: Node.js
   - Region: Choose closest to you

3. In Configuration → Application Settings, add:

   ```
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_jwt_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   OCR_API_URL=https://your-python-ocr-service.com
   PORT=3000
   ```

4. In Deployment Center, connect GitHub and set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Update Backend CORS

In `backend/server.js`, update CORS to allow your frontend domain:

```javascript
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
```

---

## 🐍 Python OCR Service Deployment

### Option A: Render (Recommended)

1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:

   - **Name**: `resumio-ocr`
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`
   - **Root Directory**: `python-tesseract-ocr`

5. Add Environment Variables:

   ```
   PORT=8000
   FLASK_DEBUG=False
   ALLOWED_ORIGINS=https://your-backend-url.com
   ```

6. **Important**: Render will automatically set `PORT` environment variable

### Option B: Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Add service → Select `python-tesseract-ocr` directory
5. Railway will auto-detect Python
6. Add environment variables (same as Render)
7. Deploy

### Option C: Any Python Hosting

Most Python hosting platforms work the same way:

1. Point to `python-tesseract-ocr` directory
2. Install dependencies: `pip install -r requirements.txt`
3. Run: `python main.py`
4. Set environment variables:
   - `PORT` (usually auto-set by platform)
   - `FLASK_DEBUG=False`
   - `ALLOWED_ORIGINS=your-backend-url`

**Note**: Make sure the platform supports:

- Installing system packages (Tesseract OCR, Poppler)
- Or use Docker if available

---

## 🔗 Connecting Everything

### 1. Update Frontend Environment Variables

After deploying backend, update Vercel:

```
VITE_API_URL=https://your-backend-url.com
```

### 2. Update Backend Environment Variables

After deploying Python OCR service:

```
OCR_API_URL=https://your-python-ocr-url.com
```

### 3. Update Python OCR CORS

In Python service, set:

```
ALLOWED_ORIGINS=https://your-backend-url.com
```

---

## ✅ Testing After Deployment

1. **Frontend**: Visit your Vercel URL
2. **Backend**: Test `https://your-backend-url.com/health`
3. **Python OCR**: Test `https://your-python-url.com/health`

---

## 🔒 Security Checklist

- [ ] All API keys are in environment variables (never in code)
- [ ] CORS is configured correctly for each service
- [ ] Database connection string is secure
- [ ] JWT secret is strong and unique
- [ ] All services use HTTPS

---

## 🐛 Troubleshooting

### Frontend can't connect to backend

- Check CORS settings in backend
- Verify `VITE_API_URL` is correct
- Check browser console for errors

### Backend can't connect to Python OCR

- Verify `OCR_API_URL` is correct
- Check Python service is running
- Verify CORS allows backend domain

### Python service not starting

- Check logs for missing dependencies
- Verify Tesseract OCR is installed (if not using Docker)
- Check PORT environment variable is set

---

## 📝 Environment Variables Summary

### Frontend (.env.production)

```
VITE_API_URL=https://your-backend-url.com
```

### Backend

```
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret
GEMINI_API_KEY=your_key
OCR_API_URL=https://your-python-ocr-url.com
PORT=3000
FRONTEND_URL=https://your-frontend-url.vercel.app
```

### Python OCR

```
PORT=8000
FLASK_DEBUG=False
ALLOWED_ORIGINS=https://your-backend-url.com
```

---

## 🎉 You're Done!

Your Resumio app should now be live across three platforms!
