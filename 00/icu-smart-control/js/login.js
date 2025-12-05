// Login Page JavaScript

// Demo credentials for different roles
const demoCredentials = {
    doctor: {
        username: 'doctor',
        password: 'doctor123',
        role: 'Doctor'
    },
    nurse: {
        username: 'nurse',
        password: 'nurse123',
        role: 'Nurse'
    },
    admin: {
        username: 'admin',
        password: 'admin123',
        role: 'Administrator'
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeLoginPage();
});

function initializeLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const demoBtns = document.querySelectorAll('.demo-btn');

    // Handle form submission
    loginForm.addEventListener('submit', handleLogin);

    // Toggle password visibility
    togglePassword.addEventListener('click', togglePasswordVisibility);

    // Demo credential buttons
    demoBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const role = btn.dataset.role;
            fillDemoCredentials(role);
        });
    });

    // Check if already logged in
    checkExistingSession();
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;

    // Validate inputs
    if (!username || !password) {
        showStatusMessage('Please enter both username and password', 'error');
        return;
    }

    // Show loading state
    const loginButton = document.getElementById('loginButton');
    const btnText = loginButton.querySelector('.btn-text');
    const btnLoader = loginButton.querySelector('.btn-loader');

    loginButton.classList.add('loading');
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Verify credentials
    const isValid = verifyCredentials(username, password);

    if (isValid) {
        // Store session
        const sessionData = {
            username: username,
            role: isValid.role,
            loginTime: new Date().toISOString()
        };

        if (remember) {
            localStorage.setItem('icuSession', JSON.stringify(sessionData));
        } else {
            sessionStorage.setItem('icuSession', JSON.stringify(sessionData));
        }

        showStatusMessage(`Welcome back, ${isValid.role}!`, 'success');

        // Redirect to dashboard after short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } else {
        // Reset button state
        loginButton.classList.remove('loading');
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';

        showStatusMessage('Invalid username or password', 'error');

        // Shake animation for error
        loginButton.style.animation = 'shake 0.5s';
        setTimeout(() => {
            loginButton.style.animation = '';
        }, 500);
    }
}

// Verify user credentials
function verifyCredentials(username, password) {
    // Check against demo credentials
    for (const [key, creds] of Object.entries(demoCredentials)) {
        if (username === creds.username && password === creds.password) {
            return { role: creds.role };
        }
    }

    // In a real application, this would make an API call to verify credentials
    return false;
}

// Toggle password visibility
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.getElementById('togglePassword');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleBtn.textContent = '👁️';
    }
}

// Fill demo credentials
function fillDemoCredentials(role) {
    const credentials = demoCredentials[role];

    if (credentials) {
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        // Animate the filling
        usernameInput.value = '';
        passwordInput.value = '';

        // Type animation for username
        typeText(usernameInput, credentials.username, 50, () => {
            // Type animation for password
            typeText(passwordInput, credentials.password, 50);
        });

        showStatusMessage(`Demo credentials loaded for ${credentials.role}`, 'success');
    }
}

// Type text animation
function typeText(element, text, speed, callback) {
    let i = 0;
    const interval = setInterval(() => {
        if (i < text.length) {
            element.value += text.charAt(i);
            i++;
        } else {
            clearInterval(interval);
            if (callback) callback();
        }
    }, speed);
}

// Show status message
function showStatusMessage(message, type = 'info') {
    const statusDiv = document.getElementById('statusMessage');

    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
    statusDiv.style.display = 'block';

    // Auto-hide after 3 seconds
    setTimeout(() => {
        statusDiv.style.opacity = '0';
        setTimeout(() => {
            statusDiv.style.display = 'none';
            statusDiv.style.opacity = '1';
        }, 300);
    }, 3000);
}

// Check for existing session
function checkExistingSession() {
    const localSession = localStorage.getItem('icuSession');
    const sessionSession = sessionStorage.getItem('icuSession');

    if (localSession || sessionSession) {
        const session = JSON.parse(localSession || sessionSession);

        // Check if session is still valid (less than 24 hours old)
        const loginTime = new Date(session.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);

        if (hoursDiff < 24) {
            showStatusMessage('Existing session found. Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            // Clear expired session
            localStorage.removeItem('icuSession');
            sessionStorage.removeItem('icuSession');
        }
    }
}

// Add shake animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Console log for debugging
console.log('ICU Smart Control - Login Page Initialized');
console.log('Demo Credentials Available:');
console.log('Doctor: username="doctor", password="doctor123"');
console.log('Nurse: username="nurse", password="nurse123"');
console.log('Admin: username="admin", password="admin123"');
