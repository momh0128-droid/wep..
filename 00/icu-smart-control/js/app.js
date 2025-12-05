// ICU Smart Control System - Main Application Logic

// Check authentication before loading the app
function checkAuthentication() {
  const localSession = localStorage.getItem('icuSession');
  const sessionSession = sessionStorage.getItem('icuSession');

  if (!localSession && !sessionSession) {
    // No session found, redirect to login
    window.location.href = 'login.html';
    return false;
  }

  const session = JSON.parse(localSession || sessionSession);

  // Check if session is still valid (less than 24 hours old)
  const loginTime = new Date(session.loginTime);
  const now = new Date();
  const hoursDiff = (now - loginTime) / (1000 * 60 * 60);

  if (hoursDiff >= 24) {
    // Session expired
    localStorage.removeItem('icuSession');
    sessionStorage.removeItem('icuSession');
    window.location.href = 'login.html';
    return false;
  }

  // Session is valid
  console.log(`Authenticated as: ${session.role} (${session.username})`);
  return true;
}

// State management
let currentPatients = [...patientsData];
let currentAlerts = [...alertsData];

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  // Check authentication first
  if (!checkAuthentication()) {
    return; // Stop initialization if not authenticated
  }

  initializeApp();
  startRealTimeUpdates();
});

// Initialize the application
function initializeApp() {
  updateCurrentTime();

  // Get user role
  const session = JSON.parse(localStorage.getItem('icuSession') || sessionStorage.getItem('icuSession'));
  const userRole = session ? session.role : 'Doctor';

  // Initialize based on role
  if (userRole === 'Nurse') {
    initializeNurseView();
  } else if (userRole === 'Administrator') {
    // Admin view - no alerts panel
    renderPatients();
    updateStats();
    hideAlertsPanel();
  } else {
    // Doctor view - full dashboard
    renderPatients();
    renderAlerts();
    updateStats();
  }

  setupNavigation();
  setupUserMenu();
  setupMedicationAlerts(); // Setup 10-minute medication alerts

  // Update time every second
  setInterval(updateCurrentTime, 1000);

  // Check medication alerts every minute
  setInterval(checkMedicationAlerts, 60000);
}

// Update current time display
function updateCurrentTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const dateString = now.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  document.getElementById('current-time').textContent = `${dateString} ${timeString}`;
}

// Render patient cards
function renderPatients() {
  const grid = document.getElementById('patients-grid');
  grid.innerHTML = '';

  currentPatients.forEach(patient => {
    const card = createPatientCard(patient);
    grid.appendChild(card);
  });
}

// Create a patient card element
function createPatientCard(patient) {
  const card = document.createElement('div');
  card.className = `patient-card ${patient.status}`;
  card.onclick = () => showPatientDetails(patient);

  card.innerHTML = `
    <div class="patient-header">
      <div class="patient-info">
        <h3>${patient.name}</h3>
        <div class="patient-meta">
          <span>👤 ${patient.age} years</span>
          <span>🛏️ ${patient.bedId}</span>
        </div>
      </div>
      <span class="status-badge ${patient.status}">
        ${patient.status}
      </span>
    </div>
    
    <div class="vitals-grid">
      <div class="vital-item">
        <span class="vital-label">Heart Rate</span>
        <div class="vital-value">
          ${patient.vitals.heartRate}
          <span class="vital-unit">bpm</span>
        </div>
      </div>
      
      <div class="vital-item">
        <span class="vital-label">SpO₂</span>
        <div class="vital-value">
          ${patient.vitals.spo2}
          <span class="vital-unit">%</span>
        </div>
      </div>
      
      <div class="vital-item">
        <span class="vital-label">Blood Pressure</span>
        <div class="vital-value">
          ${patient.vitals.bloodPressure.systolic}/${patient.vitals.bloodPressure.diastolic}
          <span class="vital-unit">mmHg</span>
        </div>
      </div>
      
      <div class="vital-item">
        <span class="vital-label">Temperature</span>
        <div class="vital-value">
          ${patient.vitals.temperature}
          <span class="vital-unit">°C</span>
        </div>
      </div>
    </div>
    
    <div class="ecg-preview">
      <div class="ecg-line"></div>
      <svg class="ecg-wave" viewBox="0 0 200 60" preserveAspectRatio="none">
        <path d="M0,30 L40,30 L42,10 L44,50 L46,30 L60,30 L100,30 L102,10 L104,50 L106,30 L120,30 L160,30 L162,10 L164,50 L166,30 L200,30" />
      </svg>
    </div>
  `;

  return card;
}

// Render alerts
function renderAlerts() {
  const panel = document.getElementById('alerts-panel');
  panel.innerHTML = '';
  panel.style.display = 'block'; // Ensure it's visible

  // Sort alerts by timestamp (newest first)
  const sortedAlerts = [...currentAlerts].sort((a, b) => b.timestamp - a.timestamp);

  sortedAlerts.forEach(alert => {
    const alertElement = createAlertElement(alert);
    panel.appendChild(alertElement);
  });
}

// Hide alerts panel (for admin)
function hideAlertsPanel() {
  const panel = document.getElementById('alerts-panel');
  if (panel) {
    panel.style.display = 'none';
  }
}

