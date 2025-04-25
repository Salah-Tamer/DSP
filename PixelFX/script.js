document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const uploadBtn = document.getElementById('uploadBtn');
    const imageUpload = document.getElementById('imageUpload');
    const sourceImage = document.getElementById('sourceImage');
    const sourcePlaceholder = document.getElementById('sourcePlaceholder');
    const outputCanvas = document.getElementById('outputCanvas');
    const outputPlaceholder = document.getElementById('outputPlaceholder');
    const downloadBtn = document.getElementById('downloadBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const applyAllBtn = document.getElementById('applyAllBtn');
    const effectToggles = document.querySelectorAll('.effect-toggle');
    const effectControls = document.querySelectorAll('.effect-controls');
    const effectCards = document.querySelectorAll('.effect-card');
    const activeEffectsContainer = document.getElementById('activeEffectsContainer');
    const noActiveEffects = document.getElementById('noActiveEffects');
    const activeCount = document.getElementById('activeCount');
    
    // Canvas Context
    const ctx = outputCanvas.getContext('2d');
    
    // State
    let originalImage = null;
    let activeEffects = {
        blur: { active: false, value: 0 },
        brightness: { active: false, value: 100 },
        contrast: { active: false, value: 100 },
        grayscale: { active: false, value: 0 }
    };
    
    // Event Listeners
    uploadBtn.addEventListener('click', () => imageUpload.click());
    
    imageUpload.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(event) {
                originalImage = new Image();
                originalImage.crossOrigin = "anonymous";
                originalImage.onload = function() {
                    // Display source image
                    sourceImage.src = event.target.result;
                    sourceImage.style.display = 'block';
                    sourcePlaceholder.style.display = 'none';
                    
                    // Setup canvas
                    outputCanvas.width = originalImage.width;
                    outputCanvas.height = originalImage.height;
                    outputCanvas.style.display = 'block';
                    outputPlaceholder.style.display = 'none';
                    
                    // Draw original image on canvas
                    ctx.drawImage(originalImage, 0, 0);
                    
                    // Enable buttons
                    downloadBtn.disabled = false;
                    clearAllBtn.disabled = false;
                    applyAllBtn.disabled = false;
                };
                originalImage.src = event.target.result;
            };
            
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    
    // Effect toggle listeners
    effectToggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const effect = this.dataset.effect;
            const card = document.getElementById(`${effect}-card`);
            const controls = card.querySelector('.effect-controls');
            
            activeEffects[effect].active = this.checked;
            
            if (this.checked) {
                controls.style.display = 'block';
                card.classList.add('active');
                cloneToActiveTab(effect);
            } else {
                controls.style.display = 'none';
                card.classList.remove('active');
                removeFromActiveTab(effect);
            }
            
            updateActiveCount();
            applyEffects();
        });
    });
    
    // Range input listeners
    document.getElementById('blurRange').addEventListener('input', function() {
        const value = this.value;
        document.getElementById('blurValue').textContent = `${value}px`;
        activeEffects.blur.value = parseInt(value);
        applyEffects();
        updateActiveTabValues('blur', value);
    });
    
    document.getElementById('brightnessRange').addEventListener('input', function() {
        const value = this.value;
        document.getElementById('brightnessValue').textContent = `${value}%`;
        activeEffects.brightness.value = parseInt(value);
        applyEffects();
        updateActiveTabValues('brightness', value);
    });
    
    document.getElementById('contrastRange').addEventListener('input', function() {
        const value = this.value;
        document.getElementById('contrastValue').textContent = `${value}%`;
        activeEffects.contrast.value = parseInt(value);
        applyEffects();
        updateActiveTabValues('contrast', value);
    });
    
    document.getElementById('grayscaleRange').addEventListener('input', function() {
        const value = this.value;
        document.getElementById('grayscaleValue').textContent = `${value}%`;
        activeEffects.grayscale.value = parseInt(value);
        applyEffects();
        updateActiveTabValues('grayscale', value);
    });
    
    // Button listeners
    clearAllBtn.addEventListener('click', clearAllEffects);
    
    applyAllBtn.addEventListener('click', applyEffects);
    
    downloadBtn.addEventListener('click', function() {
        const link = document.createElement('a');
        link.download = 'pixelfx-processed-image.png';
        link.href = outputCanvas.toDataURL('image/png');
        link.click();
    });
    
    // Functions
    function applyEffects() {
        if (!originalImage) return;
        
        // Reset canvas
        ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
        ctx.drawImage(originalImage, 0, 0);
        
        // Get image data
        let imageData = ctx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
        let data = imageData.data;
        
        // Apply grayscale if active
        if (activeEffects.grayscale.active && activeEffects.grayscale.value > 0) {
            const intensity = activeEffects.grayscale.value / 100;
            for (let i = 0; i < data.length; i += 4) {
                const gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
                data[i] = data[i] * (1 - intensity) + gray * intensity;
                data[i + 1] = data[i + 1] * (1 - intensity) + gray * intensity;
                data[i + 2] = data[i + 2] * (1 - intensity) + gray * intensity;
            }
        }
        
        // Apply brightness if active
        if (activeEffects.brightness.active && activeEffects.brightness.value !== 100) {
            const factor = activeEffects.brightness.value / 100;
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * factor);
                data[i + 1] = Math.min(255, data[i + 1] * factor);
                data[i + 2] = Math.min(255, data[i + 2] * factor);
            }
        }
        
        // Apply contrast if active
        if (activeEffects.contrast.active && activeEffects.contrast.value !== 100) {
            const factor = (activeEffects.contrast.value / 100) * 2;
            const intercept = 128 * (1 - factor);
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, Math.max(0, data[i] * factor + intercept));
                data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * factor + intercept));
                data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * factor + intercept));
            }
        }
        
        // Put the modified image data back
        ctx.putImageData(imageData, 0, 0);
        
        // Apply blur if active (using CSS filter since it's more efficient)
        if (activeEffects.blur.active && activeEffects.blur.value > 0) {
            outputCanvas.style.filter = `blur(${activeEffects.blur.value}px)`;
        } else {
            outputCanvas.style.filter = 'none';
        }
    }
    
    function clearAllEffects() {
        // Reset all toggles and ranges
        effectToggles.forEach(toggle => {
            toggle.checked = false;
            const effect = toggle.dataset.effect;
            const card = document.getElementById(`${effect}-card`);
            const controls = card.querySelector('.effect-controls');
            controls.style.display = 'none';
            card.classList.remove('active');
            
            // Reset range values
            const range = document.getElementById(`${effect}Range`);
            if (effect === 'blur' || effect === 'grayscale') {
                range.value = 0;
                document.getElementById(`${effect}Value`).textContent = effect === 'blur' ? '0px' : '0%';
                activeEffects[effect].value = 0;
            } else {
                range.value = 100;
                document.getElementById(`${effect}Value`).textContent = '100%';
                activeEffects[effect].value = 100;
            }
            
            activeEffects[effect].active = false;
        });
        
        // Clear active effects tab
        while (activeEffectsContainer.firstChild) {
            if (activeEffectsContainer.firstChild.id === 'noActiveEffects') break;
            activeEffectsContainer.removeChild(activeEffectsContainer.firstChild);
        }
        noActiveEffects.style.display = 'block';
        
        // Reset active count
        activeCount.textContent = '0';
        
        // Reset canvas
        if (originalImage) {
            outputCanvas.style.filter = 'none';
            ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
            ctx.drawImage(originalImage, 0, 0);
        }
    }
    
    function cloneToActiveTab(effect) {
        // Hide "no active effects" message
        noActiveEffects.style.display = 'none';
        
        // Clone the effect card
        const originalCard = document.getElementById(`${effect}-card`);
        const clone = originalCard.cloneNode(true);
        clone.id = `active-${effect}-card`;
        
        // Add to active tab
        const colDiv = document.createElement('div');
        colDiv.className = 'col-md-6 col-lg-4 mb-3';
        colDiv.id = `active-${effect}-container`;
        colDiv.appendChild(clone);
        activeEffectsContainer.appendChild(colDiv);
        
        // Setup event listeners for the clone
        const cloneToggle = clone.querySelector('.effect-toggle');
        cloneToggle.addEventListener('change', function() {
            const originalToggle = document.getElementById(`${effect}Toggle`);
            originalToggle.checked = this.checked;
            originalToggle.dispatchEvent(new Event('change'));
        });
        
        const cloneRange = clone.querySelector('.form-range');
        cloneRange.addEventListener('input', function() {
            const originalRange = document.getElementById(`${effect}Range`);
            originalRange.value = this.value;
            originalRange.dispatchEvent(new Event('input'));
        });
    }
    
    function removeFromActiveTab(effect) {
        const container = document.getElementById(`active-${effect}-container`);
        if (container) {
            activeEffectsContainer.removeChild(container);
        }
        
        // Show "no active effects" message if no active effects
        if (activeEffectsContainer.children.length === 1) {
            noActiveEffects.style.display = 'block';
        }
    }
    
    function updateActiveTabValues(effect, value) {
        const activeCard = document.getElementById(`active-${effect}-card`);
        if (activeCard) {
            const valueSpan = activeCard.querySelector(`#${effect}Value`);
            if (valueSpan) {
                valueSpan.textContent = effect === 'blur' ? `${value}px` : `${value}%`;
            }
            
            const range = activeCard.querySelector('.form-range');
            if (range) {
                range.value = value;
            }
        }
    }
    
    function updateActiveCount() {
        let count = 0;
        for (const effect in activeEffects) {
            if (activeEffects[effect].active) {
                count++;
            }
        }
        activeCount.textContent = count;
    }
});