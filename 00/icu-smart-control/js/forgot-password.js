// Forgot Password Page JavaScript

// User database with emails (in real app, this would be on the server)
const userDatabase = {
    'doctor@icu.com': {
        username: 'doctor',
        role: 'Doctor'
    },
    'nurse@icu.com': {
        username: 'nurse',
        role: 'Nurse'
    },
    'admin@icu.com': {
        username: 'admin',
        role: 'Administrator'
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeForgotPasswordPage();
});

function initializeForgotPasswordPage() {
    const form = document.getElementById('forgotPasswordForm');
    form.addEventListener('submit', handleForgotPassword);
}

// Handle forgot password form submission
async function handleForgotPassword(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();

    // Validate email
    if (!email || !isValidEmail(email)) {
        showStatusMessage('Please enter a valid email address', 'error');
        return;
    }

    // Show loading state
    const resetButton = document.getElementById('resetButton');
    const btnText = resetButton.querySelector('.btn-text');
    const btnLoader = resetButton.querySelector('.btn-loader');

    resetButton.classList.add('loading');
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if email exists
    const userExists = userDatabase[email];

    if (userExists) {
        // Send reset email (simulated)
        sendResetEmail(email, userExists);

        // Show success message
        document.getElementById('successMessage').style.display = 'block';
        document.getElementById('forgotPasswordForm').querySelector('.form-group').style.display = 'none';
        resetButton.style.display = 'none';

        showStatusMessage('Reset link sent successfully!', 'success');

        // Log to console (in real app, this would send actual email)
        console.log('Password reset email sent to:', email);
        console.log('User:', userExists.username, '(' + userExists.role + ')');

    } else {
        // Reset button state
        resetButton.classList.remove('loading');
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';

        // For security, we still show success even if email doesn't exist
        // But in this demo, we'll show an error
        showStatusMessage('Email not found in our system', 'error');
    }
}

// Send reset email (simulated)
function sendResetEmail(email, user) {
    // Generate reset token (in real app, this would be done on server)
    const resetToken = generateResetToken();
    const resetLink = `${window.location.origin}/reset-password.html?token=${resetToken}`;

    // Store reset token (in real app, this would be in database)
    const resetData = {
        email: email,
        token: resetToken,
        timestamp: new Date().toISOString(),
        expiresIn: '1 hour'
    };

    localStorage.setItem('passwordReset_' + email, JSON.stringify(resetData));

    // Simulate email content
    const emailContent = `
        Dear ${user.role},
        
        We received a request to reset your password for ICU Smart Control System.
        
        Click the link below to reset your password:
        ${resetLink}
        
        This link will expire in 1 hour.
        
        If you didn't request this, please ignore this email.
        
        Best regards,
        ICU Smart Control Team
    `;

    // Log email (in real app, this would use email service like SendGrid, AWS SES, etc.)
    console.log('=== EMAIL SENT ===');
    console.log('To:', email);
    console.log('Subject: Reset Your Password - ICU Smart Control');
    console.log('Content:', emailContent);
    console.log('==================');

    // Show in alert for demo purposes
    alert(`📧 Email Sent!\n\nTo: ${email}\n\nReset Link:\n${resetLink}\n\n(Check console for full email content)`);
}

// Generate random reset token
function generateResetToken() {
    return 'reset_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

// Console log for debugging
console.log('Forgot Password Page Initialized');
console.log('Available emails for demo:');
console.log('- doctor@icu.com');
console.log('- nurse@icu.com');
console.log('- admin@icu.com');