// Create an alert element
function createAlertElement(alert) {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert-item ${alert.type}`;

  alertDiv.innerHTML = `
    <div class="alert-header">
      <div class="alert-title">${alert.title}</div>
      <div class="alert-time">${alert.time}</div>
    </div>
    <div class="alert-message">
      <strong>${alert.patientName}</strong> (${alert.bedId})<br>
      ${alert.message}
    </div>
    <div class="alert-actions">
      <button class="btn btn-primary" onclick="acknowledgeAlert(${alert.id})">
        Acknowledge
      </button>
      <button class="btn btn-secondary" onclick="viewPatient(${alert.patientId})">
        View Patient
      </button>
    </div>
  `;

  return alertDiv;
}

// Update statistics
function updateStats() {
  const total = currentPatients.length;
  const stable = currentPatients.filter(p => p.status === 'stable').length;
  const warning = currentPatients.filter(p => p.status === 'warning').length;
  const critical = currentPatients.filter(p => p.status === 'critical').length;

  document.getElementById('total-patients').textContent = total;
  document.getElementById('stable-count').textContent = stable;
  document.getElementById('warning-count').textContent = warning;
  document.getElementById('critical-count').textContent = critical;
}

// Start real-time updates (simulated)
function startRealTimeUpdates() {
  // Update vitals every 3 seconds
  setInterval(() => {
    updateVitalsSimulation();
    renderPatients();
  }, 3000);

  // Check for new alerts every 10 seconds
  setInterval(() => {
    checkForNewAlerts();
  }, 10000);
}

// Simulate vital signs updates
function updateVitalsSimulation() {
  currentPatients.forEach(patient => {
    // Small random variations in vitals
    const variation = (base, range) => {
      return Math.round(base + (Math.random() - 0.5) * range);
    };

    // Update vitals with small variations
    patient.vitals.heartRate = variation(patient.vitals.heartRate, 5);
    patient.vitals.spo2 = Math.min(100, variation(patient.vitals.spo2, 2));
    patient.vitals.bloodPressure.systolic = variation(patient.vitals.bloodPressure.systolic, 5);
    patient.vitals.bloodPressure.diastolic = variation(patient.vitals.bloodPressure.diastolic, 3);
    patient.vitals.temperature = (patient.vitals.temperature + (Math.random() - 0.5) * 0.2).toFixed(1);

    // Update status based on vitals
    updatePatientStatus(patient);
  });

  updateStats();
}

// Update patient status based on vitals
function updatePatientStatus(patient) {
  const { heartRate, spo2, bloodPressure } = patient.vitals;

  // Critical conditions
  if (spo2 < 90 || heartRate > 120 || heartRate < 50 ||
    bloodPressure.systolic > 180 || bloodPressure.systolic < 90) {
    patient.status = 'critical';
  }
  // Warning conditions
  else if (spo2 < 94 || heartRate > 100 || heartRate < 60 ||
    bloodPressure.systolic > 140 || bloodPressure.systolic < 100) {
    patient.status = 'warning';
  }
  // Stable
  else {
    patient.status = 'stable';
  }
}

// Check for new alerts (simulated)
function checkForNewAlerts() {
  currentPatients.forEach(patient => {
    // Check for critical vitals
    if (patient.status === 'critical' && patient.vitals.spo2 < 90) {
      const existingAlert = currentAlerts.find(
        a => a.patientId === patient.id && a.type === 'critical'
      );

      if (!existingAlert) {
        addAlert({
          id: Date.now(),
          type: 'critical',
          patientId: patient.id,
          patientName: patient.name,
          bedId: patient.bedId,
          title: 'Critical Vitals Alert',
          message: `SpO2 at ${patient.vitals.spo2}%. Immediate attention required.`,
          time: 'Just now',
          timestamp: Date.now()
        });
      }
    }

    // Check for medication alerts (simulated)
    patient.medications.forEach(med => {
      if (med.status === 'due' || med.status === 'overdue') {
        const existingAlert = currentAlerts.find(
          a => a.patientId === patient.id && a.message.includes(med.name)
        );

        if (!existingAlert && Math.random() > 0.7) {
          addAlert({
            id: Date.now() + Math.random(),
            type: med.status === 'overdue' ? 'critical' : 'warning',
            patientId: patient.id,
            patientName: patient.name,
            bedId: patient.bedId,
            title: med.status === 'overdue' ? 'Medication Overdue' : 'Medication Due Soon',
            message: `${med.name} ${med.dose} is ${med.status}.`,
            time: 'Just now',
            timestamp: Date.now()
          });
        }
      }
    });
  });
}

// Add a new alert
function addAlert(alert) {
  currentAlerts.unshift(alert);
  renderAlerts();

  // Play notification sound (optional - commented out for now)
  // playNotificationSound();
}

// Acknowledge an alert
function acknowledgeAlert(alertId) {
  currentAlerts = currentAlerts.filter(a => a.id !== alertId);
  renderAlerts();
}

// View patient details
function viewPatient(patientId) {
  const patient = currentPatients.find(p => p.id === patientId);
  if (patient) {
    showPatientDetails(patient);
  }
}

// Show patient details (modal/detailed view)
function showPatientDetails(patient) {
  // Create a detailed view modal
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    backdrop-filter: blur(10px);
  `;

  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: 2rem;
    max-width: 800px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  `;

  modalContent.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 2rem;">
      <div>
        <h2 style="font-size: 2rem; margin-bottom: 0.5rem;">${patient.name}</h2>
        <p style="color: var(--text-muted);">
          ${patient.age} years • ${patient.bedId} • ${patient.diagnosis}
        </p>
      </div>
      <span class="status-badge ${patient.status}" style="font-size: 1rem; padding: 0.5rem 1rem;">
        ${patient.status}
      </span>
    </div>
    
    <h3 style="margin-bottom: 1rem; color: var(--accent-blue);">Current Vitals</h3>
    <div class="vitals-grid" style="margin-bottom: 2rem;">
      <div class="vital-item">
        <span class="vital-label">Heart Rate</span>
        <div class="vital-value">${patient.vitals.heartRate} <span class="vital-unit">bpm</span></div>
      </div>
      <div class="vital-item">
        <span class="vital-label">SpO₂</span>
        <div class="vital-value">${patient.vitals.spo2} <span class="vital-unit">%</span></div>
      </div>
      <div class="vital-item">
        <span class="vital-label">Blood Pressure</span>
        <div class="vital-value">${patient.vitals.bloodPressure.systolic}/${patient.vitals.bloodPressure.diastolic} <span class="vital-unit">mmHg</span></div>
      </div>
      <div class="vital-item">
        <span class="vital-label">Temperature</span>
        <div class="vital-value">${patient.vitals.temperature} <span class="vital-unit">°C</span></div>
      </div>
      <div class="vital-item">
        <span class="vital-label">Respiratory Rate</span>
        <div class="vital-value">${patient.vitals.respiratoryRate} <span class="vital-unit">/min</span></div>
      </div>
    </div>
    
    <h3 style="margin-bottom: 1rem; color: var(--accent-blue);">Treatment Plan</h3>
    <div style="margin-bottom: 2rem;">
      ${patient.medications.map(med => `
        <div style="background: var(--bg-glass); padding: 1rem; border-radius: 10px; margin-bottom: 0.75rem; border: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="font-size: 1.1rem;">${med.name}</strong>
              <p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 0.25rem;">
                ${med.dose}
              </p>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.875rem; color: var(--text-muted);">Next Dose</div>
              <div style="font-weight: 600;">${med.nextDose}</div>
              <span class="status-badge ${med.status === 'overdue' ? 'critical' : med.status === 'due' ? 'warning' : 'stable'}" 
                    style="margin-top: 0.5rem; display: inline-block; font-size: 0.75rem;">
                ${med.status}
              </span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    
    <div style="display: flex; gap: 1rem;">
      <button class="btn btn-primary" style="flex: 1;" onclick="this.closest('[style*=fixed]').remove()">
        Close
      </button>
      <button class="btn btn-secondary" style="flex: 1;">
        Update Treatment
      </button>
    </div>
  `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Setup navigation menu
function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      // Remove active class from all links
      navLinks.forEach(l => l.classList.remove('active'));

      // Add active class to clicked link
      link.classList.add('active');

      // Get the menu text
      const menuText = link.querySelector('span:last-child').textContent;

      // Handle different menu items
      handleNavigation(menuText);
    });
  });
}

// Handle navigation actions
function handleNavigation(menuItem) {
  const mainContent = document.querySelector('.main-content');
  const headerTitle = document.querySelector('.header-title h2');

  switch (menuItem) {
    case 'Dashboard':
      headerTitle.textContent = 'ICU Control Room';
      currentPatients = [...patientsData];
      renderPatients();
      updateStats();
      showNotification('Dashboard loaded', 'info');
      break;

    case 'All Patients':
      headerTitle.textContent = 'Patient Management';
      showPatientManagement();
      break;

    case 'Medications':
      headerTitle.textContent = 'Medication Management';
      showMedicationsView();
      break;

    case 'Alerts':
      headerTitle.textContent = 'Alert Center';
      showAlertsView();
      break;

    case 'Staff':
      headerTitle.textContent = 'Staff Management';
      showStaffView();
      break;

    case 'Reports':
      headerTitle.textContent = 'Reports & Analytics';
      showReportsView();
      break;

    case 'Settings':
      headerTitle.textContent = 'System Settings';
      showSettingsView();
      break;
  }
}

// Setup user menu (logout, profile, etc.)
function setupUserMenu() {
  // Add logout button to sidebar if not exists
  const sidebar = document.querySelector('.sidebar');

  // Check if logout button already exists
  if (!document.querySelector('.logout-section')) {
    const logoutSection = document.createElement('div');
    logoutSection.className = 'logout-section';
    logoutSection.style.cssText = `
      position: absolute;
      bottom: 2rem;
      left: 1.5rem;
      right: 1.5rem;
    `;

    const session = JSON.parse(localStorage.getItem('icuSession') || sessionStorage.getItem('icuSession'));

    logoutSection.innerHTML = `
      <div style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 12px; margin-bottom: 1rem;">
        <div style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.25rem;">Logged in as</div>
        <div style="font-weight: 600; color: var(--text-primary);">${session ? session.role : 'User'}</div>
      </div>
      <button class="logout-btn" style="
        width: 100%;
        padding: 0.875rem;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 10px;
        color: #ef4444;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      ">
        <span>🚪</span>
        <span>Logout</span>
      </button>
    `;

    sidebar.appendChild(logoutSection);

    // Add logout functionality
    const logoutBtn = logoutSection.querySelector('.logout-btn');
    logoutBtn.addEventListener('click', handleLogout);

    // Add hover effect
    logoutBtn.addEventListener('mouseenter', () => {
      logoutBtn.style.background = 'rgba(239, 68, 68, 0.2)';
      logoutBtn.style.transform = 'translateY(-2px)';
    });

    logoutBtn.addEventListener('mouseleave', () => {
      logoutBtn.style.background = 'rgba(239, 68, 68, 0.1)';
      logoutBtn.style.transform = 'translateY(0)';
    });
  }
}

// Handle logout
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('icuSession');
    sessionStorage.removeItem('icuSession');
    showNotification('Logged out successfully', 'success');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1000);
  }
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    background: var(--bg-glass);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    color: var(--text-primary);
    font-size: 0.95rem;
    font-weight: 500;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    box-shadow: var(--shadow-lg);
  `;

  if (type === 'success') {
    notification.style.borderColor = 'var(--accent-green)';
    notification.style.background = 'rgba(16, 185, 129, 0.1)';
    message = '✓ ' + message;
  } else if (type === 'error') {
    notification.style.borderColor = '#ef4444';
    notification.style.background = 'rgba(239, 68, 68, 0.1)';
    message = '✗ ' + message;
  } else {
    message = 'ℹ ' + message;
  }

  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100px)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Medications View
