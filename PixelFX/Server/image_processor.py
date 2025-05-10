import io
from typing import Dict
from PIL import Image, ImageFilter, ImageEnhance, ImageOps


def apply_blur(image: Image.Image, value: float) -> Image.Image:
    if value <= 0:
        return image
    
    radius = value / 2 
    return image.filter(ImageFilter.GaussianBlur(radius=radius))


def apply_brightness(image: Image.Image, value: float) -> Image.Image:
    factor = 1 + (value / 100)
    enhancer = ImageEnhance.Brightness(image)
    return enhancer.enhance(factor)


def apply_contrast(image: Image.Image, value: float) -> Image.Image:
    factor = 1 + (value / 100)
    enhancer = ImageEnhance.Contrast(image)
    return enhancer.enhance(factor)


def apply_grayscale(image: Image.Image, value: float) -> Image.Image:
    if value <= 0:
        return image
    
    grayscale_image = ImageOps.grayscale(image)
    grayscale_image = grayscale_image.convert(image.mode)
    
    # If value is 100, return fully grayscale image
    if value >= 100:
        return grayscale_image
    
    # Otherwise blend original with grayscale based on value
    alpha = value / 100.0
    return Image.blend(image, grayscale_image, alpha)


def apply_effects_to_image(image_data: bytes, effects: Dict[str, float]) -> bytes:
    image = Image.open(io.BytesIO(image_data))
    
    # Make a copy to avoid modifying the original
    # Convert to RGB if it's not already (handle PNG with alpha channel)
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    if 'blur' in effects:
        image = apply_blur(image, effects['blur'])
    
    if 'brightness' in effects:
        image = apply_brightness(image, effects['brightness'])
    
    if 'contrast' in effects:
        image = apply_contrast(image, effects['contrast'])
    
    if 'grayscale' in effects:
        image = apply_grayscale(image, effects['grayscale'])
    
    # Convert back to bytes
    output_buffer = io.BytesIO()
    image.save(output_buffer, format='JPEG', quality=95)
    
    return output_buffer.getvalue()
