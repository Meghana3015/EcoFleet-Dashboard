let dashboardData = null;

async function loadData() {
  try {
    const response = await fetch('/data.json');
    dashboardData = await response.json();
    initializeDashboard();
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

let mapInstance = null;
let vehicleMarkers = {};

function initializeDashboard() {
  updateKPIs();
  renderCharts();
  renderFleetGrid();
  renderLeaderboard();
  renderAlerts();
  setupInteractions();
  setupNavigation();
  loadSettings();
  setTimeout(initializeMap, 100);
}

function updateKPIs() {
  const fleet = dashboardData.fleet;

  const avgRange = Math.round(fleet.reduce((sum, v) => sum + v.range, 0) / fleet.length);
  document.getElementById('avgRange').textContent = `${avgRange} km`;

  const avgCost = (dashboardData.chargingHistory.reduce((sum, h) => sum + h.cost, 0) / dashboardData.chargingHistory.length).toFixed(2);
  document.getElementById('avgCost').textContent = `₹${avgCost}`;

  const avgEfficiency = (fleet.reduce((sum, v) => sum + v.efficiency, 0) / fleet.length).toFixed(1);
  document.getElementById('avgEfficiency').textContent = `${avgEfficiency} km/kWh`;

  const totalCo2 = fleet.reduce((sum, v) => sum + v.co2Saved, 0);
  document.getElementById('totalCo2').textContent = `${totalCo2.toLocaleString()} kg`;
}

function renderCharts() {
  renderChargingChart();
  renderBatteryHealthChart();
  renderEfficiencyChart();
  renderCO2Chart();
}

function renderChargingChart() {
  const ctx = document.getElementById('chargingChart').getContext('2d');
  const history = dashboardData.chargingHistory;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: history.map(h => new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Energy (kWh)',
          data: history.map(h => h.energyKwh),
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
          borderRadius: 6,
          yAxisID: 'y'
        },
        {
          label: 'Sessions',
          data: history.map(h => h.sessions),
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          borderRadius: 6,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          labels: {
            color: '#f1f5f9',
            font: { size: 12 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          titleColor: '#f1f5f9',
          bodyColor: '#f1f5f9',
          borderColor: '#334155',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(51, 65, 85, 0.3)' },
          ticks: { color: '#94a3b8' }
        },
        y: {
          type: 'linear',
          position: 'left',
          grid: { color: 'rgba(51, 65, 85, 0.3)' },
          ticks: { color: '#94a3b8' },
          title: {
            display: true,
            text: 'Energy (kWh)',
            color: '#10b981'
          }
        },
        y1: {
          type: 'linear',
          position: 'right',
          grid: { display: false },
          ticks: { color: '#94a3b8' },
          title: {
            display: true,
            text: 'Sessions',
            color: '#3b82f6'
          }
        }
      }
    }
  });
}

function renderBatteryHealthChart() {
  const ctx = document.getElementById('batteryHealthChart').getContext('2d');
  const trend = dashboardData.batteryHealthTrend;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: trend.map(t => t.month),
      datasets: [{
        label: 'Average Battery Health (%)',
        data: trend.map(t => t.avgHealth),
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(16, 185, 129, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#f1f5f9',
            font: { size: 12 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          titleColor: '#f1f5f9',
          bodyColor: '#f1f5f9',
          borderColor: '#334155',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(51, 65, 85, 0.3)' },
          ticks: { color: '#94a3b8' }
        },
        y: {
          min: 85,
          max: 100,
          grid: { color: 'rgba(51, 65, 85, 0.3)' },
          ticks: { color: '#94a3b8' }
        }
      }
    }
  });
}

function renderEfficiencyChart() {
  const ctx = document.getElementById('efficiencyChart').getContext('2d');
  const data = dashboardData.efficiencyData.sort((a, b) => b.efficiency - a.efficiency);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.vehicle),
      datasets: [{
        label: 'Efficiency (km/kWh)',
        data: data.map(d => d.efficiency),
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          titleColor: '#f1f5f9',
          bodyColor: '#f1f5f9',
          borderColor: '#334155',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(51, 65, 85, 0.3)' },
          ticks: { color: '#94a3b8' }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#94a3b8' }
        }
      }
    }
  });
}