function showMedicationsView() {
  const grid = document.getElementById('patients-grid');
  grid.innerHTML = `
    <div style="grid-column: 1 / -1; padding: 2rem; text-align: center;">
      <div style="font-size: 4rem; margin-bottom: 1rem;">💊</div>
      <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Medication Management</h3>
      <p style="color: var(--text-muted);">View and manage all patient medications</p>
      <div style="margin-top: 2rem; display: grid; gap: 1rem; max-width: 800px; margin-left: auto; margin-right: auto;">
        ${generateMedicationsList()}
      </div>
    </div>
  `;
}

// Generate medications list
function generateMedicationsList() {
  let html = '';
  patientsData.forEach(patient => {
    patient.medications.forEach(med => {
      html += `
        <div style="background: var(--bg-glass); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color); text-align: left;">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <h4 style="font-size: 1.1rem; margin-bottom: 0.5rem;">${med.name}</h4>
              <p style="color: var(--text-muted); font-size: 0.875rem;">${patient.name} - ${patient.bedId}</p>
              <p style="color: var(--text-secondary); font-size: 0.95rem; margin-top: 0.5rem;">${med.dose}</p>
            </div>
            <span class="status-badge ${med.status === 'overdue' ? 'critical' : med.status === 'due' ? 'warning' : 'stable'}">${med.status}</span>
          </div>
          <div style="margin-top: 1rem; font-size: 0.875rem; color: var(--text-muted);">
            Next dose: <strong style="color: var(--text-primary);">${med.nextDose}</strong>
          </div>
        </div>
      `;
    });
  });
  return html;
}

