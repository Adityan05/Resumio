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
EXPOSE 8080

# ---- Start server ----
CMD ["gunicorn", "main:app", "--bind", "0.0.0.0:8080"]
