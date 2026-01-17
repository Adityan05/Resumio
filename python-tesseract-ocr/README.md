# Resumio OCR Service

Python Flask service for OCR processing of PDF resumes using Tesseract.

## Production Deployment

### Simple Deployment (Recommended)

Most hosting platforms (Render, Railway, etc.) work out of the box:

```bash
# Install dependencies
pip install -r requirements.txt

# Run (platform will set PORT automatically)
python main.py
```

### Using Docker

```bash
docker build -t resumio-ocr .
docker run -p 8000:8000 -e PORT=8000 resumio-ocr
```

### Environment Variables

- `PORT`: Server port (default: 8000, usually auto-set by platform)
- `FLASK_DEBUG`: Enable debug mode (default: False, set to True only for development)
- `ALLOWED_ORIGINS`: CORS allowed origins (default: "\*", set to your backend URL in production)

### Development Mode

For local development:

```bash
export FLASK_DEBUG=True
export PORT=8000
python main.py
```

**Note:** The Flask server is production-ready with debug mode disabled by default. Most hosting platforms handle this automatically.

## API Endpoints

- `GET /`: Health check
- `POST /ocr`: Process PDF file and return extracted text

## Requirements

- Python 3.14+
- Tesseract OCR
- Poppler (for PDF to image conversion)
