from PIL import Image, ImageFilter, ImageEnhance, ImageOps
import numpy as np
import random

# List of available effects
EFFECTS = ['blur', 'brightness', 'grayscale', 'salt_pepper']

def apply_blur(image, params=None):
    """Apply blur effect to image"""
    if params is None:
        params = {'radius': 5}
    
    radius = params.get('radius', 5)
    return image.filter(ImageFilter.GaussianBlur(radius=radius))

def apply_brightness(image, params=None):
    """Apply brightness effect to image"""
    if params is None:
        params = {'factor': 1.0}
    
    factor = params.get('factor', 1.0)
    enhancer = ImageEnhance.Brightness(image)
    return enhancer.enhance(factor)

def apply_grayscale(image, params=None):
    """Apply grayscale effect to image"""
    if params is None:
        params = {'factor': 1.0}
    
    factor = params.get('factor', 1.0)
    
    if factor <= 0:
        return image
    
    grayscale_image = ImageOps.grayscale(image)
    grayscale_image = grayscale_image.convert(image.mode)
    
    if factor >= 1:
        return grayscale_image
    
    return Image.blend(image, grayscale_image, factor)

def apply_salt_pepper(image, params=None):
    """Apply salt & pepper noise to image"""
    if params is None:
        params = {'noise_level': 0.02, 'block_size': 1}
    
    noise_level = params.get('noise_level', 0.02)
    block_size = max(1, int(params.get('block_size', 1)))
    
    # Check if we need to limit processing for preview
    is_large_image = image.width * image.height > 1000000  # 1 megapixel
    if is_large_image and noise_level > 0.01:
        # For large images, when preview is True or for higher noise levels,
        # we'll use a more efficient approach
        
        # Resize image temporarily for faster processing
        original_size = image.size
        max_dimension = 800
        
        if max(original_size) > max_dimension:
            ratio = max_dimension / max(original_size)
            new_size = (int(original_size[0] * ratio), int(original_size[1] * ratio))
            temp_image = image.resize(new_size, Image.LANCZOS)
        else:
            temp_image = image.copy()
        
        # Convert resized image to numpy array
        img_array = np.array(temp_image)
        
        # Get dimensions
        if len(img_array.shape) == 3:
            height, width, channels = img_array.shape
        else:
            height, width = img_array.shape
            channels = 1
        
        # Calculate number of pixels to modify (adjusted for resized image)
        num_pixels = int(noise_level * width * height)
        
        # Create random coordinates in advance (more efficient)
        rows = np.random.randint(0, height - min(block_size, height), size=num_pixels)
        cols = np.random.randint(0, width - min(block_size, width), size=num_pixels)
        is_salt = np.random.random(size=num_pixels) > 0.5
        
        # Apply noise in blocks using vectorized operations where possible
        for i in range(num_pixels):
            r, c = rows[i], cols[i]
            value = 255 if is_salt[i] else 0
            
            # Define the block
            r_end = min(r + block_size, height)
            c_end = min(c + block_size, width)
            
            # Apply block efficiently
            if len(img_array.shape) == 3:
                img_array[r:r_end, c:c_end] = np.full((r_end - r, c_end - c, channels), value)
            else:
                img_array[r:r_end, c:c_end] = value
        
        return Image.fromarray(img_array if len(img_array.shape) == 2 else img_array.astype('uint8')).resize(original_size, Image.LANCZOS)
    else:
        # Original implementation for smaller images or lower noise levels
        # Convert image to numpy array
        img_array = np.array(image)
        
        # Get dimensions
        if len(img_array.shape) == 3:
            height, width, channels = img_array.shape
        else:
            height, width = img_array.shape
            channels = 1
        
        # Calculate number of pixels to modify
        num_pixels = int(noise_level * width * height)
        
        # Apply noise in blocks
        for _ in range(num_pixels):
            # Get random coordinates
            row = random.randint(0, height - min(block_size, height))
            col = random.randint(0, width - min(block_size, width))
            
            # Decide if salt (255) or pepper (0)
            salt = random.random() > 0.5
            value = 255 if salt else 0
            
            # Apply to block
            r_end = min(row + block_size, height)
            c_end = min(col + block_size, width)
            
            if len(img_array.shape) == 3:
                for r in range(row, r_end):
                    for c in range(col, c_end):
                        img_array[r, c] = [value] * channels
            else:
                for r in range(row, r_end):
                    for c in range(col, c_end):
                        img_array[r, c] = value
        
        return Image.fromarray(img_array if len(img_array.shape) == 2 else img_array.astype('uint8'))

def apply_effect(image, effect_id, params=None):
    """Apply specific effect to image"""
    effect_functions = {
        'blur': apply_blur,
        'brightness': apply_brightness,
        'grayscale': apply_grayscale,
        'salt_pepper': apply_salt_pepper
    }
    
    if effect_id in effect_functions:
        return effect_functions[effect_id](image, params)
    else:
        return image  # Return original image if effect not found