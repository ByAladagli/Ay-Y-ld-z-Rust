// Real-Time Server Stats with BattleMetrics API
const statusEl = document.getElementById('player-count');
const serverStatusEl = document.getElementById('server-status');
const capacityEl = document.getElementById('server-capacity');

// Server Info
const SERVER_IP = '91.124.63.80';
const SERVER_PORT = '28025';

async function fetchServerStats() {
    try {
        // Using BattleMetrics API to find the server by IP and Port
        const response = await fetch(`https://api.battlemetrics.com/servers?filter[ip]=${SERVER_IP}&filter[port]=${SERVER_PORT}`);
        const data = await response.json();

        if (data && data.data && data.data.length > 0) {
            const server = data.data[0];
            const players = server.attributes.players;
            const maxPlayers = server.attributes.maxPlayers;
            const status = server.attributes.status; // 'online' or 'offline'

            // Update Player Count
            statusEl.innerText = players;

            // Update Capacity
            if (capacityEl) capacityEl.innerText = maxPlayers;

            // Update Status Badge
            if (serverStatusEl) {
                if (status === 'online') {
                    serverStatusEl.innerText = 'ONLINE';
                    serverStatusEl.style.background = '#28a745'; // Green
                    serverStatusEl.classList.remove('offline');
                } else {
                    serverStatusEl.innerText = 'OFFLINE';
                    serverStatusEl.style.background = '#dc3545'; // Red
                    serverStatusEl.classList.add('offline');
                }
            }
        } else {
            console.warn('Server not found on BattleMetrics, using default/cached values.');
            // Fallback strategy if needed, or just leave defaults
        }
    } catch (error) {
        console.error('Error fetching server stats:', error);
        // On error, maybe show '?' or keep default
    }
}

// Fetch immediately and then every 30 seconds
fetchServerStats();
setInterval(fetchServerStats, 30000);

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
