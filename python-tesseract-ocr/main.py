from flask import Flask, request, jsonify
from flask_cors import CORS
import pytesseract
from pdf2image.pdf2image import convert_from_bytes
import io
import os

app = Flask(__name__)
# Configure CORS for production
CORS(app, resources={
    r"/*": {
        "origins": os.getenv("ALLOWED_ORIGINS", "*"),
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Disable debug mode for production
app.config['DEBUG'] = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
app.config['TESTING'] = False

@app.route('/', methods=['GET'])
@app.route('/health', methods=['GET'])
def home():
    """Health check endpoint for production monitoring"""
    return jsonify({
        'status': 'online',
        'service': 'resumio-ocr',
        'version': '1.0.0'
    }), 200

@app.route('/ocr', methods=['POST'])
def ocr_only():
    try:
        # Validate file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({'error': 'Only PDF files are supported'}), 400
        
        pdf_bytes = file.read()
        
        # Validate file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if len(pdf_bytes) > max_size:
            return jsonify({'error': 'File size exceeds 10MB limit'}), 400
        
        # Convert PDF to images
        images = convert_from_bytes(pdf_bytes, dpi=300, first_page=1, last_page=5)
        
        # OCR each page
        text = ''
        for image in images:
            text += pytesseract.image_to_string(image) + '\n\n'
        
        return jsonify({'text': text.strip()})
    except Exception as e:
        # Log error in production (you might want to use proper logging)
        if app.config['DEBUG']:
            print(f"OCR Error: {str(e)}")
        return jsonify({'error': 'OCR processing failed. Please try again.'}), 500

if __name__ == '__main__':
    # Production-ready Flask server
    # Most hosting platforms (Render, Railway, etc.) will use this
    port = int(os.getenv('PORT', 8000))
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    # Use threaded mode for better performance
    # Most platforms handle this automatically, but we set it explicitly
    app.run(
        host='0.0.0.0', 
        port=port, 
        debug=debug_mode,
        threaded=True
    )
