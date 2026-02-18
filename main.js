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

// --- STEAM LOGIN LOGIC (Client-Side) ---

function loginWithSteam() {
    // Current URL (handles localhost, GitHub Pages, or custom domain automatically)
    const returnUrl = window.location.href.split('?')[0];

    // Construct OpenID 2.0 URL
    const params = {
        'openid.ns': 'http://specs.openid.net/auth/2.0',
        'openid.mode': 'checkid_setup',
        'openid.return_to': returnUrl,
        'openid.realm': returnUrl,
        'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
        'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
    };

    const searchParams = new URLSearchParams(params);
    window.location.href = 'https://steamcommunity.com/openid/login?' + searchParams.toString();
}

function logoutSteam() {
    localStorage.removeItem('steamID');
    updateLoginUI();
    // Optional: Reload page
    window.location.reload();
}

function handleSteamCallback() {
    const urlParams = new URLSearchParams(window.location.search);

    // Check if returning from Steam
    if (urlParams.has('openid.mode') && urlParams.get('openid.mode') === 'id_res') {
        const claimedId = urlParams.get('openid.claimed_id');
        if (claimedId) {
            // Extract SteamID64 from the URL
            const steamID = claimedId.split('/').pop();

            if (steamID && /^\d{17}$/.test(steamID)) {
                localStorage.setItem('steamID', steamID);
                console.log('Logged in with SteamID:', steamID);

                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }
}

function updateLoginUI() {
    const steamID = localStorage.getItem('steamID');
    const loginBtn = document.querySelector('.btn-login');

    if (loginBtn) {
        if (steamID) {
            // Logged In State
            loginBtn.innerHTML = `<i class="fa-brands fa-steam"></i> ${steamID} (ÇIKIŞ)`;
            loginBtn.href = "javascript:void(0)";
            loginBtn.onclick = logoutSteam;
            loginBtn.classList.add('logged-in');
        } else {
            // Logged Out State
            loginBtn.innerHTML = `<i class="fa-brands fa-steam"></i> STEAM İLE GİRİŞ`;
            loginBtn.href = "javascript:void(0)";
            loginBtn.onclick = loginWithSteam;
            loginBtn.classList.remove('logged-in');
        }
    }
}

// Initialize Logic
window.addEventListener('DOMContentLoaded', () => {
    handleSteamCallback(); // Check if we just came back from Steam
    updateLoginUI();       // Update button state
});
