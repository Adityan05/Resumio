from flask import Flask, request, jsonify
from flask_cors import CORS
import pytesseract
from pdf2image.pdf2image import convert_from_bytes
import io

app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET'])
def home():
    return jsonify({'status': 'OCR service online'})

@app.route('/ocr', methods=['POST'])
def ocr_only():
    try:
        file = request.files['file']
        pdf_bytes = file.read()
        
        # Convert PDF to images
        images = convert_from_bytes(pdf_bytes, dpi=300, first_page=1, last_page=5)
        
        # OCR each page
        text = ''
        for image in images:
            text += pytesseract.image_to_string(image) + '\n\n'
        
        return jsonify({'text': text.strip()})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