// Alerts View
function showAlertsView() {
  const grid = document.getElementById('patients-grid');
  grid.innerHTML = `
    <div style="grid-column: 1 / -1; padding: 2rem;">
      <div style="text-align: center; margin-bottom: 2rem;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">🔔</div>
        <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Alert Center</h3>
        <p style="color: var(--text-muted);">All system alerts and notifications</p>
      </div>
      <div style="max-width: 900px; margin: 0 auto;">
        ${currentAlerts.map(alert => `
          <div class="alert-item ${alert.type}" style="margin-bottom: 1rem;">
            <div class="alert-header">
              <div class="alert-title">${alert.title}</div>
              <div class="alert-time">${alert.time}</div>
            </div>
            <div class="alert-message">
              <strong>${alert.patientName}</strong> (${alert.bedId})<br>
              ${alert.message}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Staff View
function showStaffView() {
  const grid = document.getElementById('patients-grid');
  grid.innerHTML = `
    <div style="grid-column: 1 / -1; padding: 2rem; text-align: center;">
      <div style="font-size: 4rem; margin-bottom: 1rem;">👨‍⚕️</div>
      <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Staff Management</h3>
      <p style="color: var(--text-muted);">Manage medical staff and schedules</p>
      <div style="margin-top: 2rem;">
        <p style="color: var(--text-secondary);">This feature is under development</p>
      </div>
    </div>
  `;
}

// Reports View
function showReportsView() {
  const grid = document.getElementById('patients-grid');
  grid.innerHTML = `
    <div style="grid-column: 1 / -1; padding: 2rem; text-align: center;">
      <div style="font-size: 4rem; margin-bottom: 1rem;">📈</div>
      <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Reports & Analytics</h3>
      <p style="color: var(--text-muted);">View system reports and analytics</p>
      <div style="margin-top: 2rem;">
        <p style="color: var(--text-secondary);">This feature is under development</p>
      </div>
    </div>
  `;
}

// Settings View - Admin Panel
function showSettingsView() {
  const session = JSON.parse(localStorage.getItem('icuSession') || sessionStorage.getItem('icuSession'));
  const userRole = session ? session.role : 'Doctor';

  // Allow both Doctor and Administrator to access settings
  if (userRole !== 'Administrator' && userRole !== 'Doctor') {
    const grid = document.getElementById('patients-grid');
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 2rem; text-align: center;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">🔒</div>
        <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Access Denied</h3>
        <p style="color: var(--text-muted);">Only doctors and administrators can access settings</p>
      </div>
    `;
    return;
  }

  showAdminPanel();
}

// Admin Panel - Manage Nurses
function showAdminPanel() {
  const grid = document.getElementById('patients-grid');

  // Get nurses from localStorage or use defaults
  let nurses = JSON.parse(localStorage.getItem('nursesList') || '[]');

  if (nurses.length === 0) {
    nurses = [
      { id: 1, name: 'Sarah Ahmed', email: 'nurse@icu.com', phone: '+20 123 456 7890', shift: 'Morning', status: 'active' }
    ];
    localStorage.setItem('nursesList', JSON.stringify(nurses));
  }

  grid.innerHTML = `
    <div style="grid-column: 1 / -1; padding: 2rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <div>
          <h3 style="font-size: 1.75rem; margin-bottom: 0.5rem;">👩‍⚕️ Nurse Management</h3>
          <p style="color: var(--text-muted);">Add and manage nursing staff</p>
        </div>
        <button onclick="showAddNurseModal()" style="
          padding: 0.875rem 1.5rem;
          background: var(--gradient-primary);
          border: none;
          border-radius: 10px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        ">
          ➕ Add New Nurse
        </button>
      </div>
      
      <div style="display: grid; gap: 1rem; max-width: 1000px;">
        ${nurses.map(nurse => `
          <div style="background: var(--bg-glass); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem;">
                <div style="width: 50px; height: 50px; background: var(--gradient-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                  👩‍⚕️
                </div>
                <div>
                  <h4 style="font-size: 1.1rem; margin-bottom: 0.25rem;">${nurse.name}</h4>
                  <span class="status-badge ${nurse.status === 'active' ? 'stable' : 'warning'}" style="font-size: 0.7rem;">
                    ${nurse.status}
                  </span>
                </div>
              </div>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; font-size: 0.875rem; color: var(--text-secondary);">
                <div>
                  <div style="color: var(--text-muted); font-size: 0.75rem; margin-bottom: 0.25rem;">Email</div>
                  <div>${nurse.email}</div>
                </div>
                <div>
                  <div style="color: var(--text-muted); font-size: 0.75rem; margin-bottom: 0.25rem;">Phone</div>
                  <div>${nurse.phone}</div>
                </div>
                <div>
                  <div style="color: var(--text-muted); font-size: 0.75rem; margin-bottom: 0.25rem;">Shift</div>
                  <div>${nurse.shift}</div>
                </div>
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <button onclick="editNurse(${nurse.id})" style="
                padding: 0.5rem 1rem;
                background: rgba(99, 102, 241, 0.1);
                border: 1px solid var(--accent-blue);
                border-radius: 8px;
                color: var(--accent-blue);
                cursor: pointer;
                font-size: 0.875rem;
              ">
                ✏️ Edit
              </button>
              <button onclick="deleteNurse(${nurse.id})" style="
                padding: 0.5rem 1rem;
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid #ef4444;
                border-radius: 8px;
                color: #ef4444;
                cursor: pointer;
                font-size: 0.875rem;
              ">
                🗑️ Delete
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Show Add Nurse Modal
function showAddNurseModal() {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    backdrop-filter: blur(10px);
  `;

  modal.innerHTML = `
    <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 20px; padding: 2rem; max-width: 500px; width: 90%;">
      <h3 style="font-size: 1.5rem; margin-bottom: 1.5rem;">Add New Nurse</h3>
      
      <form id="addNurseForm" style="display: flex; flex-direction: column; gap: 1rem;">
        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Full Name</label>
          <input type="text" id="nurseName" required style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); border-radius: 8px; color: white; font-family: inherit;">
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Email</label>
          <input type="email" id="nurseEmail" required style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); border-radius: 8px; color: white; font-family: inherit;">
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Phone</label>
          <input type="tel" id="nursePhone" required style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); border-radius: 8px; color: white; font-family: inherit;">
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Shift</label>
          <select id="nurseShift" required style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); border-radius: 8px; color: white; font-family: inherit;">
            <option value="Morning">Morning (6 AM - 2 PM)</option>
            <option value="Afternoon">Afternoon (2 PM - 10 PM)</option>
            <option value="Night">Night (10 PM - 6 AM)</option>
          </select>
        </div>
        
        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
          <button type="submit" class="btn btn-primary" style="flex: 1;">Add Nurse</button>
          <button type="button" onclick="this.closest('[style*=fixed]').remove()" class="btn btn-secondary" style="flex: 1;">Cancel</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // Handle form submission
  document.getElementById('addNurseForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const nurses = JSON.parse(localStorage.getItem('nursesList') || '[]');
    const newNurse = {
      id: Date.now(),
      name: document.getElementById('nurseName').value,
      email: document.getElementById('nurseEmail').value,
      phone: document.getElementById('nursePhone').value,
      shift: document.getElementById('nurseShift').value,
      status: 'active'
    };

    nurses.push(newNurse);
    localStorage.setItem('nursesList', JSON.stringify(nurses));

    modal.remove();
    showAdminPanel();
    showNotification('Nurse added successfully!', 'success');
  });

  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Delete Nurse
function deleteNurse(nurseId) {
  if (confirm('Are you sure you want to delete this nurse?')) {
    let nurses = JSON.parse(localStorage.getItem('nursesList') || '[]');
    nurses = nurses.filter(n => n.id !== nurseId);
    localStorage.setItem('nursesList', JSON.stringify(nurses));
    showAdminPanel();
    showNotification('Nurse deleted successfully', 'success');
  }
}

// Edit Nurse
function editNurse(nurseId) {
  const nurses = JSON.parse(localStorage.getItem('nursesList') || '[]');
  const nurse = nurses.find(n => n.id === nurseId);
  if (!nurse) return;

  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    backdrop-filter: blur(10px);
  `;

  modal.innerHTML = `
    <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 20px; padding: 2rem; max-width: 500px; width: 90%;">
      <h3 style="font-size: 1.5rem; margin-bottom: 1.5rem;">Edit Nurse: ${nurse.name}</h3>
      
      <form id="editNurseForm" style="display: flex; flex-direction: column; gap: 1rem;">
        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Full Name</label>
          <input type="text" id="editNurseName" value="${nurse.name}" required style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); border-radius: 8px; color: white; font-family: inherit;">
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Email</label>
          <input type="email" id="editNurseEmail" value="${nurse.email}" required style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); border-radius: 8px; color: white; font-family: inherit;">
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Phone</label>
          <input type="tel" id="editNursePhone" value="${nurse.phone}" required style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); border-radius: 8px; color: white; font-family: inherit;">
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Shift</label>
          <select id="editNurseShift" required style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); border-radius: 8px; color: white; font-family: inherit;">
            <option value="Morning" ${nurse.shift === 'Morning' ? 'selected' : ''}>Morning (6 AM - 2 PM)</option>
            <option value="Afternoon" ${nurse.shift === 'Afternoon' ? 'selected' : ''}>Afternoon (2 PM - 10 PM)</option>
            <option value="Night" ${nurse.shift === 'Night' ? 'selected' : ''}>Night (10 PM - 6 AM)</option>
          </select>
        </div>
        
        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
          <button type="submit" class="btn btn-primary" style="flex: 1;">Save Changes</button>
          <button type="button" onclick="this.closest('[style*=fixed]').remove()" class="btn btn-secondary" style="flex: 1;">Cancel</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // Handle form submission
  document.getElementById('editNurseForm').addEventListener('submit', (e) => {
    e.preventDefault();

    nurse.name = document.getElementById('editNurseName').value;
    nurse.email = document.getElementById('editNurseEmail').value;
    nurse.phone = document.getElementById('editNursePhone').value;
    nurse.shift = document.getElementById('editNurseShift').value;

    localStorage.setItem('nursesList', JSON.stringify(nurses));

    modal.remove();
    showAdminPanel();
    showNotification('Nurse updated successfully!', 'success');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Initialize Nurse View
function initializeNurseView() {
  const grid = document.getElementById('patients-grid');
  const headerTitle = document.querySelector('.header-title h2');

  headerTitle.textContent = 'Nurse Dashboard - Medication Schedule';

  // Get all medications from all patients
  const allMedications = [];
  patientsData.forEach(patient => {
    patient.medications.forEach(med => {
      allMedications.push({
        ...med,
        patientName: patient.name,
        patientId: patient.id,
        bedId: patient.bedId
      });
    });
  });

  // Sort by next dose time
  allMedications.sort((a, b) => {
    return a.nextDose.localeCompare(b.nextDose);
  });

  grid.innerHTML = `
    <div style="grid-column: 1 / -1;">
      <div style="background: var(--bg-glass); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 2rem;">
        <h3 style="font-size: 1.25rem; margin-bottom: 1rem;">📋 Today's Medication Schedule</h3>
        <div style="display: grid; gap: 1rem;">
          ${allMedications.map(med => {
    const timeUntil = getTimeUntilDose(med.nextDose);
    const isUrgent = timeUntil <= 10 && timeUntil >= 0;

    return `
              <div style="
                background: ${isUrgent ? 'rgba(255, 170, 0, 0.1)' : 'var(--bg-secondary)'};
                padding: 1.25rem;
                border-radius: 10px;
                border: 1px solid ${isUrgent ? 'var(--status-warning)' : 'var(--border-color)'};
                display: flex;
                justify-content: space-between;
                align-items: center;
                ${isUrgent ? 'animation: pulse-alert 2s infinite;' : ''}
              ">
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                    <span style="font-size: 1.5rem;">${isUrgent ? '⚠️' : '💊'}</span>
                    <div>
                      <h4 style="font-size: 1.1rem; margin-bottom: 0.25rem;">${med.name}</h4>
                      <p style="color: var(--text-muted); font-size: 0.875rem;">
                        ${med.patientName} - ${med.bedId}
                      </p>
                    </div>
                  </div>
                  <div style="display: flex; gap: 2rem; font-size: 0.875rem; color: var(--text-secondary); margin-left: 3rem;">
                    <div>
                      <span style="color: var(--text-muted);">Dose:</span> ${med.dose}
                    </div>
                    <div>
                      <span style="color: var(--text-muted);">Next:</span> ${med.nextDose}
                    </div>
                    ${isUrgent ? `
                      <div style="color: var(--status-warning); font-weight: 600;">
                        ⏰ Due in ${timeUntil} minutes!
                      </div>
                    ` : ''}
                  </div>
                </div>
                <div>
                  <span class="status-badge ${med.status === 'overdue' ? 'critical' : med.status === 'due' ? 'warning' : 'stable'}">
                    ${med.status}
                  </span>
                </div>
              </div>
            `;
  }).join('')}
        </div>
      </div>
      
      <div style="background: var(--bg-glass); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color);">
        <h3 style="font-size: 1.25rem; margin-bottom: 1rem;">👥 Patient List</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">
          ${patientsData.map(patient => `
            <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 10px; border: 1px solid var(--border-color);">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                <div>
                  <h4 style="font-size: 1rem; margin-bottom: 0.25rem;">${patient.name}</h4>
                  <p style="color: var(--text-muted); font-size: 0.875rem;">${patient.bedId}</p>
                </div>
                <span class="status-badge ${patient.status}">${patient.status}</span>
              </div>
              <div style="font-size: 0.875rem; color: var(--text-secondary);">
                <div>Medications: ${patient.medications.length}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  updateStats();
}

// Get time until dose in minutes
function getTimeUntilDose(nextDoseTime) {
  // Parse time like "14:30" or "2:30 PM"
  const now = new Date();
  const [hours, minutes] = nextDoseTime.split(':').map(t => parseInt(t.replace(/[^0-9]/g, '')));

  const doseTime = new Date();
  doseTime.setHours(hours, minutes, 0, 0);

  const diffMs = doseTime - now;
  const diffMins = Math.floor(diffMs / 60000);

  return diffMins;
}

// Setup medication alerts
function setupMedicationAlerts() {
  // Initial check
  checkMedicationAlerts();
}

// Check for upcoming medications (10 minutes before)
function checkMedicationAlerts() {
  const session = JSON.parse(localStorage.getItem('icuSession') || sessionStorage.getItem('icuSession'));
  if (!session || session.role !== 'Nurse') return;

  patientsData.forEach(patient => {
    patient.medications.forEach(med => {
      const timeUntil = getTimeUntilDose(med.nextDose);

      // Alert 10 minutes before
      if (timeUntil === 10) {
        showMedicationAlert(patient, med);
      }
    });
  });
}

// Show medication alert notification
function showMedicationAlert(patient, medication) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 2rem;
    right: 2rem;
    padding: 1.5rem;
    background: rgba(255, 170, 0, 0.95);
    backdrop-filter: blur(20px);
    border: 2px solid var(--status-warning);
    border-radius: 12px;
    color: white;
    font-size: 0.95rem;
    font-weight: 500;
    z-index: 10000;
    animation: slideIn 0.3s ease-out, pulse-alert 2s infinite;
    box-shadow: 0 8px 32px rgba(255, 170, 0, 0.4);
    max-width: 400px;
  `;

  notification.innerHTML = `
    <div style="display: flex; align-items: start; gap: 1rem;">
      <div style="font-size: 2rem;">⏰</div>
      <div style="flex: 1;">
        <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 0.5rem;">
          Medication Due in 10 Minutes!
        </div>
        <div style="margin-bottom: 0.5rem;">
          <strong>${patient.name}</strong> (${patient.bedId})
        </div>
        <div style="font-size: 0.9rem; opacity: 0.9;">
          ${medication.name} - ${medication.dose}
        </div>
        <div style="font-size: 0.875rem; opacity: 0.8; margin-top: 0.5rem;">
          Scheduled: ${medication.nextDose}
        </div>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        cursor: pointer;
        color: white;
        font-size: 1.2rem;
      ">×</button>
    </div>
  `;

  document.body.appendChild(notification);

  // Play notification sound (optional)
  playNotificationSound();

  // Auto-remove after 30 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }
  }, 30000);
}

// Play notification sound
function playNotificationSound() {
  // Create audio context for beep sound
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log('Audio not supported');
  }
}

// ========================================
// PATIENT MANAGEMENT SYSTEM
// ========================================

// Show Patient Management View
function showPatientManagement() {
  const grid = document.getElementById('patients-grid');
  const headerTitle = document.querySelector('.header-title h2');

  headerTitle.textContent = 'Patient Management';

  grid.innerHTML = `
    <div style="grid-column: 1 / -1; padding: 2rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <div>
          <h3 style="font-size: 1.75rem; margin-bottom: 0.5rem;">👥 Patient Management</h3>
          <p style="color: var(--text-muted);">Add, edit, and manage patients</p>
        </div>
        <button onclick="showAddPatientModal()" style="
          padding: 0.875rem 1.5rem;
          background: var(--gradient-primary);
          border: none;
          border-radius: 10px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        ">
          ➕ Add New Patient
        </button>
      </div>
      
      <div style="display: grid; gap: 1rem;">
        ${patientsData.map(patient => `
          <div style="background: var(--bg-glass); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem;">
                <div style="width: 50px; height: 50px; background: var(--gradient-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                  👤
                </div>
                <div>
                  <h4 style="font-size: 1.1rem; margin-bottom: 0.25rem;">${patient.name}</h4>
                  <span class="status-badge ${patient.status}">${patient.status}</span>
                </div>
              </div>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; font-size: 0.875rem; color: var(--text-secondary);">
                <div>
                  <div style="color: var(--text-muted); font-size: 0.75rem; margin-bottom: 0.25rem;">Bed ID</div>
                  <div>${patient.bedId}</div>
                </div>
                <div>
                  <div style="color: var(--text-muted); font-size: 0.75rem; margin-bottom: 0.25rem;">Age</div>
                  <div>${patient.age} years</div>
                </div>
                <div>
                  <div style="color: var(--text-muted); font-size: 0.75rem; margin-bottom: 0.25rem;">Diagnosis</div>
                  <div>${patient.diagnosis}</div>
                </div>
                <div>
                  <div style="color: var(--text-muted); font-size: 0.75rem; margin-bottom: 0.25rem;">Assigned Nurse</div>
                  <div>${patient.assignedNurse || 'Not assigned'}</div>
                </div>
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <button onclick="assignNurseToPatient(${patient.id})" style="
                padding: 0.5rem 1rem;
                background: rgba(16, 185, 129, 0.1);
                border: 1px solid var(--accent-green);
                border-radius: 8px;
                color: var(--accent-green);
                cursor: pointer;
                font-size: 0.875rem;
              ">
                👩‍⚕️ Assign Nurse
              </button>
              <button onclick="showPatientReport(${patient.id})" style="
                padding: 0.5rem 1rem;
                background: rgba(139, 92, 246, 0.1);
                border: 1px solid #8b5cf6;
                border-radius: 8px;
                color: #8b5cf6;
                cursor: pointer;
                font-size: 0.875rem;
              ">
                📋 View Report
              </button>
              <button onclick="editPatient(${patient.id})" style="
                padding: 0.5rem 1rem;
                background: rgba(99, 102, 241, 0.1);
                border: 1px solid var(--accent-blue);
                border-radius: 8px;
                color: var(--accent-blue);
                cursor: pointer;
                font-size: 0.875rem;
              ">
                ✏️ Edit
              </button>
              <button onclick="deletePatient(${patient.id})" style="
                padding: 0.5rem 1rem;
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid #ef4444;
                border-radius: 8px;
                color: #ef4444;
                cursor: pointer;
                font-size: 0.875rem;
              ">
                🗑️ Delete
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Show Add Patient Modal
function showAddPatientModal() {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    backdrop-filter: blur(10px);
  `;

  modal.innerHTML = `
    <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 20px; padding: 2rem; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;">
      <h3 style="font-size: 1.5rem; margin-bottom: 1.5rem;">Add New Patient</h3>
      
      <form id="addPatientForm" style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Full Name</label>
            <input type="text" id="patientName" required style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); border-radius: 8px; color: white; font-family: inherit;">
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Age</label>
            <input type="number" id="patientAge" required min="0" max="150" style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); border-radius: 8px; color: white; font-family: inherit;">
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Bed ID</label>
            <input type="text" id="patientBedId" required style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); border-radius: 8px; color: white; font-family: inherit;">
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Status</label>
            <select id="patientStatus" required style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); border-radius: 8px; color: white; font-family: inherit;">
              <option value="stable">Stable</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Diagnosis</label>
          <input type="text" id="patientDiagnosis" required style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); border-radius: 8px; color: white; font-family: inherit;">
        </div>
        
        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
          <button type="submit" class="btn btn-primary" style="flex: 1;">Add Patient</button>
          <button type="button" onclick="this.closest('[style*=fixed]').remove()" class="btn btn-secondary" style="flex: 1;">Cancel</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // Handle form submission
  document.getElementById('addPatientForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const newPatient = {
      id: Date.now(),
      name: document.getElementById('patientName').value,
      age: parseInt(document.getElementById('patientAge').value),
      bedId: document.getElementById('patientBedId').value,
      status: document.getElementById('patientStatus').value,
      diagnosis: document.getElementById('patientDiagnosis').value,
      assignedNurse: null,
      vitals: {
        heartRate: 75,
        spo2: 98,
        bloodPressure: { systolic: 120, diastolic: 80 },
        temperature: 36.8,
        respiratoryRate: 16
      },
      medications: []
    };

    patientsData.push(newPatient);
    currentPatients = [...patientsData];

    modal.remove();
    showPatientManagement();
    showNotification('Patient added successfully!', 'success');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Delete Patient