function renderCO2Chart() {
  const ctx = document.getElementById('co2Chart').getContext('2d');
  const comparison = dashboardData.monthlyComparison;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: comparison.map(c => c.month),
      datasets: [{
        label: 'CO₂ Saved (kg)',
        data: comparison.map(c => c.co2Saved),
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(34, 197, 94, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#f1f5f9',
            font: { size: 12 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          titleColor: '#f1f5f9',
          bodyColor: '#f1f5f9',
          borderColor: '#334155',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              return `CO₂ Saved: ${context.parsed.y.toLocaleString()} kg`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(51, 65, 85, 0.3)' },
          ticks: { color: '#94a3b8' }
        },
        y: {
          grid: { color: 'rgba(51, 65, 85, 0.3)' },
          ticks: {
            color: '#94a3b8',
            callback: function(value) {
              return value.toLocaleString() + ' kg';
            }
          }
        }
      }
    }
  });
}

function renderFleetGrid() {
  const fleetGrid = document.getElementById('fleetGrid');
  const fleet = dashboardData.fleet;

  fleetGrid.innerHTML = fleet.map(vehicle => {
    const batteryClass = vehicle.batteryLevel < 20 ? 'low' : vehicle.batteryLevel < 50 ? 'medium' : '';

    return `
      <div class="fleet-card">
        <div class="fleet-header">
          <div class="fleet-info">
            <h4>${vehicle.make} ${vehicle.model}</h4>
            <p>${vehicle.id}</p>
          </div>
          <span class="status-badge ${vehicle.status}">${vehicle.status.replace('-', ' ')}</span>
        </div>

        <div class="battery-indicator">
          <div class="battery-label">
            <span>Battery Level</span>
            <strong>${vehicle.batteryLevel}%</strong>
          </div>
          <div class="battery-bar">
            <div class="battery-fill ${batteryClass}" style="width: ${vehicle.batteryLevel}%"></div>
          </div>
        </div>

        <div class="fleet-stats">
          <div class="stat-item">
            <span class="stat-label">Range</span>
            <span class="stat-value">${vehicle.range} / ${vehicle.maxRange} km</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Battery Health</span>
            <span class="stat-value">${vehicle.batteryHealth}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Efficiency</span>
            <span class="stat-value">${vehicle.efficiency} km/kWh</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Distance</span>
            <span class="stat-value">${vehicle.totalKm.toLocaleString()} km</span>
          </div>
        </div>

        <div class="fleet-footer">
          <div class="driver-info">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm2 2a4 4 0 00-4 0c-1.5.8-2 2-2 3v1h8v-1c0-1-.5-2.2-2-3z"/>
            </svg>
            ${vehicle.driver}
          </div>
          <span class="co2-badge">${vehicle.co2Saved} kg CO₂</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderLeaderboard() {
  const leaderboard = document.getElementById('leaderboard');
  const sorted = [...dashboardData.efficiencyData].sort((a, b) => b.co2Saved - a.co2Saved);

  leaderboard.innerHTML = sorted.map((item, index) => {
    const vehicle = dashboardData.fleet.find(v => v.id === item.vehicle);
    const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';

    return `
      <div class="leaderboard-item">
        <div class="rank ${rankClass}">${index + 1}</div>
        <div class="leaderboard-info">
          <h4>${vehicle.make} ${vehicle.model}</h4>
          <p>${vehicle.driver}</p>
        </div>
        <div class="leaderboard-value">
          <div class="co2-value">${item.co2Saved.toLocaleString()} kg</div>
          <div class="efficiency">${item.efficiency} km/kWh</div>
        </div>
      </div>
    `;
  }).join('');
}

function setupNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const viewSections = document.querySelectorAll('.view-section');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;

      navBtns.forEach(b => b.classList.remove('active'));
      viewSections.forEach(section => section.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`${view}View`).classList.add('active');

      if (view === 'alerts') {
        updateAlertBadge();
      }
    });
  });
}

function setupInteractions() {
  const notificationBtn = document.getElementById('notificationBtn');
  const notificationsPanel = document.getElementById('notificationsPanel');

  notificationBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    notificationsPanel.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!notificationsPanel.contains(e.target) && e.target !== notificationBtn) {
      notificationsPanel.classList.remove('active');
    }
  });

  const exportBtn = document.getElementById('exportBtn');
  exportBtn.addEventListener('click', exportReport);

  const saveBtn = document.getElementById('saveSettings');
  const resetBtn = document.getElementById('resetSettings');
  const batteryThreshold = document.getElementById('batteryThreshold');

  saveBtn.addEventListener('click', saveSettings);
  resetBtn.addEventListener('click', resetSettings);
  batteryThreshold.addEventListener('input', (e) => {
    document.querySelector('.settings-value').textContent = e.target.value + '%';
  });
}

function renderAlerts() {
  const alertsContainer = document.getElementById('alertsContainer');
  const alerts = dashboardData.alerts || [];

  function renderFilteredAlerts(filter = 'all') {
    const filtered = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter);

    alertsContainer.innerHTML = filtered.map(alert => {
      const timeStr = getTimeString(alert.timestamp);
      const resolvedClass = alert.resolved ? 'resolved' : '';

      return `
        <div class="alert-card ${resolvedClass}">
          <div class="alert-header">
            <div class="alert-title">${alert.title}</div>
            <span class="alert-badge ${alert.severity}">
              ${alert.severity === 'critical' ? '⚠️' : alert.severity === 'warning' ? '⚡' : 'ℹ️'}
              ${alert.severity}
            </span>
          </div>
          <div class="alert-vehicle">${alert.vehicleId} - ${alert.vehicleInfo}</div>
          <div class="alert-message">${alert.message}</div>
          <div class="alert-meta">
            <span class="alert-time">${timeStr}</span>
            <div class="alert-actions">
              ${!alert.resolved ? `
                <button class="alert-action-btn resolve" onclick="resolveAlert('${alert.id}')">Resolve</button>
                <button class="alert-action-btn dismiss" onclick="dismissAlert('${alert.id}')">Dismiss</button>
              ` : `<span style="color: var(--text-secondary);">Resolved</span>`}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderFilteredAlerts(btn.dataset.filter);
    });
  });

  renderFilteredAlerts();
}

