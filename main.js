// Simulate Real-Time Player Count
const statusEl = document.getElementById('player-count');
let count = 136; // Start with the number from the user's initial request

function updatePlayerCount() {
    // Fluctuate count slightly to look alive
    const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
    count += change;

    // Limits
    if (count > 200) count = 200;
    if (count < 80) count = 80;

    // Update ONLY the number for the new design
    statusEl.innerText = count;
}

// Update every 3 seconds
setInterval(updatePlayerCount, 3000);
updatePlayerCount();

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (window.scrollY > 50) {
        nav.style.background = 'rgba(18, 18, 18, 0.95)';
        nav.style.padding = '15px 5%';
    } else {
        nav.style.background = 'transparent';
        nav.style.padding = '25px 5%';
    }
});

// Simple Scroll Animation for Sections
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = 1;
            entry.target.style.transform = 'translateY(0)';
        }
    });
});

document.querySelectorAll('.server-card, .staff-card').forEach((el) => {
    el.style.opacity = 0;
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.6s ease-out';
    observer.observe(el);
});
