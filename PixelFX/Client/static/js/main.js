document.addEventListener('DOMContentLoaded', function() {
    // Initialize Feather icons
    feather.replace();

    // Elements
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('image-upload');
    const originalImage = document.getElementById('original-image');
    const processedImage = document.getElementById('processed-image');
    const downloadBtn = document.getElementById('download-btn');
    const applyBtn = document.getElementById('apply-btn');
    const clearBtn = document.getElementById('clear-btn');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const effectPlaceholder = document.getElementById('effect-placeholder');
    const loadingOverlay = document.getElementById('loading-overlay');
    const effectsList = document.getElementById('effects-list');
    const activeEffectsContainer = document.getElementById('active-effects-container');
    const activeCountBadge = document.getElementById('active-count');

    // Global variables
    let availableEffects = {};
    let activeEffects = [];
    let originalImageFile = null;
    let originalImageUrl = null; // Store the base64 URL of the original image
    let processedImageData = null;
    let previewTimeout = null;

    // Load available effects on page load
    loadAvailableEffects();

    // Event Listeners
    uploadBtn.addEventListener('click', () => fileInput.click());
    
    // Add hero button upload functionality
    const uploadHeroBtn = document.getElementById('upload-hero-btn');
    if (uploadHeroBtn) {
        uploadHeroBtn.addEventListener('click', () => fileInput.click());
    }
    
    fileInput.addEventListener('change', handleImageUpload);
    downloadBtn.addEventListener('click', downloadProcessedImage);
    applyBtn.addEventListener('click', applyEffects);
    clearBtn.addEventListener('click', clearAllEffects);
    
    // Listen for clicks on single effect apply buttons (delegated event)
    effectsList.addEventListener('click', function(e) {
        if (e.target.classList.contains('apply-single-effect') || 
            e.target.closest('.apply-single-effect')) {
            const button = e.target.classList.contains('apply-single-effect') ? 
                e.target : e.target.closest('.apply-single-effect');
            const effectId = button.dataset.effect;
            applySingleEffect(effectId);
        }
    });
    
    // Add drag and drop functionality for image upload
    const dropZones = [document.getElementById('upload-placeholder'), document.getElementById('original-image')];
    
    dropZones.forEach(zone => {
        if (zone) {
            // Prevent default behavior for these events
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                zone.addEventListener(eventName, preventDefaults, false);
            });
            
            // Highlight drop zone on drag enter/over
            ['dragenter', 'dragover'].forEach(eventName => {
                zone.addEventListener(eventName, highlight, false);
            });
            
            // Remove highlight on drag leave/drop
            ['dragleave', 'drop'].forEach(eventName => {
                zone.addEventListener(eventName, unhighlight, false);
            });
            
            // Handle dropped files
            zone.addEventListener('drop', handleDrop, false);
        }
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        document.getElementById('upload-placeholder').classList.add('highlight');
    }
    
    function unhighlight() {
        document.getElementById('upload-placeholder').classList.remove('highlight');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0 && files[0].type.match('image.*')) {
            fileInput.files = files;
            handleImageUpload({ target: { files: files } });
        }
    }

    // Debounce function for preview updates
    function debounce(func, delay) {
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(previewTimeout);
            previewTimeout = setTimeout(() => func.apply(context, args), delay);
        };
    }
    
    // Debounced preview function with 300ms delay
    const debouncedPreview = debounce(previewEffects, 300);

    // Fetch available effects from the server
    async function loadAvailableEffects() {
        try {
            showLoading();
            const response = await fetch('/effects');
            if (response.ok) {
                availableEffects = await response.json();
                renderEffectsList();
            } else {
                console.error('Failed to load effects');
            }
        } catch (error) {
            console.error('Error loading effects:', error);
        } finally {
            hideLoading();
        }
    }

    // Render the list of available effects
    function renderEffectsList() {
        effectsList.innerHTML = '';
        
        Object.entries(availableEffects).forEach(([effectId, effectInfo]) => {
            const effectCol = document.createElement('div');
            effectCol.className = 'col';
            
            // Create effect card with toggle and hidden details
            effectCol.innerHTML = `
                <input type="checkbox" id="${effectId}-toggle" class="effect-toggle d-none" data-effect="${effectId}" disabled>
                <label for="${effectId}-toggle" class="effect-card">
                    <h6 class="mb-2">${effectInfo.name}</h6>
                    <p class="text-muted small mb-3">${effectInfo.description}</p>
                    <div class="param-controls" style="display: none;" id="${effectId}-controls">
                        ${effectInfo.params.map(param => `
                            <div class="slider-container">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <label class="form-label small mb-0">${param.name}</label>
                                    <span class="slider-value" id="${effectId}-${param.id}-value">${param.default}</span>
                                </div>
                                <input type="range" 
                                    class="form-range param-slider" 
                                    data-effect="${effectId}" 
                                    data-param="${param.id}" 
                                    min="${param.min}" 
                                    max="${param.max}" 
                                    step="${param.step}" 
                                    value="${param.default}"
                                    disabled>
                            </div>
                        `).join('')}
                        <div class="text-end mt-3">
                            <button class="btn btn-sm btn-primary apply-single-effect" data-effect="${effectId}">
                                <i data-feather="check" class="btn-icon"></i> Apply
                            </button>
                        </div>
                    </div>
                </label>
            `;
            
            effectsList.appendChild(effectCol);
            
            // Add event listeners
            const toggle = document.getElementById(`${effectId}-toggle`);
            toggle.addEventListener('change', () => handleEffectToggle(toggle));
            
            const sliders = effectCol.querySelectorAll('.param-slider');
            sliders.forEach(slider => {
                slider.addEventListener('input', () => handleParamChange(slider));
            });
        });

        feather.replace();
    }

    // Handle effect toggle change
    function handleEffectToggle(toggleElement) {
        const effectId = toggleElement.dataset.effect;
        const isActive = toggleElement.checked;
        
        // Show/hide controls
        const controlsDiv = document.getElementById(`${effectId}-controls`);
        if (controlsDiv) {
            controlsDiv.style.display = isActive ? 'block' : 'none';
        }
        
        // Enable/disable sliders for this effect
        const sliders = document.querySelectorAll(`.param-slider[data-effect="${effectId}"]`);
        sliders.forEach(slider => {
            slider.disabled = !isActive;
        });
        
        if (isActive) {
            // Add effect to active effects
            addToActiveEffects(effectId);
        } else {
            // Remove effect from active effects
            removeFromActiveEffects(effectId);
        }
        
        updateActiveCount();
    }

    // Handle parameter slider change
    function handleParamChange(sliderElement) {
        const effectId = sliderElement.dataset.effect;
        const paramId = sliderElement.dataset.param;
        const value = parseFloat(sliderElement.value);
        
        // Update value display
        const valueDisplay = document.getElementById(`${effectId}-${paramId}-value`);
        if (valueDisplay) {
            valueDisplay.textContent = value;
        }
        
        // Update the active effect parameter value
        updateActiveEffectParam(effectId, paramId, value);
        
        // Update the active effect slider and its value display if visible
        const activeSlider = document.querySelector(`.active-param-slider[data-effect="${effectId}"][data-param="${paramId}"]`);
        if (activeSlider) {
            activeSlider.value = value;
            
            // Update active effect value display
            const activeValueDisplay = document.getElementById(`active-${effectId}-${paramId}-value`);
            if (activeValueDisplay) {
                activeValueDisplay.textContent = value;
            }
        }
    }

    // Add effect to active effects
    function addToActiveEffects(effectId) {
        if (!availableEffects[effectId]) return;
        
        // Check if this effect is already in active effects
        const existingIndex = activeEffects.findIndex(e => e.id === effectId);
        if (existingIndex >= 0) return;
        
        // Create new active effect object
        const effectInfo = availableEffects[effectId];
        const newEffect = {
            id: effectId,
            params: {}
        };
        
        // Initialize params with default values
        effectInfo.params.forEach(param => {
            const slider = document.querySelector(`.param-slider[data-effect="${effectId}"][data-param="${param.id}"]`);
            newEffect.params[param.id] = slider ? parseFloat(slider.value) : param.default;
        });
        
        // Add to active effects array
        activeEffects.push(newEffect);
        
        // Create active effect UI element
        const activeEffect = document.createElement('div');
        activeEffect.className = 'card mb-3 active-effect';
        activeEffect.dataset.effect = effectId;
        
        let paramsHtml = '';
        effectInfo.params.forEach(param => {
            paramsHtml += `
                <div class="slider-container">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <label class="form-label mb-0">${param.name}</label>
                        <span class="slider-value" id="active-${effectId}-${param.id}-value">${newEffect.params[param.id]}</span>
                    </div>
                    <input type="range" 
                        class="form-range active-param-slider" 
                        data-effect="${effectId}" 
                        data-param="${param.id}" 
                        min="${param.min}" 
                        max="${param.max}" 
                        step="${param.step}" 
                        value="${newEffect.params[param.id]}">
                </div>
            `;
        });
        
        activeEffect.innerHTML = `
            <div class="card-header d-flex justify-content-between align-items-center">
                <h6 class="mb-0">${effectInfo.name}</h6>
                <button class="btn btn-sm btn-outline-danger remove-effect" data-effect="${effectId}">
                    <i data-feather="x"></i>
                </button>
            </div>
            <div class="card-body">
                ${paramsHtml}
            </div>
        `;
        
        // Clear "No active effects" message if present
        if (activeEffectsContainer.querySelector('p.text-muted')) {
            activeEffectsContainer.innerHTML = '';
        }
        
        // Add to container
        activeEffectsContainer.appendChild(activeEffect);
        
        // Initialize feather icons
        feather.replace();
        
        // Add event listeners
        const removeBtn = activeEffect.querySelector('.remove-effect');
        removeBtn.addEventListener('click', function() {
            const effectId = this.dataset.effect;
            const toggle = document.getElementById(`${effectId}-toggle`);
            if (toggle) toggle.checked = false;
            removeFromActiveEffects(effectId);
            updateActiveCount();
        });
        
        // Add event listeners to active sliders
        const activeSliders = activeEffect.querySelectorAll('.active-param-slider');
        activeSliders.forEach(slider => {
            slider.addEventListener('input', function() {
                const effectId = this.dataset.effect;
                const paramId = this.dataset.param;
                const value = parseFloat(this.value);
                
                // Update active value display
                const activeValueDisplay = document.getElementById(`active-${effectId}-${paramId}-value`);
                if (activeValueDisplay) {
                    activeValueDisplay.textContent = value;
                }
                
                // Update main slider and its value display
                const mainSlider = document.querySelector(`.param-slider[data-effect="${effectId}"][data-param="${paramId}"]`);
                if (mainSlider) {
                    mainSlider.value = value;
                    
                    // Update main value display
                    const mainValueDisplay = document.getElementById(`${effectId}-${paramId}-value`);
                    if (mainValueDisplay) {
                        mainValueDisplay.textContent = value;
                    }
                }
                
                // Update active effect param
                updateActiveEffectParam(effectId, paramId, value);
            });
        });
        
        // Update preview if an image is loaded
        if (originalImageFile) {
            previewEffects();
        }
    }

    // Remove effect from active effects
    function removeFromActiveEffects(effectId) {
        // Remove from array
        const index = activeEffects.findIndex(e => e.id === effectId);
        if (index >= 0) {
            activeEffects.splice(index, 1);
        }
        
        // Remove from UI
        const activeEffect = activeEffectsContainer.querySelector(`.active-effect[data-effect="${effectId}"]`);
        if (activeEffect) {
            activeEffectsContainer.removeChild(activeEffect);
        }
        
        // Show "No active effects" message if no effects are active
        if (activeEffects.length === 0) {
            activeEffectsContainer.innerHTML = '<p class="text-center text-muted my-4">No active effects</p>';
            
            // Reset processed image preview to original if all effects are removed
            if (originalImageFile) {
                // Set processed image back to original
                const reader = new FileReader();
                reader.onload = function(e) {
                    processedImage.src = e.target.result;
                    processedImage.style.display = 'block';
                    effectPlaceholder.style.display = 'none';
                };
                reader.readAsDataURL(originalImageFile);
            }
        } else if (originalImageFile) {
            // Update preview with remaining effects
            previewEffects();
        }
    }

    // Update active effect parameter value
    function updateActiveEffectParam(effectId, paramId, value) {
        const effectIndex = activeEffects.findIndex(e => e.id === effectId);
        if (effectIndex >= 0) {
            activeEffects[effectIndex].params[paramId] = value;
            // Real-time preview update
            debouncedPreview();
        }
    }
    
    // Preview effects without applying permanently
    async function previewEffects() {
        if (!originalImageFile || activeEffects.length === 0 || !originalImageUrl) {
            return;
        }
        
        // Show a subtle loading indication for preview
        processedImage.style.opacity = "0.7";
        
        try {
            // Send the image as base64 URL for better performance during previews
            const requestData = {
                imageUrl: originalImageUrl,
                effects: activeEffects,
                preview: true
            };
            
            // Send to server for processing
            const response = await fetch('/process-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to process image');
            }
            
            const data = await response.json();
            
            // Display processed image preview
            processedImage.src = `data:image/jpeg;base64,${data.image}`;
            processedImage.style.display = 'block';
            effectPlaceholder.style.display = 'none';
            
            // We don't enable download yet as this is just a preview
            // Download is enabled only after applying effects
        } catch (error) {
            console.error('Error processing image preview:', error);
            // Don't show alert for preview errors to avoid interrupting the user experience
        } finally {
            // Reset opacity
            processedImage.style.opacity = "1";
        }
    }

    // Update active effects count
    function updateActiveCount() {
        activeCountBadge.textContent = activeEffects.length;
    }

    // Handle image upload
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        originalImageFile = file;
        
        // Display original image
        const reader = new FileReader();
        reader.onload = function(e) {
            // Save the base64 URL for faster processing
            originalImageUrl = e.target.result;
            
            // Set original image
            originalImage.src = originalImageUrl;
            originalImage.style.display = 'block';
            uploadPlaceholder.style.display = 'none';
            
            // Set processed image to same as original initially
            processedImage.src = originalImageUrl;
            processedImage.style.display = 'block';
            effectPlaceholder.style.display = 'none';
            
            // Enable effect toggles
            document.querySelectorAll('.effect-toggle').forEach(toggle => {
                toggle.disabled = false;
            });
            
            // Only enable download after applying
            downloadBtn.disabled = true;
            
            // If there are active effects, immediately preview them
            if (activeEffects.length > 0) {
                previewEffects();
            }
        };
        reader.readAsDataURL(file);
    }

    // Apply a single effect to the image
    async function applySingleEffect(effectId) {
        if (!originalImageFile) {
            alert('Please upload an image first');
            return;
        }
        
        // Find effect in active effects
        const effectIndex = activeEffects.findIndex(e => e.id === effectId);
        if (effectIndex < 0) {
            alert('Effect not active. Please enable the effect first.');
            return;
        }
        
        showLoading();
        
        try {
            // Get just this one effect
            const singleEffect = [activeEffects[effectIndex]];
            
            // Create request data
            const requestData = {
                imageUrl: originalImageUrl,
                effects: singleEffect,
                preview: false
            };
            
            // Send to server for processing
            const response = await fetch('/process-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to process image');
            }
            
            const data = await response.json();
            processedImageData = data.image;
            
            // Display processed image
            processedImage.src = `data:image/png;base64,${processedImageData}`;
            processedImage.style.display = 'block';
            effectPlaceholder.style.display = 'none';
            
            // Enable download button
            downloadBtn.disabled = false;
            
            // Show success message
            alert(`${availableEffects[effectId].name} effect applied successfully!`);
        } catch (error) {
            console.error('Error applying single effect:', error);
            alert('Failed to apply effect. Please try again.');
        } finally {
            hideLoading();
        }
    }
    
    // Apply all effects to image
    async function applyEffects() {
        if (!originalImageFile) {
            alert('Please upload an image first');
            return;
        }
        
        if (activeEffects.length === 0) {
            alert('Please activate at least one effect');
            return;
        }
        
        showLoading();
        
        try {
            // Use the URL-based API for faster processing
            const requestData = {
                imageUrl: originalImageUrl,
                effects: activeEffects,
                preview: false
            };
            
            // Send to server for processing
            const response = await fetch('/process-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to process image');
            }
            
            const data = await response.json();
            processedImageData = data.image;
            
            // Display processed image
            processedImage.src = `data:image/png;base64,${processedImageData}`;
            processedImage.style.display = 'block';
            effectPlaceholder.style.display = 'none';
            
            // Enable download button
            downloadBtn.disabled = false;
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Failed to process image. Please try again.');
        } finally {
            hideLoading();
        }
    }

    // Download processed image
    function downloadProcessedImage() {
        if (!processedImageData) {
            alert('No processed image to download');
            return;
        }
        
        // Create download link
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${processedImageData}`;
        link.download = 'edited_image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Clear all effects
    function clearAllEffects() {
        // Uncheck all effect toggles
        document.querySelectorAll('.effect-toggle').forEach(toggle => {
            toggle.checked = false;
            
            // Disable sliders
            const effectId = toggle.dataset.effect;
            
            // Hide controls for this effect
            const controlsDiv = document.getElementById(`${effectId}-controls`);
            if (controlsDiv) {
                controlsDiv.style.display = 'none';
            }
            
            const sliders = document.querySelectorAll(`.param-slider[data-effect="${effectId}"]`);
            sliders.forEach(slider => {
                slider.disabled = true;
                
                // Reset to default value
                const paramId = slider.dataset.param;
                const effectInfo = availableEffects[effectId];
                const paramInfo = effectInfo.params.find(p => p.id === paramId);
                if (paramInfo) {
                    slider.value = paramInfo.default;
                }
            });
        });
        
        // Clear active effects
        activeEffects = [];
        activeEffectsContainer.innerHTML = '<p class="text-center text-muted my-4">No active effects</p>';
        
        // Update count
        updateActiveCount();
        
        // Reset preview image to original if an image is uploaded
        if (originalImageFile) {
            // Set processed image back to original
            const reader = new FileReader();
            reader.onload = function(e) {
                processedImage.src = e.target.result;
                processedImage.style.display = 'block';
                effectPlaceholder.style.display = 'none';
            };
            reader.readAsDataURL(originalImageFile);
            
            // Disable download until effects are applied
            downloadBtn.disabled = true;
            processedImageData = null;
        }
    }

    // Helper Functions
    function showLoading() {
        loadingOverlay.classList.remove('d-none');
    }
    
    function hideLoading() {
        loadingOverlay.classList.add('d-none');
    }

    // Initialize Bootstrap tabs
    function initializeTabs() {
        const triggerTabList = Array.from(document.querySelectorAll('#effects-tabs a'));
        triggerTabList.forEach(triggerEl => {
            const tabTrigger = new bootstrap.Tab(triggerEl);
            triggerEl.addEventListener('click', event => {
                event.preventDefault();
                tabTrigger.show();
            });
        });
    }

    // Initialize
    initializeTabs();
});