function getTimeString(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}



function resolveAlert(alertId) {
  const alert = dashboardData.alerts.find(a => a.id === alertId);
  if (alert) {
    alert.resolved = true;
    renderAlerts();
    updateAlertBadge();
  }
}

function dismissAlert(alertId) {
  dashboardData.alerts = dashboardData.alerts.filter(a => a.id !== alertId);
  renderAlerts();
  updateAlertBadge();
}

// Make sure these are globally accessible
window.resolveAlert = resolveAlert;
window.dismissAlert = dismissAlert;


function updateAlertBadge() {
  const unresolvedCount = dashboardData.alerts.filter(a => !a.resolved).length;
  const badge = document.getElementById('notificationBadge');
  badge.textContent = unresolvedCount;
  badge.style.display = unresolvedCount > 0 ? 'block' : 'none';
}

function saveSettings() {
  const settings = {
    batteryThreshold: document.getElementById('batteryThreshold').value,
    emailNotifications: document.getElementById('emailNotifications').checked,
    smsAlerts: document.getElementById('smsAlerts').checked,
    alertFrequency: document.getElementById('alertFrequency').value,
    batteryMonitoring: document.getElementById('batteryMonitoring').checked,
    maintenanceReminder: document.getElementById('maintenanceReminder').value,
    co2Target: document.getElementById('co2Target').value,
    distanceUnit: document.getElementById('distanceUnit').value,
    energyUnit: document.getElementById('energyUnit').value,
    chartPeriod: document.getElementById('chartPeriod').value
  };

  localStorage.setItem('ecofleetSettings', JSON.stringify(settings));

  const saveBtn = document.getElementById('saveSettings');
  const originalText = saveBtn.textContent;
  saveBtn.textContent = 'Saved!';
  setTimeout(() => {
    saveBtn.textContent = originalText;
  }, 2000);
}

function loadSettings() {
  const saved = localStorage.getItem('ecofleetSettings');
  if (saved) {
    const settings = JSON.parse(saved);
    document.getElementById('batteryThreshold').value = settings.batteryThreshold || 20;
    document.getElementById('emailNotifications').checked = settings.emailNotifications !== false;
    document.getElementById('smsAlerts').checked = settings.smsAlerts !== false;
    document.getElementById('alertFrequency').value = settings.alertFrequency || 'immediate';
    document.getElementById('batteryMonitoring').checked = settings.batteryMonitoring !== false;
    document.getElementById('maintenanceReminder').value = settings.maintenanceReminder || 30;
    document.getElementById('co2Target').value = settings.co2Target || 15;
    document.getElementById('distanceUnit').value = settings.distanceUnit || 'km';
    document.getElementById('energyUnit').value = settings.energyUnit || 'kwh';
    document.getElementById('chartPeriod').value = settings.chartPeriod || 'month';
    document.querySelector('.settings-value').textContent = (settings.batteryThreshold || 20) + '%';
  }
}

