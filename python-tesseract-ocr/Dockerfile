# FROM python:3.12-slim

# # Install Tesseract and system dependencies
# RUN apt-get update && apt-get install -y \
#     tesseract-ocr \
#     tesseract-ocr-eng \
#     poppler-utils \
#     libglib2.0-0 \
#     libsm6 \
#     libxext6 \
#     libxrender-dev \
#     libgl1 \
#     && apt-get clean \
#     && rm -rf /var/lib/apt/lists/*

# WORKDIR /app

# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt

# COPY . .

# EXPOSE 8000

# CMD gunicorn app:app --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120
FROM python:3.12-slim

# Install Tesseract and system dependencies
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    poppler-utils \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgl1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Hugging Face uses port 7860
EXPOSE 7860

CMD gunicorn app:app --bind 0.0.0.0:7860 --workers 1 --timeout 300