function deletePatient(patientId) {
  if (confirm('Are you sure you want to delete this patient?')) {
    const index = patientsData.findIndex(p => p.id === patientId);
    if (index !== -1) {
      patientsData.splice(index, 1);
      currentPatients = [...patientsData];
      showPatientManagement();
      showNotification('Patient deleted successfully', 'success');
    }
  }
}

// Edit Patient
function editPatient(patientId) {
  const patient = patientsData.find(p => p.id === patientId);
  if (!patient) return;

  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    backdrop-filter: blur(10px);
  `;

  modal.innerHTML = `
    <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 20px; padding: 2rem; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;">
      <h3 style="font-size: 1.5rem; margin-bottom: 1.5rem;">Edit Patient: ${patient.name}</h3>
      
      <form id="editPatientForm" style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Full Name</label>
            <input type="text" id="editPatientName" value="${patient.name}" required style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); border-radius: 8px; color: white; font-family: inherit;">
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Age</label>
            <input type="number" id="editPatientAge" value="${patient.age}" required min="0" max="150" style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); border-radius: 8px; color: white; font-family: inherit;">
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Bed ID</label>
            <input type="text" id="editPatientBedId" value="${patient.bedId}" required style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); border-radius: 8px; color: white; font-family: inherit;">
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Status</label>
            <select id="editPatientStatus" required style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); border-radius: 8px; color: white; font-family: inherit;">
              <option value="stable" ${patient.status === 'stable' ? 'selected' : ''}>Stable</option>
              <option value="warning" ${patient.status === 'warning' ? 'selected' : ''}>Warning</option>
              <option value="critical" ${patient.status === 'critical' ? 'selected' : ''}>Critical</option>
            </select>
          </div>
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Diagnosis</label>
          <input type="text" id="editPatientDiagnosis" value="${patient.diagnosis}" required style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); border-radius: 8px; color: white; font-family: inherit;">
        </div>
        
        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
          <button type="submit" class="btn btn-primary" style="flex: 1;">Save Changes</button>
          <button type="button" onclick="this.closest('[style*=fixed]').remove()" class="btn btn-secondary" style="flex: 1;">Cancel</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // Handle form submission
  document.getElementById('editPatientForm').addEventListener('submit', (e) => {
    e.preventDefault();

    patient.name = document.getElementById('editPatientName').value;
    patient.age = parseInt(document.getElementById('editPatientAge').value);
    patient.bedId = document.getElementById('editPatientBedId').value;
    patient.status = document.getElementById('editPatientStatus').value;
    patient.diagnosis = document.getElementById('editPatientDiagnosis').value;

    modal.remove();
    showPatientManagement();
    showNotification('Patient updated successfully!', 'success');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Show Patient Report
function showPatientReport(patientId) {
  const patient = patientsData.find(p => p.id === patientId);
  if (!patient) return;

  // Initialize medical imaging if not exists
  if (!patient.medicalImaging) {
    patient.medicalImaging = [];
  }

  // Initialize medical history if not exists
  if (!patient.medicalHistory) {
    patient.medicalHistory = {
      admissionDate: new Date().toISOString().split('T')[0],
      chiefComplaint: patient.diagnosis || 'Not specified',
      pastMedicalHistory: [],
      allergies: [],
      surgeries: [],
      labResults: []
    };
  }

  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    backdrop-filter: blur(10px);
  `;

  modal.innerHTML = `
    <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 20px; padding: 2rem; max-width: 900px; width: 95%; max-height: 90vh; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 2rem;">
        <div>
          <h2 style="font-size: 2rem; margin-bottom: 0.5rem;">📋 Patient Report</h2>
          <p style="color: var(--text-muted);">${patient.name} - ${patient.bedId}</p>
        </div>
        <button onclick="this.closest('[style*=fixed]').remove()" style="background: none; border: none; font-size: 2rem; color: var(--text-muted); cursor: pointer;">×</button>
      </div>
      
      <!-- Patient Info -->
      <div style="background: var(--bg-glass); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.25rem; margin-bottom: 1rem; color: var(--accent-blue);">👤 Patient Information</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; font-size: 0.9rem;">
          <div>
            <div style="color: var(--text-muted); font-size: 0.75rem; margin-bottom: 0.25rem;">Name</div>
            <div style="font-weight: 600;">${patient.name}</div>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 0.75rem; margin-bottom: 0.25rem;">Age</div>
            <div style="font-weight: 600;">${patient.age} years</div>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 0.75rem; margin-bottom: 0.25rem;">Bed ID</div>
            <div style="font-weight: 600;">${patient.bedId}</div>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 0.75rem; margin-bottom: 0.25rem;">Status</div>
            <span class="status-badge ${patient.status}">${patient.status}</span>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 0.75rem; margin-bottom: 0.25rem;">Diagnosis</div>
            <div style="font-weight: 600;">${patient.diagnosis}</div>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 0.75rem; margin-bottom: 0.25rem;">Assigned Nurse</div>
            <div style="font-weight: 600;">${patient.assignedNurse || 'Not assigned'}</div>
          </div>
        </div>
      </div>
      
      <!-- Current Vitals -->
      <div style="background: var(--bg-glass); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.25rem; margin-bottom: 1rem; color: var(--accent-blue);">💓 Current Vitals</h3>
        <div class="vitals-grid">
          <div class="vital-item">
            <span class="vital-label">Heart Rate</span>
            <div class="vital-value">${patient.vitals.heartRate} <span class="vital-unit">bpm</span></div>
          </div>
          <div class="vital-item">
            <span class="vital-label">SpO₂</span>
            <div class="vital-value">${patient.vitals.spo2} <span class="vital-unit">%</span></div>
          </div>
          <div class="vital-item">
            <span class="vital-label">Blood Pressure</span>
            <div class="vital-value">${patient.vitals.bloodPressure.systolic}/${patient.vitals.bloodPressure.diastolic} <span class="vital-unit">mmHg</span></div>
          </div>
          <div class="vital-item">
            <span class="vital-label">Temperature</span>
            <div class="vital-value">${patient.vitals.temperature} <span class="vital-unit">°C</span></div>
          </div>
        </div>
      </div>
      
      <!-- Medical Imaging -->
      <div style="background: var(--bg-glass); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="font-size: 1.25rem; color: var(--accent-blue);">🔬 Medical Imaging & Tests</h3>
          <button onclick="addMedicalImaging(${patient.id})" style="padding: 0.5rem 1rem; background: var(--gradient-primary); border: none; border-radius: 8px; color: white; font-size: 0.875rem; cursor: pointer;">➕ Add Imaging</button>
        </div>
        <div id="imaging-list-${patient.id}">
          ${patient.medicalImaging.length > 0 ? patient.medicalImaging.map((img, idx) => `
            <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 10px; border: 1px solid var(--border-color); margin-bottom: 0.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                  <div style="font-weight: 600; margin-bottom: 0.5rem;">${img.type}</div>
                  <div style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 0.5rem;">${img.date}</div>
                  <div style="color: var(--text-secondary); font-size: 0.9rem;">${img.findings}</div>
                </div>
                <button onclick="deleteMedicalImaging(${patient.id}, ${idx})" style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 6px; color: #ef4444; padding: 0.25rem 0.5rem; cursor: pointer; font-size: 0.875rem;">Delete</button>
              </div>
            </div>
          `).join('') : '<p style="color: var(--text-muted); text-align: center;">No imaging records yet</p>'}
        </div>
      </div>
      
      <!-- Medications -->
      <div style="background: var(--bg-glass); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.25rem; margin-bottom: 1rem; color: var(--accent-blue);">💊 Current Medications</h3>
        ${patient.medications.length > 0 ? patient.medications.map(med => `
          <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 10px; border: 1px solid var(--border-color); margin-bottom: 0.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: 600; margin-bottom: 0.25rem;">${med.name}</div>
                <div style="color: var(--text-muted); font-size: 0.875rem;">${med.dose}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 0.875rem; color: var(--text-muted);">Next: ${med.nextDose}</div>
                <span class="status-badge ${med.status === 'overdue' ? 'critical' : med.status === 'due' ? 'warning' : 'stable'}" style="margin-top: 0.5rem; display: inline-block; font-size: 0.75rem;">${med.status}</span>
              </div>
            </div>
          </div>
        `).join('') : '<p style="color: var(--text-muted); text-align: center;">No medications prescribed</p>'}
      </div>
      
      <div style="display: flex; gap: 1rem;">
        <button onclick="printPatientReport(${patient.id})" class="btn btn-primary" style="flex: 1;">🖨️ Print Report</button>
        <button onclick="this.closest('[style*=fixed]').remove()" class="btn btn-secondary" style="flex: 1;">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Add Medical Imaging
function addMedicalImaging(patientId) {
  const patient = patientsData.find(p => p.id === patientId);
  if (!patient) return;

  const imagingModal = document.createElement('div');
  imagingModal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3000;
  `;

  imagingModal.innerHTML = `
    <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 20px; padding: 2rem; max-width: 500px; width: 90%;">
      <h3 style="font-size: 1.5rem; margin-bottom: 1.5rem;">Add Medical Imaging</h3>
      
      <form id="addImagingForm" style="display: flex; flex-direction: column; gap: 1rem;">
        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Imaging Type</label>
          <select id="imagingType" required style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); border-radius: 8px; color: white; font-family: inherit;">
            <option value="X-Ray">X-Ray</option>
            <option value="CT Scan">CT Scan</option>
            <option value="MRI">MRI</option>
            <option value="Ultrasound">Ultrasound</option>
            <option value="ECG">ECG</option>
            <option value="Lab Test">Lab Test</option>
          </select>
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Date</label>
          <input type="date" id="imagingDate" required value="${new Date().toISOString().split('T')[0]}" style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); border-radius: 8px; color: white; font-family: inherit;">
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Findings / Results</label>
          <textarea id="imagingFindings" required rows="4" style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); border-radius: 8px; color: white; font-family: inherit; resize: vertical;"></textarea>
        </div>
        
        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
          <button type="submit" class="btn btn-primary" style="flex: 1;">Add</button>
          <button type="button" onclick="this.closest('[style*=fixed]').remove()" class="btn btn-secondary" style="flex: 1;">Cancel</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(imagingModal);

  document.getElementById('addImagingForm').addEventListener('submit', (e) => {
    e.preventDefault();

    if (!patient.medicalImaging) {
      patient.medicalImaging = [];
    }

    patient.medicalImaging.push({
      type: document.getElementById('imagingType').value,
      date: document.getElementById('imagingDate').value,
      findings: document.getElementById('imagingFindings').value
    });

    imagingModal.remove();

    // Refresh the report
    const reportModal = document.querySelector('[style*="position: fixed"][style*="z-index: 2000"]');
    if (reportModal) {
      reportModal.remove();
    }
    showPatientReport(patientId);
    showNotification('Medical imaging added successfully!', 'success');
  });
}

