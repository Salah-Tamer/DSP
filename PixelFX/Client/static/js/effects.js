document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const effectToggles = document.querySelectorAll('.effect-toggle');
    const effectSliders = document.querySelectorAll('.effect-slider');
    const activeCountBadge = document.getElementById('active-count');
    const activeEffectsContainer = document.getElementById('active-effects-container');
    const clearBtn = document.getElementById('clear-btn');

    // Mapping of effects to their corresponding icons
    const effectIcons = {
        'blur': 'droplet',
        'brightness': 'sun',
        'contrast': 'circle',
        'grayscale': 'eye'
    };

    // Event listeners for effect toggles
    effectToggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const effectId = this.id.replace('-toggle', '');
            const slider = document.getElementById(`${effectId}-slider`);
            
            if (this.checked) {
                // Enable slider when effect is toggled on
                slider.disabled = false;
                // Add to active effects
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

    // Event listeners for effect sliders
    effectSliders.forEach(slider => {
        slider.addEventListener('input', function() {
            const effectId = this.id.replace('-slider', '');
            updateActiveEffectValue(effectId, this.value);
        });
    });

    // Clear all effects
    clearBtn.addEventListener('click', clearAllEffects);

    // Add effect to active effects tab
    function addToActiveEffects(effectId) {
        const slider = document.getElementById(`${effectId}-slider`);
        const value = slider.value;
        const displayName = effectId.charAt(0).toUpperCase() + effectId.slice(1);
        const icon = effectIcons[effectId] || 'sliders';
        
        // Check if this effect is already in active effects
        if (document.getElementById(`active-${effectId}`)) {
            return;
        }
        
        // Create active effect element
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
        
        // Clear "No active effects" message if it exists
        const noEffectsMsg = activeEffectsContainer.querySelector('p');
        if (noEffectsMsg) {
            activeEffectsContainer.removeChild(noEffectsMsg);
        }
        
        // Add to active effects container
        activeEffectsContainer.appendChild(activeEffect);
        
        // Initialize feather icons
        feather.replace();
        
        // Add event listeners for the active effect
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

    // Remove effect from active effects tab
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

    // Update the value of an active effect
    function updateActiveEffectValue(effectId, value) {
        const activeSlider = document.querySelector(`.active-effect-slider[data-effect="${effectId}"]`);
        if (activeSlider) {
            activeSlider.value = value;
        }
    }

    // Update the active effects count badge
    function updateActiveCount() {
        const activeCount = document.querySelectorAll('.effect-toggle:checked').length;
        activeCountBadge.textContent = activeCount;
    }

    // Get default value for an effect slider
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

    // Get active effects with their values
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

    // Clear all effects
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
        
        // Update count
        updateActiveCount();
    };
});
