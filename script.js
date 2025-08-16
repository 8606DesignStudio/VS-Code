// Load episodes data with Firefox-compatible cache busting
// Episode data loading and initialization
let episodes = {};

async function loadEpisodes() {
    try {
        const module = await import('./data/generatedEpisodes.js?t=' + Math.random());
        episodes = module.episodes;
        updateEpisodeContent();
    } catch (error) {
        console.error('Failed to load episodes:', error);
        const fallbackModule = await import('./data/generatedEpisodes.js');
        episodes = fallbackModule.episodes;
        updateEpisodeContent();
    }
}

// Dial state and setup
let currentNumber = 0;
const maxEpisode = 146;

loadEpisodes();

// Initialize dial content in the existing element
document.getElementById('dial').textContent = String(currentNumber).padStart(3, '0');

const dialElement = document.getElementById('dial');

// Create invisible touch area for better mobile interaction
const touchArea = document.createElement('div');
touchArea.style.position = 'absolute';
touchArea.style.width = '225px';
touchArea.style.height = '150px';
touchArea.style.left = '50%';
touchArea.style.top = '50%';
touchArea.style.transform = 'translate(-50%, -50%)';
touchArea.style.zIndex = '10';

document.getElementById('dial').appendChild(touchArea);

// Shooting stars functionality
function createShootingStar() {
    const container = document.getElementById('shooting-stars-container');
    if (!container) return;
    
    const star = document.createElement('div');
    star.className = 'shooting-star';
    
    // Fixed starting position - top right area
    const startX = 90; // Start from right side of container
    const startY = 10; // Start from top of container
    
    star.style.left = startX + '%';
    star.style.top = startY + '%';
    
    // Fixed animation duration
    const duration = 2;
    star.style.animationDuration = duration + 's';
    
    // No delay - start immediately
    star.style.animationDelay = '0s';
    
    container.appendChild(star);
    
    // Add active class to trigger animation
    setTimeout(() => {
        star.classList.add('active');
    }, 10);
    
    // Remove star after animation completes
    star.addEventListener('animationend', () => {
        if (star.parentNode) {
            star.parentNode.removeChild(star);
        }
    });
}

// Generate shooting stars at uniform intervals
function startShootingStars() {
    setInterval(() => {
        createShootingStar();
    }, 1000); // Create a shooting star every 1 second
}

// Start shooting stars when page loads
window.addEventListener('load', () => {
    setTimeout(startShootingStars, 2000); // Wait 2 seconds after page load
});

// Event listeners
dialElement.addEventListener('click', () => spin());
touchArea.addEventListener('touchstart', (e) => handleTouchStart(e));
touchArea.addEventListener('touchmove', (e) => handleTouchMove(e));

// Wheel/scroll handling: keep scrolling active indefinitely while pointer is over the dial
let isPointerOverDial = false;
let wheelDeltaAccum = 0;
const WHEEL_STEP = 40; // pixels of deltaY per step (adjust sensitivity)
const WHEEL_RESET_TIMEOUT = 150; // ms to reset accumulated delta after pause
let wheelResetTimer = null;

function handlePointerEnter() {
    isPointerOverDial = true;
}

function handlePointerLeave() {
    isPointerOverDial = false;
    wheelDeltaAccum = 0;
    if (wheelResetTimer) {
        clearTimeout(wheelResetTimer);
        wheelResetTimer = null;
    }
}

// Track hover for both the visible dial and the invisible touch area
dialElement.addEventListener('pointerenter', handlePointerEnter);
dialElement.addEventListener('pointerleave', handlePointerLeave);
touchArea.addEventListener('pointerenter', handlePointerEnter);
touchArea.addEventListener('pointerleave', handlePointerLeave);

function handleWheel(e) {
    if (!isPointerOverDial) return; // only act when pointer is over the dial
    // prevent page from scrolling while interacting with the dial
    e.preventDefault();

    // Accumulate deltaY to support smooth touchpad scrolling
    wheelDeltaAccum += e.deltaY;

    const steps = Math.trunc(Math.abs(wheelDeltaAccum) / WHEEL_STEP);
    if (steps > 0) {
        const direction = wheelDeltaAccum > 0 ? 1 : -1;

        currentNumber = (currentNumber + direction * steps) % (maxEpisode + 1);
        if (currentNumber < 0) currentNumber += (maxEpisode + 1);

        updateDialOnly();
        updateEpisodeContent();

        // Keep remainder so very fast scrolls map to multiple steps correctly
        wheelDeltaAccum = wheelDeltaAccum % WHEEL_STEP;
    }

    // Reset accumulator shortly after scrolling stops
    if (wheelResetTimer) clearTimeout(wheelResetTimer);
    wheelResetTimer = setTimeout(() => { wheelDeltaAccum = 0; wheelResetTimer = null; }, WHEEL_RESET_TIMEOUT);
}

// Add a global wheel listener but keep it non-passive so we can prevent default when needed
window.addEventListener('wheel', handleWheel, { passive: false });

// Click handler for desktop
function spin() {
    currentNumber = (currentNumber + 1) % (maxEpisode + 1);
    updateDialOnly();
    updateEpisodeContent();
}

// Touch handling variables
let touchStartY = 0;
let touchStartX = 0;
const swipeSensitivity = 8;

// Touch event handlers
function handleTouchStart(e) {
    // Hide instruction arrow on first touch
    const arrow = document.querySelector('.instruction-arrow');
    if (arrow) {
        arrow.style.display = 'none';
    }
    
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    e.preventDefault();
}

function handleTouchMove(e) {
    const currentTouchX = e.touches[0].clientX;
    const totalDeltaX = currentTouchX - touchStartX;
    
    if (Math.abs(totalDeltaX) > swipeSensitivity) {
        // Determine direction: positive = right, negative = left
        const direction = totalDeltaX > 0 ? 1 : -1;
        
        // Apply single step change
        currentNumber = (currentNumber + direction) % (maxEpisode + 1);
        if (currentNumber < 0) {
            currentNumber += (maxEpisode + 1);
        }
        
        // Reset touch start position to prevent multiple changes
        touchStartX = currentTouchX;
        updateDialOnly();
        updateEpisodeContent();
    }
    
    e.preventDefault();
}

// Update functions
function updateDialOnly() {
    const dialElement = document.getElementById('dial');
    if (dialElement) dialElement.textContent = String(currentNumber).padStart(3, '0');
}

function updateEpisodeContent() {
    if (episodes.length === 0) {
        document.getElementById('episode').innerHTML = "Loading...";
    } else {
        document.getElementById('episode').innerHTML = episodes[currentNumber] || "";
    }
}