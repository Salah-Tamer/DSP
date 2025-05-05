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

    // Check if we're running from a server or directly from file system
    const isRunningFromServer = window.location.protocol !== 'file:';

    // If running from file system, show a warning
    if (!isRunningFromServer) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'alert alert-warning';
        warningDiv.style.position = 'fixed';
        warningDiv.style.top = '10px';
        warningDiv.style.left = '50%';
        warningDiv.style.transform = 'translateX(-50%)';
        warningDiv.style.zIndex = '9999';
        warningDiv.style.width = '80%';
        warningDiv.style.maxWidth = '600px';
        warningDiv.style.textAlign = 'center';
        warningDiv.innerHTML = '<strong>Warning:</strong> This application needs to be run from a web server to function properly. Please use the simple_server.py script to start a local server.';
        document.body.appendChild(warningDiv);
    }

    // Canvas Context
    const ctx = outputCanvas.getContext('2d');

    // State
    let originalImage = null;
    let fileId = null;
    let debounceTimer = null;
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
            // Show loading indicator or disable buttons
            downloadBtn.disabled = true;
            clearAllBtn.disabled = true;
            applyAllBtn.disabled = true;

            // Reset all effects when new image is uploaded
            clearAllEffects();

            // Create object URL for the uploaded file
            const objectUrl = URL.createObjectURL(e.target.files[0]);

            // Display source image
            sourceImage.src = objectUrl;
            sourceImage.style.display = 'block';
            sourcePlaceholder.style.display = 'none';

            // Create a new image object for the canvas
            originalImage = new Image();
            originalImage.crossOrigin = "anonymous";

            originalImage.onload = function() {
                // Setup canvas
                outputCanvas.width = originalImage.width;
                outputCanvas.height = originalImage.height;
                outputCanvas.style.display = 'block';
                outputPlaceholder.style.display = 'none';

                // Draw original image on canvas
                ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
                ctx.drawImage(originalImage, 0, 0);

                // Enable buttons
                downloadBtn.disabled = false;
                clearAllBtn.disabled = false;
                applyAllBtn.disabled = false;
            };

            // Set the source of the original image
            originalImage.src = objectUrl;
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

            // Update UI immediately
            updateActiveCount();

            // Debounce the server request
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                applyEffects();
            }, 300);
        });
    });

    // Range input listeners

    document.getElementById('blurRange').addEventListener('input', function() {
        const value = this.value;
        document.getElementById('blurValue').textContent = `${value}px`;
        activeEffects.blur.value = parseInt(value);

        // Update UI immediately
        updateActiveTabValues('blur', value);

        // Debounce the server request
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            applyEffects();
        }, 300);
    });

    document.getElementById('brightnessRange').addEventListener('input', function() {
        const value = this.value;
        document.getElementById('brightnessValue').textContent = `${value}%`;
        activeEffects.brightness.value = parseInt(value);

        // Update UI immediately
        updateActiveTabValues('brightness', value);

        // Debounce the server request
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            applyEffects();
        }, 300);
    });

    document.getElementById('contrastRange').addEventListener('input', function() {
        const value = this.value;
        document.getElementById('contrastValue').textContent = `${value}%`;
        activeEffects.contrast.value = parseInt(value);

        // Update UI immediately
        updateActiveTabValues('contrast', value);

        // Debounce the server request
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            applyEffects();
        }, 300);
    });

    document.getElementById('grayscaleRange').addEventListener('input', function() {
        const value = this.value;
        document.getElementById('grayscaleValue').textContent = `${value}%`;
        activeEffects.grayscale.value = parseInt(value);

        // Update UI immediately
        updateActiveTabValues('grayscale', value);

        // Debounce the server request
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            applyEffects();
        }, 300);
    });

    // Button listeners
    clearAllBtn.addEventListener('click', clearAllEffects);

    applyAllBtn.addEventListener('click', function() {
        // Disable the button while processing
        applyAllBtn.disabled = true;

        // Show success indicator
        const originalText = applyAllBtn.innerHTML;
        applyAllBtn.innerHTML = '<i class="fas fa-check me-1"></i> Applied';

        setTimeout(() => {
            applyAllBtn.innerHTML = originalText;
            // Re-enable the button
            applyAllBtn.disabled = false;
        }, 2000);
    });

    downloadBtn.addEventListener('click', function() {
        // Disable the button while processing
        downloadBtn.disabled = true;

        // Prepare the effects data for the server
        const effectsList = prepareEffectsForServer();

        // Convert canvas to blob with specified MIME type (image/png)
        outputCanvas.toBlob(function(blob) {
            // Create FormData object
            const formData = new FormData();

            // Add the image blob as a file
            formData.append('image', blob, 'image.png');

            // Add the effects as a JSON string
            formData.append('effects', JSON.stringify(effectsList));

            // Get the full URL for the process endpoint
            let processUrl;
            if (isRunningFromServer) {
                processUrl = new URL('/process', window.location.origin).href;
            } else {
                processUrl = 'http://localhost:8000/process';
            }

            // Send to server for processing with improved CORS settings
            fetch(processUrl, {
                method: 'POST',
                body: formData,
                mode: 'cors',
                credentials: 'include'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Processing failed');
                }
                return response.json();
            })
            .then(data => {
                // Download the processed image
                if (data.image) {
                    // Create a temporary link element
                    const link = document.createElement('a');

                    // Generate a timestamp for the filename
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);

                    // Set the download attributes
                    link.download = `sorafy_processed_${timestamp}.png`;

                    // Set the href to the processed image
                    link.href = 'data:image/png;base64,' + data.image;

                    // Append to the document
                    document.body.appendChild(link);

                    // Trigger the download
                    link.click();

                    // Clean up
                    document.body.removeChild(link);
                }

                // Re-enable the button
                downloadBtn.disabled = false;
            })
            .catch(error => {
                console.error('Error processing image:', error);
                alert('Error processing image: ' + error.message);

                // Re-enable the button
                downloadBtn.disabled = false;
            });
        }, 'image/png');
    });

    // Helper function to prepare effects data for the server
    function prepareEffectsForServer() {
        const effectsList = [];

        // Loop through all active effects
        for (const effectName in activeEffects) {
            if (activeEffects[effectName].active) {
                // Create an effect object with the necessary parameters
                const effect = {
                    id: effectName,
                    params: {}
                };

                // Add the appropriate parameter based on the effect type
                if (effectName === 'blur') {
                    effect.params.radius = activeEffects[effectName].value;
                } else if (effectName === 'grayscale') {
                    effect.params.intensity = activeEffects[effectName].value;
                } else if (['brightness', 'contrast'].includes(effectName)) {
                    effect.params.factor = activeEffects[effectName].value;
                }

                // Add the effect to the list
                effectsList.push(effect);
            }
        }

        return effectsList;
    }

    // Test function to check server connectivity
    function testServerConnection() {
        console.log('Testing server connection...');

        // Create FormData object
        const formData = new FormData();
        formData.append('data', 'test data');

        // Get the full URL for the test endpoint
        let testUrl;
        if (isRunningFromServer) {
            testUrl = new URL('/test', window.location.origin).href;
        } else {
            testUrl = 'http://localhost:8000/test';
        }
        console.log('Sending test request to:', testUrl);

        // Send test request with improved error handling
        fetch(testUrl, {
            method: 'POST',
            body: formData,
            // Add mode and credentials for CORS
            mode: 'cors',
            credentials: 'include'
        })
        .then(response => {
            console.log('Test response status:', response.status);
            console.log('Test response headers:', [...response.headers.entries()]);

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            // Check if response has content
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server did not return JSON');
            }

            return response.json();
        })
        .then(data => {
            console.log('Test response data:', data);
            alert(`Server connection test successful!\nServer: ${data.server}\nTimestamp: ${data.timestamp}`);
        })
        .catch(error => {
            console.error('Test error:', error);
            alert('Server connection test failed: ' + error.message);
        });
    }

    // Add test button if in development mode
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const testBtn = document.createElement('button');
        testBtn.textContent = 'Test Server';
        testBtn.className = 'btn btn-secondary';
        testBtn.style.position = 'fixed';
        testBtn.style.bottom = '10px';
        testBtn.style.right = '10px';
        testBtn.style.zIndex = '1000';
        testBtn.addEventListener('click', testServerConnection);
        document.body.appendChild(testBtn);
    }

    // Functions
    function applyEffects() {
        if (!originalImage) return;

        // Check if we have any active effects
        const hasActiveEffects = Object.values(activeEffects).some(effect => effect.active);

        // If no active effects, just show the original image
        if (!hasActiveEffects) {
            // Reset canvas
            ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
            ctx.drawImage(originalImage, 0, 0);
            outputCanvas.style.filter = 'none';
            return;
        }

        // Prepare the effects data for the server
        const effectsList = prepareEffectsForServer();

        // Show loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
        loadingIndicator.style.position = 'absolute';
        loadingIndicator.style.top = '50%';
        loadingIndicator.style.left = '50%';
        loadingIndicator.style.transform = 'translate(-50%, -50%)';
        loadingIndicator.style.zIndex = '1000';

        const outputContainer = outputCanvas.parentElement;
        outputContainer.style.position = 'relative';
        outputContainer.appendChild(loadingIndicator);

        // Convert canvas to blob with specified MIME type (image/png)
        outputCanvas.toBlob(function(blob) {
            // Create FormData object
            const formData = new FormData();

            // Add the image blob as a file
            formData.append('image', blob, 'image.png');

            // Add the effects as a JSON string
            formData.append('effects', JSON.stringify(effectsList));

            // Get the full URL for the process endpoint
            let processUrl;
            if (isRunningFromServer) {
                processUrl = new URL('/process', window.location.origin).href;
            } else {
                processUrl = 'http://localhost:8000/process';
            }

            // Send to server for processing with improved CORS settings
            fetch(processUrl, {
                method: 'POST',
                body: formData,
                mode: 'cors',
                credentials: 'include'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Processing failed');
                }
                return response.json();
            })
            .then(data => {
                // Remove loading indicator
                outputContainer.removeChild(loadingIndicator);

                // Load the processed image onto the canvas
                if (data.image) {
                    const img = new Image();
                    img.onload = function() {
                        // Reset any CSS filters
                        outputCanvas.style.filter = 'none';

                        // Draw the processed image
                        ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
                        ctx.drawImage(img, 0, 0);
                    };
                    img.src = 'data:image/png;base64,' + data.image;
                }
            })
            .catch(error => {
                console.error('Error applying effects:', error);

                // Remove loading indicator
                if (outputContainer.contains(loadingIndicator)) {
                    outputContainer.removeChild(loadingIndicator);
                }

                // Show original image on error
                ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
                ctx.drawImage(originalImage, 0, 0);
                outputCanvas.style.filter = 'none';
            });
        }, 'image/png');
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