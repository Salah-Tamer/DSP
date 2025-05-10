document.addEventListener('DOMContentLoaded', function() {
    feather.replace();

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

    let availableEffects = {};
    let activeEffects = [];
    let originalImageFile = null;
    let originalImageUrl = null;
    let processedImageData = null;
    let previewTimeout = null;

    loadAvailableEffects();

    uploadBtn.addEventListener('click', () => fileInput.click());
    
    const uploadHeroBtn = document.getElementById('upload-hero-btn');
    if (uploadHeroBtn) {
        uploadHeroBtn.addEventListener('click', () => fileInput.click());
    }
    
    fileInput.addEventListener('change', handleImageUpload);
    downloadBtn.addEventListener('click', downloadProcessedImage);
    applyBtn.addEventListener('click', applyEffects);
    clearBtn.addEventListener('click', clearAllEffects);
    
    effectsList.addEventListener('click', function(e) {
        if (e.target.classList.contains('apply-single-effect') || 
            e.target.closest('.apply-single-effect')) {
            const button = e.target.classList.contains('apply-single-effect') ? 
                e.target : e.target.closest('.apply-single-effect');
            const effectId = button.dataset.effect;
            applySingleEffect(effectId);
        }
    });
    
    const dropZones = [document.getElementById('upload-placeholder'), document.getElementById('original-image')];
    
    dropZones.forEach(zone => {
        if (zone) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                zone.addEventListener(eventName, preventDefaults, false);
            });
            
            ['dragenter', 'dragover'].forEach(eventName => {
                zone.addEventListener(eventName, highlight, false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                zone.addEventListener(eventName, unhighlight, false);
            });
            
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

    function debounce(func, delay) {
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(previewTimeout);
            previewTimeout = setTimeout(() => func.apply(context, args), delay);
        };
    }
    
    const debouncedPreview = debounce(previewEffects, 300);

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

    function renderEffectsList() {
        effectsList.innerHTML = '';
        
        Object.entries(availableEffects).forEach(([effectId, effectInfo]) => {
            const effectCol = document.createElement('div');
            effectCol.className = 'col';
            
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

    function handleEffectToggle(toggleElement) {
        const effectId = toggleElement.dataset.effect;
        const isActive = toggleElement.checked;
        
        const controlsDiv = document.getElementById(`${effectId}-controls`);
        if (controlsDiv) {
            controlsDiv.style.display = isActive ? 'block' : 'none';
        }
        
        const sliders = document.querySelectorAll(`.param-slider[data-effect="${effectId}"]`);
        sliders.forEach(slider => {
            slider.disabled = !isActive;
        });
        
        if (isActive) {
            addToActiveEffects(effectId);
        } else {
            removeFromActiveEffects(effectId);
        }
        
        updateActiveCount();
    }

    function handleParamChange(sliderElement) {
        const effectId = sliderElement.dataset.effect;
        const paramId = sliderElement.dataset.param;
        const value = parseFloat(sliderElement.value);
        
        const valueDisplay = document.getElementById(`${effectId}-${paramId}-value`);
        if (valueDisplay) {
            valueDisplay.textContent = value;
        }
        
        updateActiveEffectParam(effectId, paramId, value);
        
        const activeSlider = document.querySelector(`.active-param-slider[data-effect="${effectId}"][data-param="${paramId}"]`);
        if (activeSlider) {
            activeSlider.value = value;
            
            const activeValueDisplay = document.getElementById(`active-${effectId}-${paramId}-value`);
            if (activeValueDisplay) {
                activeValueDisplay.textContent = value;
            }
        }
    }

    function addToActiveEffects(effectId) {
        if (!availableEffects[effectId]) return;
        
        const existingIndex = activeEffects.findIndex(e => e.id === effectId);
        if (existingIndex >= 0) return;
        
        const effectInfo = availableEffects[effectId];
        const newEffect = {
            id: effectId,
            params: {}
        };
        
        effectInfo.params.forEach(param => {
            const slider = document.querySelector(`.param-slider[data-effect="${effectId}"][data-param="${param.id}"]`);
            newEffect.params[param.id] = slider ? parseFloat(slider.value) : param.default;
        });
        
        activeEffects.push(newEffect);
        
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
        
        if (activeEffectsContainer.querySelector('p.text-muted')) {
            activeEffectsContainer.innerHTML = '';
        }
        
        activeEffectsContainer.appendChild(activeEffect);
        
        feather.replace();
        
        const removeBtn = activeEffect.querySelector('.remove-effect');
        removeBtn.addEventListener('click', function() {
            const effectId = this.dataset.effect;
            const toggle = document.getElementById(`${effectId}-toggle`);
            if (toggle) toggle.checked = false;
            removeFromActiveEffects(effectId);
            updateActiveCount();
        });
        
        const activeSliders = activeEffect.querySelectorAll('.active-param-slider');
        activeSliders.forEach(slider => {
            slider.addEventListener('input', function() {
                const effectId = this.dataset.effect;
                const paramId = this.dataset.param;
                const value = parseFloat(this.value);
                
                const activeValueDisplay = document.getElementById(`active-${effectId}-${paramId}-value`);
                if (activeValueDisplay) {
                    activeValueDisplay.textContent = value;
                }
                
                const mainSlider = document.querySelector(`.param-slider[data-effect="${effectId}"][data-param="${paramId}"]`);
                if (mainSlider) {
                    mainSlider.value = value;
                    
                    const mainValueDisplay = document.getElementById(`${effectId}-${paramId}-value`);
                    if (mainValueDisplay) {
                        mainValueDisplay.textContent = value;
                    }
                }
                
                updateActiveEffectParam(effectId, paramId, value);
            });
        });
        
        if (originalImageFile) {
            previewEffects();
        }
    }

    function removeFromActiveEffects(effectId) {
        const index = activeEffects.findIndex(e => e.id === effectId);
        if (index >= 0) {
            activeEffects.splice(index, 1);
        }
        
        const activeEffect = activeEffectsContainer.querySelector(`.active-effect[data-effect="${effectId}"]`);
        if (activeEffect) {
            activeEffectsContainer.removeChild(activeEffect);
        }
        
        if (activeEffects.length === 0) {
            activeEffectsContainer.innerHTML = '<p class="text-center text-muted my-4">No active effects</p>';
            
            if (originalImageFile) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    processedImage.src = e.target.result;
                    processedImage.style.display = 'block';
                    effectPlaceholder.style.display = 'none';
                };
                reader.readAsDataURL(originalImageFile);
            }
        } else if (originalImageFile) {
            previewEffects();
        }
    }

    function updateActiveEffectParam(effectId, paramId, value) {
        const effectIndex = activeEffects.findIndex(e => e.id === effectId);
        if (effectIndex >= 0) {
            activeEffects[effectIndex].params[paramId] = value;
            debouncedPreview();
        }
    }
    
    async function previewEffects() {
        if (!originalImageFile || activeEffects.length === 0 || !originalImageUrl) {
            return;
        }
        
        processedImage.style.opacity = "0.7";
        
        try {
            const requestData = {
                imageUrl: originalImageUrl,
                effects: activeEffects,
                preview: true
            };
            
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
            
            processedImage.src = `data:image/jpeg;base64,${data.image}`;
            processedImage.style.display = 'block';
            effectPlaceholder.style.display = 'none';
            
        } catch (error) {
            console.error('Error processing image preview:', error);
        } finally {
            processedImage.style.opacity = "1";
        }
    }

    function updateActiveCount() {
        activeCountBadge.textContent = activeEffects.length;
    }

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        originalImageFile = file;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            originalImageUrl = e.target.result;
            
            originalImage.src = originalImageUrl;
            originalImage.style.display = 'block';
            uploadPlaceholder.style.display = 'none';
            
            processedImage.src = originalImageUrl;
            processedImage.style.display = 'block';
            effectPlaceholder.style.display = 'none';
            
            document.querySelectorAll('.effect-toggle').forEach(toggle => {
                toggle.disabled = false;
            });
            
            downloadBtn.disabled = true;
            
            if (activeEffects.length > 0) {
                previewEffects();
            }
        };
        reader.readAsDataURL(file);
    }

    async function applySingleEffect(effectId) {
        if (!originalImageFile) {
            alert('Please upload an image first');
            return;
        }
        
        const effectIndex = activeEffects.findIndex(e => e.id === effectId);
        if (effectIndex < 0) {
            alert('Effect not active. Please enable the effect first.');
            return;
        }
        
        showLoading();
        
        try {
            const singleEffect = [activeEffects[effectIndex]];
            
            const requestData = {
                imageUrl: originalImageUrl,
                effects: singleEffect,
                preview: false
            };
            
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
            
            processedImage.src = `data:image/png;base64,${processedImageData}`;
            processedImage.style.display = 'block';
            effectPlaceholder.style.display = 'none';
            
            downloadBtn.disabled = false;
            
            alert(`${availableEffects[effectId].name} effect applied successfully!`);
        } catch (error) {
            console.error('Error applying single effect:', error);
            alert('Failed to apply effect. Please try again.');
        } finally {
            hideLoading();
        }
    }
    
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
            const requestData = {
                imageUrl: originalImageUrl,
                effects: activeEffects,
                preview: false
            };
            
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
            
            processedImage.src = `data:image/png;base64,${processedImageData}`;
            processedImage.style.display = 'block';
            effectPlaceholder.style.display = 'none';
            
            downloadBtn.disabled = false;
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Failed to process image. Please try again.');
        } finally {
            hideLoading();
        }
    }

    function downloadProcessedImage() {
        if (!processedImageData) {
            alert('No processed image to download');
            return;
        }
        
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${processedImageData}`;
        link.download = 'edited_image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function clearAllEffects() {
        document.querySelectorAll('.effect-toggle').forEach(toggle => {
            toggle.checked = false;
            
            const effectId = toggle.dataset.effect;
            
            const controlsDiv = document.getElementById(`${effectId}-controls`);
            if (controlsDiv) {
                controlsDiv.style.display = 'none';
            }
            
            const sliders = document.querySelectorAll(`.param-slider[data-effect="${effectId}"]`);
            sliders.forEach(slider => {
                slider.disabled = true;
                
                const paramId = slider.dataset.param;
                const effectInfo = availableEffects[effectId];
                const paramInfo = effectInfo.params.find(p => p.id === paramId);
                if (paramInfo) {
                    slider.value = paramInfo.default;
                }
            });
        });
        
        activeEffects = [];
        activeEffectsContainer.innerHTML = '<p class="text-center text-muted my-4">No active effects</p>';
        
        updateActiveCount();
        
        if (originalImageFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                processedImage.src = e.target.result;
                processedImage.style.display = 'block';
                effectPlaceholder.style.display = 'none';
            };
            reader.readAsDataURL(originalImageFile);
            
            downloadBtn.disabled = true;
            processedImageData = null;
        }
    }

    function showLoading() {
        loadingOverlay.classList.remove('d-none');
    }
    
    function hideLoading() {
        loadingOverlay.classList.add('d-none');
    }

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

    initializeTabs();
});