// Delete Medical Imaging
function deleteMedicalImaging(patientId, index) {
  if (confirm('Are you sure you want to delete this imaging record?')) {
    const patient = patientsData.find(p => p.id === patientId);
    if (patient && patient.medicalImaging) {
      patient.medicalImaging.splice(index, 1);

      // Refresh the report
      const reportModal = document.querySelector('[style*="position: fixed"][style*="z-index: 2000"]');
      if (reportModal) {
        reportModal.remove();
      }
      showPatientReport(patientId);
      showNotification('Imaging record deleted', 'success');
    }
  }
}

// Print Patient Report
function printPatientReport(patientId) {
  showNotification('Print functionality coming soon!', 'info');
}

// Assign Nurse to Patient
function assignNurseToPatient(patientId) {
  const nurses = JSON.parse(localStorage.getItem('nursesList') || '[]');

  if (nurses.length === 0) {
    showNotification('No nurses available. Please add nurses first.', 'error');
    return;
  }

  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    backdrop-filter: blur(10px);
  `;

  const patient = patientsData.find(p => p.id === patientId);

  modal.innerHTML = `
    <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 20px; padding: 2rem; max-width: 500px; width: 90%;">
      <h3 style="font-size: 1.5rem; margin-bottom: 1rem;">Assign Nurse</h3>
      <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Patient: <strong style="color: var(--text-primary);">${patient.name}</strong></p>
      
      <div style="display: grid; gap: 0.75rem; margin-bottom: 1.5rem;">
        ${nurses.map(nurse => `
          <div onclick="confirmNurseAssignment(${patientId}, '${nurse.name}')" style="
            background: var(--bg-glass);
            padding: 1rem;
            border-radius: 10px;
            border: 1px solid var(--border-color);
            cursor: pointer;
            transition: all 0.3s ease;
          " onmouseenter="this.style.borderColor='var(--accent-blue)'" onmouseleave="this.style.borderColor='var(--border-color)'">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div style="font-size: 1.5rem;">👩‍⚕️</div>
              <div>
                <div style="font-weight: 600;">${nurse.name}</div>
                <div style="font-size: 0.875rem; color: var(--text-muted);">${nurse.shift} Shift</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      <button onclick="this.closest('[style*=fixed]').remove()" class="btn btn-secondary" style="width: 100%;">Cancel</button>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Confirm Nurse Assignment
function confirmNurseAssignment(patientId, nurseName) {
  const patient = patientsData.find(p => p.id === patientId);
  if (patient) {
    patient.assignedNurse = nurseName;

    // Close modal
    const modal = document.querySelector('[style*="position: fixed"]');
    if (modal) modal.remove();

    showPatientManagement();
    showNotification(`${nurseName} assigned to ${patient.name}`, 'success');
  }
}

// Update Nurse View to show only assigned patients
function initializeNurseView() {
  const grid = document.getElementById('patients-grid');
  const headerTitle = document.querySelector('.header-title h2');
  const session = JSON.parse(localStorage.getItem('icuSession') || sessionStorage.getItem('icuSession'));

  // Get nurse name from session
  const nurseUsername = session ? session.username : '';

  // Find nurse details
  const nurses = JSON.parse(localStorage.getItem('nursesList') || '[]');
  const currentNurse = nurses.find(n => n.email === `${nurseUsername}@icu.com`);
  const nurseName = currentNurse ? currentNurse.name : 'Nurse';

  headerTitle.textContent = `${nurseName}'s Dashboard - Medication Schedule`;

  // Filter patients assigned to this nurse
  const assignedPatients = patientsData.filter(p => p.assignedNurse === nurseName);

  if (assignedPatients.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 2rem; text-align: center;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">👥</div>
        <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">No Patients Assigned</h3>
        <p style="color: var(--text-muted);">You don't have any patients assigned to you yet.</p>
        <p style="color: var(--text-secondary); margin-top: 1rem;">Please contact your administrator.</p>
      </div>
    `;
    return;
  }

  // Get all medications from assigned patients
  const allMedications = [];
  assignedPatients.forEach(patient => {
    patient.medications.forEach(med => {
      allMedications.push({
        ...med,
        patientName: patient.name,
        patientId: patient.id,
        bedId: patient.bedId
      });
    });
  });

  // Sort by next dose time
  allMedications.sort((a, b) => {
    return a.nextDose.localeCompare(b.nextDose);
  });

  grid.innerHTML = `
    <div style="grid-column: 1 / -1;">
      <div style="background: rgba(99, 102, 241, 0.1); padding: 1rem; border-radius: 12px; border: 1px solid var(--accent-blue); margin-bottom: 2rem; text-align: center;">
        <div style="font-size: 1.1rem; font-weight: 600;">
          👩‍⚕️ You are managing <strong style="color: var(--accent-blue);">${assignedPatients.length}</strong> patient${assignedPatients.length > 1 ? 's' : ''}
        </div>
      </div>
      
      <div style="background: var(--bg-glass); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 2rem;">
        <h3 style="font-size: 1.25rem; margin-bottom: 1rem;">📋 Today's Medication Schedule</h3>
        ${allMedications.length > 0 ? `
          <div style="display: grid; gap: 1rem;">
            ${allMedications.map(med => {
    const timeUntil = getTimeUntilDose(med.nextDose);
    const isUrgent = timeUntil <= 10 && timeUntil >= 0;

    return `
                <div style="
                  background: ${isUrgent ? 'rgba(255, 170, 0, 0.1)' : 'var(--bg-secondary)'};
                  padding: 1.25rem;
                  border-radius: 10px;
                  border: 1px solid ${isUrgent ? 'var(--status-warning)' : 'var(--border-color)'};
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  ${isUrgent ? 'animation: pulse-alert 2s infinite;' : ''}
                ">
                  <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                      <span style="font-size: 1.5rem;">${isUrgent ? '⚠️' : '💊'}</span>
                      <div>
                        <h4 style="font-size: 1.1rem; margin-bottom: 0.25rem;">${med.name}</h4>
                        <p style="color: var(--text-muted); font-size: 0.875rem;">
                          ${med.patientName} - ${med.bedId}
                        </p>
                      </div>
                    </div>
                    <div style="display: flex; gap: 2rem; font-size: 0.875rem; color: var(--text-secondary); margin-left: 3rem;">
                      <div>
                        <span style="color: var(--text-muted);">Dose:</span> ${med.dose}
                      </div>
                      <div>
                        <span style="color: var(--text-muted);">Next:</span> ${med.nextDose}
                      </div>
                      ${isUrgent ? `
                        <div style="color: var(--status-warning); font-weight: 600;">
                          ⏰ Due in ${timeUntil} minutes!
                        </div>
                      ` : ''}
                    </div>
                  </div>
                  <div>
                    <span class="status-badge ${med.status === 'overdue' ? 'critical' : med.status === 'due' ? 'warning' : 'stable'}">
                      ${med.status}
                    </span>
                  </div>
                </div>
              `;
  }).join('')}
          </div>
        ` : '<p style="color: var(--text-muted); text-align: center;">No medications scheduled</p>'}
      </div>
      
      <div style="background: var(--bg-glass); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color);">
        <h3 style="font-size: 1.25rem; margin-bottom: 1rem;">👥 My Patients</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">
          ${assignedPatients.map(patient => `
            <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 10px; border: 1px solid var(--border-color);">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                <div>
                  <h4 style="font-size: 1rem; margin-bottom: 0.25rem;">${patient.name}</h4>
                  <p style="color: var(--text-muted); font-size: 0.875rem;">${patient.bedId}</p>
                </div>
                <span class="status-badge ${patient.status}">${patient.status}</span>
              </div>
              <div style="font-size: 0.875rem; color: var(--text-secondary);">
                <div>Age: ${patient.age} years</div>
                <div>Diagnosis: ${patient.diagnosis}</div>
                <div>Medications: ${patient.medications.length}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  updateStats();
}

// Console log for debugging
console.log('ICU Smart Control System initialized');
console.log(`Monitoring ${currentPatients.length} patients`);