function resetSettings() {
  localStorage.removeItem('ecofleetSettings');
  document.getElementById('batteryThreshold').value = 20;
  document.getElementById('emailNotifications').checked = true;
  document.getElementById('smsAlerts').checked = true;
  document.getElementById('alertFrequency').value = 'immediate';
  document.getElementById('batteryMonitoring').checked = true;
  document.getElementById('maintenanceReminder').value = 30;
  document.getElementById('co2Target').value = 15;
  document.getElementById('distanceUnit').value = 'km';
  document.getElementById('energyUnit').value = 'kwh';
  document.getElementById('chartPeriod').value = 'month';
  document.querySelector('.settings-value').textContent = '20%';
}

function exportReport() {
  const report = {
    generated: new Date().toISOString(),
    summary: {
      totalVehicles: dashboardData.fleet.length,
      avgRange: Math.round(dashboardData.fleet.reduce((sum, v) => sum + v.range, 0) / dashboardData.fleet.length),
      totalCO2Saved: dashboardData.fleet.reduce((sum, v) => sum + v.co2Saved, 0),
      avgEfficiency: (dashboardData.fleet.reduce((sum, v) => sum + v.efficiency, 0) / dashboardData.fleet.length).toFixed(2)
    },
    fleet: dashboardData.fleet,
    chargingHistory: dashboardData.chargingHistory,
    batteryHealthTrend: dashboardData.batteryHealthTrend
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ecofleet-report-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function getVehicleAlerts(vehicleId) {
  return dashboardData.alerts.filter(a => a.vehicleId === vehicleId && !a.resolved);
}

function getAlertSeverity(vehicleId) {
  const alerts = getVehicleAlerts(vehicleId);
  if (alerts.some(a => a.severity === 'critical')) return 'critical';
  if (alerts.some(a => a.severity === 'warning')) return 'warning';
  if (alerts.length > 0) return 'info';
  return 'ok';
}

function createMarkerIcon(severity, status) {
  const colors = {
    critical: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    ok: '#10b981'
  };

  const color = colors[severity] || colors.ok;

  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        font-size: 16px;
      ">
        ${severity === 'critical' ? '⚠️' : severity === 'warning' ? '⚡' : status === 'charging' ? '🔌' : '🚗'}
      </div>
    `,
    iconSize: [32, 32],
    className: 'vehicle-marker'
  });
}

function initializeMap() {
  const container = document.getElementById('mapContainer');
  if (!container) return;

  mapInstance = L.map('mapContainer').setView([40.7505, -73.9972], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(mapInstance);

  renderMapMarkers();
  renderVehicleList();
  setupMapControls();

  setTimeout(() => {
    mapInstance.invalidateSize();
  }, 300);
}

function renderMapMarkers() {
  Object.values(vehicleMarkers).forEach(marker => {
    if (mapInstance && marker._map) {
      mapInstance.removeLayer(marker);
    }
  });
  vehicleMarkers = {};

  dashboardData.fleet.forEach(vehicle => {
    const alerts = getVehicleAlerts(vehicle.id);
    const severity = getAlertSeverity(vehicle.id);

    const marker = L.marker(
      [vehicle.location.lat, vehicle.location.lng],
      { icon: createMarkerIcon(severity, vehicle.status) }
    );

    const alertsHtml = alerts.length > 0
      ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(51, 65, 85, 0.5);">
           <h4 style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #1f2937;">Alerts</h4>
           ${alerts.map(a => `
             <div style="font-size: 11px; padding: 4px 6px; background: rgba(239, 68, 68, 0.1); border-left: 2px solid #ef4444; margin: 4px 0; color: #7f1d1d;">
               ${a.title}
             </div>
           `).join('')}
         </div>`
      : '';

    const popupContent = `
      <div class="marker-popup-content">
        <h4>${vehicle.make} ${vehicle.model}</h4>
        <p><strong>${vehicle.id}</strong></p>
        <p>Driver: ${vehicle.driver}</p>
        <p>Battery: ${vehicle.batteryLevel}% | Range: ${vehicle.range}km</p>
        <p>Status: <strong>${vehicle.status.toUpperCase()}</strong></p>
        ${alertsHtml}
      </div>
    `;

    marker.bindPopup(popupContent, { maxWidth: 250 });

    marker.on('click', () => {
      highlightVehicleInList(vehicle.id);
    });

    marker.addTo(mapInstance);
    vehicleMarkers[vehicle.id] = marker;
  });
}

