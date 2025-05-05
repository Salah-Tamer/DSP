import io
from typing import Dict
from PIL import Image, ImageFilter, ImageEnhance, ImageOps


def apply_blur(image: Image.Image, value: float) -> Image.Image:
    """
    Apply blur effect to image
    Value range: 0-10 (0 = no blur, 10 = maximum blur)
    """
    if value <= 0:
        return image
    
    # Use GaussianBlur filter with radius based on value
    radius = value / 2  # Convert 0-10 range to 0-5 radius
    return image.filter(ImageFilter.GaussianBlur(radius=radius))


def apply_brightness(image: Image.Image, value: float) -> Image.Image:
    """
    Apply brightness effect to image
    Value range: -100 to 100 (-100 = darkest, 0 = no change, 100 = brightest)
    """
    # Convert -100 to 100 range to 0 to 2 factor (0.5 = 50% darker, 1 = no change, 2 = 100% brighter)
    factor = 1 + (value / 100)
    enhancer = ImageEnhance.Brightness(image)
    return enhancer.enhance(factor)


def apply_contrast(image: Image.Image, value: float) -> Image.Image:
    """
    Apply contrast effect to image
    Value range: -100 to 100 (-100 = min contrast, 0 = no change, 100 = max contrast)
    """
    # Convert -100 to 100 range to 0 to 2 factor (0.5 = 50% less contrast, 1 = no change, 2 = 100% more contrast)
    factor = 1 + (value / 100)
    enhancer = ImageEnhance.Contrast(image)
    return enhancer.enhance(factor)


def apply_grayscale(image: Image.Image, value: float) -> Image.Image:
    """
    Apply grayscale effect to image
    Value range: 0-100 (0 = no effect, 100 = full grayscale)
    """
    if value <= 0:
        return image
    
    # Create grayscale version of the image
    grayscale_image = ImageOps.grayscale(image)
    grayscale_image = grayscale_image.convert(image.mode)
    
    # If value is 100, return fully grayscale image
    if value >= 100:
        return grayscale_image
    
    # Otherwise blend original with grayscale based on value
    alpha = value / 100.0
    return Image.blend(image, grayscale_image, alpha)


def apply_effects_to_image(image_data: bytes, effects: Dict[str, float]) -> bytes:
    """
    Apply multiple effects to an image
    Returns the processed image as bytes
    
    Effects should be a dictionary mapping effect names to their values
    Supported effects: blur, brightness, contrast, grayscale
    """
    # Open image from bytes
    image = Image.open(io.BytesIO(image_data))
    
    # Make a copy to avoid modifying the original
    # Convert to RGB if it's not already (handle PNG with alpha channel)
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Apply effects in sequence
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
