from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import base64
import json
import io
import os
import sys
from PIL import Image

# Add the current directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from effects import apply_effect, EFFECTS

app = Flask(__name__, 
           template_folder='../Client/templates',
           static_folder='../Client/static')
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")
CORS(app)

# Expose the Flask app for Vercel
app = app

@app.route("/", methods=["GET"])
def get_index():
    """Render the main page of the application"""
    return render_template("index.html")

@app.route("/static/<path:path>")
def serve_static(path):
    return send_from_directory("../Client/static", path)

# The /process endpoint has been removed as we now use only the /process-url endpoint

@app.route('/process-url', methods=['POST'])
def process_image_url():
    try:
        request_data = request.get_json()
        if not request_data or 'imageUrl' not in request_data:
            return jsonify({'error': 'No image URL provided'}), 400
        
        image_url = request_data.get('imageUrl')
        effects = request_data.get('effects', [])
        is_preview = request_data.get('preview', False)
        
        # Extract the base64 image data (remove data:image/jpeg;base64, prefix)
        if ',' in image_url:
            image_data = image_url.split(',')[1]
        else:
            image_data = image_url
            
        # Decode base64 data
        image_bytes = base64.b64decode(image_data)
        img = Image.open(io.BytesIO(image_bytes))
        
        # For previews, resize large images to improve performance
        if is_preview:
            # Calculate new dimensions while maintaining aspect ratio
            max_preview_size = 800  # Maximum width or height for preview
            if img.width > max_preview_size or img.height > max_preview_size:
                ratio = min(max_preview_size / img.width, max_preview_size / img.height)
                new_width = int(img.width * ratio)
                new_height = int(img.height * ratio)
                img = img.resize((new_width, new_height), Image.LANCZOS)
        
        # Apply each effect
        for effect in effects:
            effect_id = effect.get('id')
            params = effect.get('params', {})
            
            img = apply_effect(img, effect_id, params)
        
        # Save and encode the image
        buffered = io.BytesIO()
        img_format = "JPEG" if is_preview else "PNG"
        quality = 85 if is_preview else 95
        
        if img_format == "JPEG" and img.mode == 'RGBA':
            # Convert RGBA to RGB for JPEG format
            img = img.convert('RGB')
            
        img.save(buffered, format=img_format, quality=quality)
        img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        return jsonify({'image': img_str})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/effects', methods=['GET'])
def get_available_effects():
    effect_info = {
        'blur': {
            'name': 'Blur',
            'description': 'Apply blur effect',
            'params': [
                {'id': 'radius', 'name': 'Radius', 'type': 'slider', 'min': 0, 'max': 20, 'step': 0.5, 'default': 5}
            ]
        },
        'brightness': {
            'name': 'Brightness',
            'description': 'Adjust image brightness',
            'params': [
                {'id': 'factor', 'name': 'Factor', 'type': 'slider', 'min': 0, 'max': 2, 'step': 0.1, 'default': 1.0}
            ]
        },
        'contrast': {
            'name': 'Contrast',
            'description': 'Adjust image contrast',
            'params': [
                {'id': 'factor', 'name': 'Factor', 'type': 'slider', 'min': 0, 'max': 2, 'step': 0.1, 'default': 1.0}
            ]
        },
        'grayscale': {
            'name': 'Grayscale',
            'description': 'Convert image to grayscale',
            'params': [
                {'id': 'factor', 'name': 'Factor', 'type': 'slider', 'min': 0, 'max': 1, 'step': 0.1, 'default': 1.0}
            ]
        },
        'salt_pepper': {
            'name': 'Salt & Pepper',
            'description': 'Apply salt & pepper noise effect',
            'params': [
                {'id': 'noise_level', 'name': 'Noise Level', 'type': 'slider', 'min': 0, 'max': 0.1, 'step': 0.001, 'default': 0.02},
                {'id': 'block_size', 'name': 'Block Size', 'type': 'slider', 'min': 1, 'max': 5, 'step': 1, 'default': 1}
            ]
        }
    }
    
    available_effects = {k: v for k, v in effect_info.items() if k in EFFECTS}
    
    return jsonify(available_effects)

if __name__ == "__main__":
    # Run server with Flask development server
    app.run(host="0.0.0.0", port=5002, debug=True)