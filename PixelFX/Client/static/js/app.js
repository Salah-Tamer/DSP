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
    
    let originalImageData = null;
    let currentFileName = '';
    
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleImageUpload);
    downloadBtn.addEventListener('click', downloadProcessedImage);
    applyBtn.addEventListener('click', applyEffects);
    clearBtn.addEventListener('click', clearAllEffects);
    
    async function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        currentFileName = file.name;
        
        showLoading();
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Failed to upload image');
            }
            
            const data = await response.json();
            originalImageData = data;
            
            originalImage.src = `data:image/jpeg;base64,${data.image}`;
            originalImage.style.display = 'block';
            uploadPlaceholder.style.display = 'none';
            
            downloadBtn.disabled = true;
            enableEffectsUI();
            
            processedImage.style.display = 'none';
            effectPlaceholder.style.display = 'flex';
            
            clearAllEffects();
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            hideLoading();
        }
    }
    
    async function applyEffects() {
        if (!originalImageData) {
            alert('Please upload an image first');
            return;
        }
        
        const activeEffects = getActiveEffects();
        
        if (activeEffects.length === 0) {
            alert('Please activate at least one effect');
            return;
        }
        
        showLoading();
        
        try {
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
            
            processedImage.src = `data:image/jpeg;base64,${data.processed_image}`;
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
    
    async function downloadProcessedImage() {
        if (processedImage.style.display === 'none') {
            alert('No processed image to download');
            return;
        }
        
        const link = document.createElement('a');
        
        const extension = currentFileName.split('.').pop();
        const filenameWithoutExt = currentFileName.replace(`.${extension}`, '');
        
        link.download = `${filenameWithoutExt}_edited.${extension}`;
        link.href = processedImage.src;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    function enableEffectsUI() {
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
    
    function initializeUI() {
        const triggerTabList = [].slice.call(document.querySelectorAll('#effects-tabs a'));
        triggerTabList.forEach(function (triggerEl) {
            const tabTrigger = new bootstrap.Tab(triggerEl);
            
            triggerEl.addEventListener('click', function (event) {
                event.preventDefault();
                tabTrigger.show();
            });
        });
    }
    
    initializeUI();
});
