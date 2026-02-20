from flask import Flask, request, jsonify
from flask_cors import CORS
import pytesseract
from pdf2image.pdf2image import convert_from_bytes
import io
import os
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

CORS(app, resources={
    r"/*": {
        "origins": os.getenv("ALLOWED_ORIGINS", "*"),
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

app.config['DEBUG'] = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
app.config['TESTING'] = False

@app.route('/', methods=['GET'])
@app.route('/health', methods=['GET'])
def home():
    return jsonify({
        'status': 'online',
        'service': 'resumio-ocr',
        'version': '1.0.0'
    }), 200

@app.route('/ocr', methods=['POST'])
def ocr_only():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        pdf_bytes = file.read()
        
        if len(pdf_bytes) == 0:
            return jsonify({'error': 'No file selected or file is empty'}), 400
        
        if file.filename:
            if not file.filename.lower().endswith('.pdf'):
                return jsonify({'error': 'Only PDF files are supported'}), 400
        else:
            if not pdf_bytes[:4] == b'%PDF':
                return jsonify({'error': 'File does not appear to be a valid PDF'}), 400
        
        max_size = 10 * 1024 * 1024  # 10MB
        if len(pdf_bytes) > max_size:
            return jsonify({'error': 'File size exceeds 10MB limit'}), 400
        
        logger.info("Starting OCR processing...")
        
        # Convert PDF to images
        images = convert_from_bytes(pdf_bytes, dpi=150, first_page=1, last_page=3)
        
        # OCR each page
        text = ''
        for i, image in enumerate(images):
            logger.info(f"Processing page {i+1}/{len(images)}")
            text += pytesseract.image_to_string(image) + '\n\n'
        
        logger.info("OCR processing complete")
        return jsonify({'text': text.strip()})

    except Exception as e:
        logger.error(f"OCR Error: {str(e)}")
        return jsonify({'error': 'OCR processing failed. Please try again.'}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(
        host='0.0.0.0', 
        port=port, 
        debug=debug_mode,
        threaded=True
    )