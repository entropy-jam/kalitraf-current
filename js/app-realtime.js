/**
 * Enhanced Main Application Entry Point with Real-time WebSocket Support
 * Integrates Pusher for real-time incident updates
 */

// Import the real-time service
import RealtimeIncidentService from './services/realtime-service.js';

// Theme management
class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.themeToggle?.addEventListener('click', () => this.toggleTheme());
    }

    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    getStoredTheme() {
        return localStorage.getItem('theme');
    }

    storeTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    applyTheme(theme) {
        document.body.classList.remove('light-theme', 'dark-theme');
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            this.themeToggle.textContent = '☀️';
        } else {
            document.body.classList.add('light-theme');
            this.themeToggle.textContent = '🌙';
        }
        this.currentTheme = theme;
        this.storeTheme(theme);
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    }
}

// Real-time connection status manager
class ConnectionStatusManager {
    constructor() {
        this.statusElement = this.createStatusElement();
        this.isConnected = false;
    }

    createStatusElement() {
        const statusDiv = document.createElement('div');
        statusDiv.id = 'connection-status';
        statusDiv.className = 'connection-status';
        statusDiv.innerHTML = `
            <span class="status-indicator"></span>
            <span class="status-text">Connecting...</span>
        `;
        
        // Insert after the header
        const header = document.querySelector('.header');
        if (header) {
            header.insertAdjacentElement('afterend', statusDiv);
        }
        
        return statusDiv;
    }

    updateStatus(connected, message = null) {
        this.isConnected = connected;
        const indicator = this.statusElement.querySelector('.status-indicator');
        const text = this.statusElement.querySelector('.status-text');
        
        if (connected) {
            indicator.className = 'status-indicator connected';
            text.textContent = message || '🟢 Real-time Connected';
            this.statusElement.className = 'connection-status connected';
        } else {
            indicator.className = 'status-indicator disconnected';
            text.textContent = message || '🔴 Disconnected';
            this.statusElement.className = 'connection-status disconnected';
        }
    }

    showError(error) {
        this.updateStatus(false, `❌ Error: ${error}`);
    }
}

// Enhanced App Controller with Real-time Support
class RealtimeAppController {
    constructor() {
        this.realtimeService = new RealtimeIncidentService();
        this.connectionManager = new ConnectionStatusManager();
        this.appController = null; // Will be initialized with existing AppController
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('🚀 Initializing real-time CHP Traffic Monitor...');
            
            // Initialize the existing app controller
            this.appController = new AppController();
            await this.appController.initialize();
            
            // Set up real-time service
            await this.setupRealtimeService();
            
            // Set up UI enhancements
            this.setupRealtimeUI();
            
            this.isInitialized = true;
            console.log('✅ Real-time app initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize real-time app:', error);
            this.connectionManager.showError(error.message);
        }
    }

    async setupRealtimeService() {
        // Set up event handlers
        this.realtimeService.onIncidentUpdate((data) => {
            console.log('📡 Real-time incident update received:', data);
            this.handleIncidentUpdate(data);
        });

        this.realtimeService.onError((error) => {
            console.error('❌ Real-time service error:', error);
            this.connectionManager.showError(error.error || 'Connection error');
        });

        this.realtimeService.onConnectionChange((status) => {
            console.log('🔗 Connection status changed:', status);
            this.connectionManager.updateStatus(status.connected);
        });

        // Initialize the real-time service
        await this.realtimeService.initialize();
    }

    setupRealtimeUI() {
        // Add real-time controls to the existing UI
        this.addRealtimeControls();
        
        // Enhance the refresh button to trigger real-time scraping
        this.enhanceRefreshButton();
        
        // Add connection status to the UI
        this.addConnectionStatus();
    }

    addRealtimeControls() {
        const controlsDiv = document.querySelector('.controls');
        if (!controlsDiv) return;

        // Add real-time toggle
        const realtimeToggle = document.createElement('label');
        realtimeToggle.className = 'realtime-toggle';
        realtimeToggle.innerHTML = `
            <input type="checkbox" id="realtimeToggle" checked>
            <span>🔴 Real-time Updates</span>
        `;
        
        controlsDiv.appendChild(realtimeToggle);

        // Add event listener for real-time toggle
        const toggle = realtimeToggle.querySelector('input');
        toggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.enableRealtime();
            } else {
                this.disableRealtime();
            }
        });
    }

    enhanceRefreshButton() {
        const refreshBtn = document.getElementById('refreshBtn');
        if (!refreshBtn) return;

        // Update button text and functionality
        refreshBtn.textContent = '🔄 Refresh Now (Real-time)';
        
        refreshBtn.addEventListener('click', async () => {
            try {
                const center = document.getElementById('centerSelect')?.value || 'BCCC';
                await this.realtimeService.triggerScraping(center);
                
                // Show feedback
                refreshBtn.textContent = '✅ Scraping...';
                setTimeout(() => {
                    refreshBtn.textContent = '🔄 Refresh Now (Real-time)';
                }, 2000);
                
            } catch (error) {
                console.error('❌ Failed to trigger scraping:', error);
                refreshBtn.textContent = '❌ Error';
                setTimeout(() => {
                    refreshBtn.textContent = '🔄 Refresh Now (Real-time)';
                }, 2000);
            }
        });
    }

    addConnectionStatus() {
        // Connection status is already added by ConnectionStatusManager
        // Add some CSS for the status indicator
        const style = document.createElement('style');
        style.textContent = `
            .connection-status {
                padding: 8px 16px;
                margin: 8px 0;
                border-radius: 4px;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.3s ease;
            }
            
            .connection-status.connected {
                background-color: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            
            .connection-status.disconnected {
                background-color: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
            
            .status-indicator {
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                margin-right: 8px;
            }
            
            .status-indicator.connected {
                background-color: #28a745;
            }
            
            .status-indicator.disconnected {
                background-color: #dc3545;
            }
            
            .realtime-toggle {
                display: flex;
                align-items: center;
                margin-left: 16px;
                cursor: pointer;
            }
            
            .realtime-toggle input {
                margin-right: 8px;
            }
        `;
        document.head.appendChild(style);
    }

    handleIncidentUpdate(data) {
        // Update the existing app with new data
        if (this.appController && this.appController.updateIncidents) {
            this.appController.updateIncidents(data.data);
        }
        
        // Show notification
        this.showUpdateNotification(data);
    }

    showUpdateNotification(data) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span>📡 Real-time update received for ${data.center}</span>
                <span class="timestamp">${new Date(data.timestamp).toLocaleTimeString()}</span>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #007bff;
            color: white;
            padding: 12px 16px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    enableRealtime() {
        console.log('🔴 Enabling real-time updates');
        this.realtimeService.initialize();
    }

    disableRealtime() {
        console.log('⚪ Disabling real-time updates');
        this.realtimeService.disconnect();
        this.connectionManager.updateStatus(false, '⚪ Real-time Disabled');
    }

    destroy() {
        if (this.realtimeService) {
            this.realtimeService.disconnect();
        }
        
        if (this.appController && this.appController.destroy) {
            this.appController.destroy();
        }
    }
}

// Initialize enhanced app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize theme manager
        const themeManager = new ThemeManager();
        
        // Initialize enhanced real-time app
        const app = new RealtimeAppController();
        await app.initialize();
        
        // Clean up on page unload
        window.addEventListener('beforeunload', () => {
            app.destroy();
        });
    } catch (error) {
        console.error('Failed to start real-time application:', error);
    }
});
