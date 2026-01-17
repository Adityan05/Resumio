FROM python:3.14-slim

# ---- Install Tesseract and Poppler ----
RUN apt-get update && \
    apt-get install -y tesseract-ocr poppler-utils && \
    rm -rf /var/lib/apt/lists/*

# ---- Set working directory ----
WORKDIR /app

# ---- Copy project files ----
COPY . .

# ---- Install Python dependencies ----
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ---- Expose port ----
EXPOSE 8000

# ---- Set environment variables ----
ENV FLASK_DEBUG=False
ENV PORT=8000

# ---- Start server (production) ----
# Most platforms will use this, or you can override with your platform's command
CMD ["python", "main.py"]