function renderVehicleList() {
  const vehicleList = document.getElementById('vehicleList');
  vehicleList.innerHTML = dashboardData.fleet.map(vehicle => {
    const alerts = getVehicleAlerts(vehicle.id);
    const severity = getAlertSeverity(vehicle.id);

    return `
      <div class="vehicle-list-item" data-vehicle-id="${vehicle.id}" onclick="focusVehicle('${vehicle.id}')">
        <h4>${vehicle.make} ${vehicle.model}</h4>
        <p>${vehicle.id}</p>
        <p>Driver: ${vehicle.driver}</p>
        <p>Battery: ${vehicle.batteryLevel}% | Range: ${vehicle.range}km</p>
        ${alerts.length > 0 ? `
          <div class="vehicle-status-indicator ${severity}">
            ${severity === 'critical' ? '⚠️' : severity === 'warning' ? '⚡' : 'ℹ️'}
            ${alerts.length} alert${alerts.length > 1 ? 's' : ''}
          </div>
        ` : `
          <div class="vehicle-status-indicator ok">
            ✓ No alerts
          </div>
        `}
      </div>
    `;
  }).join('');
}

function focusVehicle(vehicleId) {
  const vehicle = dashboardData.fleet.find(v => v.id === vehicleId);
  if (vehicle && vehicleMarkers[vehicleId] && mapInstance) {
    highlightVehicleInList(vehicleId);
    mapInstance.setView([vehicle.location.lat, vehicle.location.lng], 15);
    vehicleMarkers[vehicleId].openPopup();
  }
}

function highlightVehicleInList(vehicleId) {
  document.querySelectorAll('.vehicle-list-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`[data-vehicle-id="${vehicleId}"]`)?.classList.add('active');
}

function setupMapControls() {
  const centerBtn = document.getElementById('centerMapBtn');
  const filterBtn = document.getElementById('filterMapBtn');

  if (centerBtn) {
    centerBtn.addEventListener('click', () => {
      const bounds = L.latLngBounds(
        dashboardData.fleet.map(v => [v.location.lat, v.location.lng])
      );
      mapInstance.fitBounds(bounds, { padding: [50, 50] });
    });
  }

  if (filterBtn) {
    filterBtn.addEventListener('click', () => {
      const alertOnly = filterBtn.dataset.filterMode === 'alerts';
      filterBtn.dataset.filterMode = alertOnly ? 'all' : 'alerts';
      filterBtn.style.opacity = alertOnly ? '1' : '0.6';

      if (!alertOnly) {
        Object.keys(vehicleMarkers).forEach(vehicleId => {
          const vehicle = dashboardData.fleet.find(v => v.id === vehicleId);
          const alerts = getVehicleAlerts(vehicleId);
          const severity = getAlertSeverity(vehicleId);

          const marker = vehicleMarkers[vehicleId];
          marker.setIcon(createMarkerIcon(severity, vehicle.status));
          marker.setOpacity(1);
        });
      } else {
        Object.keys(vehicleMarkers).forEach(vehicleId => {
          const alerts = getVehicleAlerts(vehicleId);
          const marker = vehicleMarkers[vehicleId];

          if (alerts.length === 0) {
            marker.setOpacity(0.3);
          } else {
            marker.setOpacity(1);
          }
        });
      }
    });

// function resolveAlert(alertId) {
//   const alert = dashboardData.alerts.find(a => a.id === alertId);
//   if (alert) {
//     alert.resolved = true;
//     renderAlerts();
//     updateAlertBadge();
//   }
// }

// function dismissAlert(alertId) {
//   dashboardData.alerts = dashboardData.alerts.filter(a => a.id !== alertId);
//   renderAlerts();
//   updateAlertBadge();
// }
  }
}

loadData();
