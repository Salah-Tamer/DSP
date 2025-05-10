document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const effectToggles = document.querySelectorAll('.effect-toggle');
    const effectSliders = document.querySelectorAll('.effect-slider');
    const activeCountBadge = document.getElementById('active-count');
    const activeEffectsContainer = document.getElementById('active-effects-container');
    const clearBtn = document.getElementById('clear-btn');

    const effectIcons = {
        'blur': 'droplet',
        'brightness': 'sun',
        'contrast': 'circle',
        'grayscale': 'eye'
    };

    effectToggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const effectId = this.id.replace('-toggle', '');
            const slider = document.getElementById(`${effectId}-slider`);
            
            if (this.checked) {
                slider.disabled = false;
                addToActiveEffects(effectId);
            } else {
                // Disable slider when effect is toggled off
                slider.disabled = true;
                slider.value = getDefaultValue(effectId);
                // Remove from active effects
                removeFromActiveEffects(effectId);
            }
            
            updateActiveCount();
        });
    });

    effectSliders.forEach(slider => {
        slider.addEventListener('input', function() {
            const effectId = this.id.replace('-slider', '');
            updateActiveEffectValue(effectId, this.value);
        });
    });

    clearBtn.addEventListener('click', clearAllEffects);

    function addToActiveEffects(effectId) {
        const slider = document.getElementById(`${effectId}-slider`);
        const value = slider.value;
        const displayName = effectId.charAt(0).toUpperCase() + effectId.slice(1);
        const icon = effectIcons[effectId] || 'sliders';
        
        if (document.getElementById(`active-${effectId}`)) {
            return;
        }
        
        const activeEffect = document.createElement('div');
        activeEffect.id = `active-${effectId}`;
        activeEffect.className = 'active-effect';
        activeEffect.innerHTML = `
            <div class="active-effect-header">
                <span><i data-feather="${icon}"></i> ${displayName}</span>
                <button class="btn btn-sm btn-link text-danger remove-effect" data-effect="${effectId}">
                    <i data-feather="x"></i>
                </button>
            </div>
            <input type="range" class="form-range active-effect-slider" 
                   min="${slider.min}" max="${slider.max}" step="${slider.step}" 
                   value="${value}" data-effect="${effectId}">
        `;
        
        const noEffectsMsg = activeEffectsContainer.querySelector('p');
        if (noEffectsMsg) {
            activeEffectsContainer.removeChild(noEffectsMsg);
        }
        
        // Add to active effects container
        activeEffectsContainer.appendChild(activeEffect);
        
        // Initialize feather icons
        feather.replace();
        
        const removeBtn = activeEffect.querySelector('.remove-effect');
        removeBtn.addEventListener('click', function() {
            const effectId = this.getAttribute('data-effect');
            const toggle = document.getElementById(`${effectId}-toggle`);
            toggle.checked = false;
            const slider = document.getElementById(`${effectId}-slider`);
            slider.disabled = true;
            slider.value = getDefaultValue(effectId);
            removeFromActiveEffects(effectId);
            updateActiveCount();
        });
        
        const activeSlider = activeEffect.querySelector('.active-effect-slider');
        activeSlider.addEventListener('input', function() {
            const effectId = this.getAttribute('data-effect');
            const value = this.value;
            // Update the original slider to keep them in sync
            document.getElementById(`${effectId}-slider`).value = value;
        });
    }

    function removeFromActiveEffects(effectId) {
        const activeEffect = document.getElementById(`active-${effectId}`);
        if (activeEffect) {
            activeEffectsContainer.removeChild(activeEffect);
            
            // Add "No active effects" message if no effects are active
            if (activeEffectsContainer.children.length === 0) {
                const noEffectsMsg = document.createElement('p');
                noEffectsMsg.className = 'text-center text-muted my-4';
                noEffectsMsg.textContent = 'No active effects';
                activeEffectsContainer.appendChild(noEffectsMsg);
            }
        }
    }

    function updateActiveEffectValue(effectId, value) {
        const activeSlider = document.querySelector(`.active-effect-slider[data-effect="${effectId}"]`);
        if (activeSlider) {
            activeSlider.value = value;
        }
    }

    function updateActiveCount() {
        const activeCount = document.querySelectorAll('.effect-toggle:checked').length;
        activeCountBadge.textContent = activeCount;
    }

    function getDefaultValue(effectId) {
        switch(effectId) {
            case 'blur':
                return 0;
            case 'brightness':
                return 0;
            case 'contrast':
                return 0;
            case 'grayscale':
                return 0;
            default:
                return 0;
        }
    }

    window.getActiveEffects = function() {
        const activeEffects = [];
        
        effectToggles.forEach(toggle => {
            if (toggle.checked) {
                const effectId = toggle.id.replace('-toggle', '');
                const value = parseFloat(document.getElementById(`${effectId}-slider`).value);
                
                activeEffects.push({
                    name: effectId,
                    value: value
                });
            }
        });
        
        return activeEffects;
    };

    window.clearAllEffects = function() {
        effectToggles.forEach(toggle => {
            toggle.checked = false;
        });
        
        effectSliders.forEach(slider => {
            slider.disabled = true;
            slider.value = getDefaultValue(slider.id.replace('-slider', ''));
        });
        
        // Clear active effects
        activeEffectsContainer.innerHTML = '<p class="text-center text-muted my-4">No active effects</p>';
        
        updateActiveCount();
    };
});
