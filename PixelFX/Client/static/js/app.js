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
    
    // Global variables
    let originalImageData = null;
    let currentFileName = '';
    
    // Event Listeners
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleImageUpload);
    downloadBtn.addEventListener('click', downloadProcessedImage);
    applyBtn.addEventListener('click', applyEffects);
    clearBtn.addEventListener('click', clearAllEffects);
    
    // Upload image handler
    async function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        currentFileName = file.name;
        
        // Display loading state
        showLoading();
        
        // Create FormData to send the file
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            // Upload the image to the server
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Failed to upload image');
            }
            
            const data = await response.json();
            originalImageData = data;
            
            // Display original image
            originalImage.src = `data:image/jpeg;base64,${data.image}`;
            originalImage.style.display = 'block';
            uploadPlaceholder.style.display = 'none';
            
            // Enable UI elements
            downloadBtn.disabled = true;
            enableEffectsUI();
            
            // Clear any existing processed image
            processedImage.style.display = 'none';
            effectPlaceholder.style.display = 'flex';
            
            // Clear any existing effects
            clearAllEffects();
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            hideLoading();
        }
    }
    
    // Apply effects handler
    async function applyEffects() {
        if (!originalImageData) {
            alert('Please upload an image first');
            return;
        }
        
        // Get active effects with their values
        const activeEffects = getActiveEffects();
        
        if (activeEffects.length === 0) {
            alert('Please activate at least one effect');
            return;
        }
        
        showLoading();
        
        try {
            // Send effects to the server for processing
            const response = await fetch('/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image_id: originalImageData.id,
                    effects: activeEffects
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to process image');
            }
            
            const data = await response.json();
            
            // Display processed image
            processedImage.src = `data:image/jpeg;base64,${data.processed_image}`;
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
    async function downloadProcessedImage() {
        if (processedImage.style.display === 'none') {
            alert('No processed image to download');
            return;
        }
        
        // Create download link from the processed image
        const link = document.createElement('a');
        
        // Get file extension from the original filename
        const extension = currentFileName.split('.').pop();
        const filenameWithoutExt = currentFileName.replace(`.${extension}`, '');
        
        // Create a new filename with "_edited" suffix
        link.download = `${filenameWithoutExt}_edited.${extension}`;
        link.href = processedImage.src;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Helper Functions
    function enableEffectsUI() {
        // Enable effect toggles
        document.querySelectorAll('.effect-toggle').forEach(toggle => {
            toggle.disabled = false;
        });
    }
    
    function showLoading() {
        loadingOverlay.classList.remove('d-none');
    }
    
    function hideLoading() {
        loadingOverlay.classList.add('d-none');
    }
    
    // Initialize UI state
    function initializeUI() {
        // Set up Bootstrap tab events
        const triggerTabList = [].slice.call(document.querySelectorAll('#effects-tabs a'));
        triggerTabList.forEach(function (triggerEl) {
            const tabTrigger = new bootstrap.Tab(triggerEl);
            
            triggerEl.addEventListener('click', function (event) {
                event.preventDefault();
                tabTrigger.show();
            });
        });
    }
    
    // Initialize the UI
    initializeUI();
});
