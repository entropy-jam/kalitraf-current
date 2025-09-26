/**
 * Enhanced Main Application Entry Point with Real-time WebSocket Support
 * Integrates Pusher for real-time incident updates
 */

// Import the real-time service and configuration
import RealtimeIncidentService from './services/realtime-service.js';
import { WEBSOCKET_CONFIG, getAllCenterCodes } from './config/websocket-config.js';

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

// Enhanced App Controller with Multi-Center Real-time Support
class RealtimeAppController {
    constructor() {
        this.realtimeService = new RealtimeIncidentService();
        this.connectionManager = new ConnectionStatusManager();
        this.appController = null; // Will be initialized with existing AppController
        this.isInitialized = false;
        this.subscribedCenters = new Set();
        this.centerStatuses = new Map();
    }

    async initialize() {
        try {
            console.log('🚀 Initializing real-time CHP Traffic Monitor...');
            
        // Initialize the existing app controller
        this.appController = new AppController();
        await this.appController.initialize();
        
        // Set up real-time service
        await this.setupRealtimeService();
        
        // Connect incident service to WebSocket service for real-time updates
        if (this.appController.incidentService) {
            // Add WebSocket integration to incident service
            this.appController.incidentService.setWebSocketService(this.realtimeService);
        }
            
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
        try {
            // Set up event handlers
            this.realtimeService.onIncidentUpdate((data) => {
                console.log(`📡 [${data.center}] Real-time incident update received:`, data);
                this.handleIncidentUpdate(data);
            });

            this.realtimeService.onError((error) => {
                console.error(`❌ [${error.center || 'Unknown'}] Real-time service error:`, error);
                this.connectionManager.showError(error.error || 'Connection error');
            });

            this.realtimeService.onConnectionChange((status) => {
                console.log('🔗 Connection status changed:', status);
                this.connectionManager.updateStatus(status.connected);
            });

            this.realtimeService.onCenterStatusChange((data) => {
                console.log(`📊 [${data.center}] Center status update:`, data);
                this.handleCenterStatusUpdate(data);
            });

            // Initialize the real-time service with all centers
            const allCenters = getAllCenterCodes();
            await this.realtimeService.initialize(allCenters);

            // Track subscribed centers
            this.subscribedCenters = new Set(allCenters);
            console.log(`📡 Subscribed to ${allCenters.length} communication centers:`, allCenters);
            
        } catch (error) {
            console.warn('⚠️ WebSocket initialization failed, falling back to file-based data:', error);
            this.connectionManager.updateStatus(false, '⚪ WebSocket Disabled - Using File Data');
            
            // Fallback: Load data from files
            await this.loadFallbackData();
        }
    }

    /**
     * Load data from files when WebSocket is not available
     */
    async loadFallbackData() {
        try {
            console.log('📁 Loading fallback data from files...');
            
            // Load data using the existing app controller
            if (this.appController && this.appController.loadData) {
                await this.appController.loadData(true); // Force refresh
                console.log('✅ Fallback data loaded successfully');
            }
        } catch (error) {
            console.error('❌ Failed to load fallback data:', error);
        }
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
            <span>🔴 Multi-Center Real-time</span>
        `;
        
        controlsDiv.appendChild(realtimeToggle);

        // Add center status container
        const statusContainer = document.createElement('div');
        statusContainer.id = 'center-status-container';
        statusContainer.className = 'center-status-container';
        statusContainer.innerHTML = `
            <h4>Communication Centers Status</h4>
            <div class="centers-grid"></div>
        `;
        
        controlsDiv.appendChild(statusContainer);

        // Add center-specific controls
        const centerControls = document.createElement('div');
        centerControls.className = 'center-controls';
        centerControls.innerHTML = `
            <h4>Center Controls</h4>
            <div class="center-buttons">
                <button id="scrapeAllCenters" class="btn btn-primary">🔄 Scrape All Centers</button>
                <button id="scrapeBCCC" class="btn btn-secondary">📡 BCCC</button>
                <button id="scrapeLACC" class="btn btn-secondary">📡 LACC</button>
                <button id="scrapeOCCC" class="btn btn-secondary">📡 OCCC</button>
                <button id="scrapeSACC" class="btn btn-secondary">📡 SACC</button>
            </div>
        `;
        
        controlsDiv.appendChild(centerControls);

        // Add event listeners
        const toggle = realtimeToggle.querySelector('input');
        toggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.enableRealtime();
            } else {
                this.disableRealtime();
            }
        });

        // Add center-specific button listeners
        document.getElementById('scrapeAllCenters')?.addEventListener('click', () => {
            this.triggerScrapingAllCenters();
        });

        document.getElementById('scrapeBCCC')?.addEventListener('click', () => {
            this.triggerScrapingCenter('BCCC');
        });

        document.getElementById('scrapeLACC')?.addEventListener('click', () => {
            this.triggerScrapingCenter('LACC');
        });

        document.getElementById('scrapeOCCC')?.addEventListener('click', () => {
            this.triggerScrapingCenter('OCCC');
        });

        document.getElementById('scrapeSACC')?.addEventListener('click', () => {
            this.triggerScrapingCenter('SACC');
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
            
            .center-status-container {
                margin: 16px 0;
                padding: 16px;
                background: #f8f9fa;
                border-radius: 8px;
                border: 1px solid #dee2e6;
            }
            
            .center-status-container h4 {
                margin: 0 0 12px 0;
                color: #495057;
                font-size: 14px;
                font-weight: 600;
            }
            
            .centers-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 12px;
            }
            
            .center-status-indicator {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                background: white;
                border-radius: 6px;
                border: 1px solid #e9ecef;
                font-size: 12px;
                transition: all 0.2s ease;
            }
            
            .center-status-indicator:hover {
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .center-code {
                font-weight: 600;
                color: #495057;
                margin-right: 8px;
                min-width: 40px;
            }
            
            .center-name {
                flex: 1;
                color: #6c757d;
                margin-right: 8px;
            }
            
            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                margin-right: 8px;
                transition: background-color 0.2s ease;
            }
            
            .status-dot.active {
                background-color: #28a745;
            }
            
            .status-dot.inactive {
                background-color: #dc3545;
            }
            
            .status-dot.warning {
                background-color: #ffc107;
            }
            
            .incident-count {
                font-size: 11px;
                color: #6c757d;
                font-weight: 500;
            }
            
            .center-controls {
                margin: 16px 0;
                padding: 16px;
                background: #f8f9fa;
                border-radius: 8px;
                border: 1px solid #dee2e6;
            }
            
            .center-controls h4 {
                margin: 0 0 12px 0;
                color: #495057;
                font-size: 14px;
                font-weight: 600;
            }
            
            .center-buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            
            .center-buttons .btn {
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .center-buttons .btn-primary {
                background-color: #007bff;
                color: white;
            }
            
            .center-buttons .btn-primary:hover {
                background-color: #0056b3;
            }
            
            .center-buttons .btn-secondary {
                background-color: #6c757d;
                color: white;
            }
            
            .center-buttons .btn-secondary:hover {
                background-color: #545b62;
            }
        `;
        document.head.appendChild(style);
    }

    handleIncidentUpdate(data) {
        // Update the existing app with new data
        if (this.appController && this.appController.updateIncidents) {
            this.appController.updateIncidents(data);
        }
        
        // Update incident service with real-time data
        if (this.appController && this.appController.incidentService) {
            this.appController.incidentService.handleRealtimeUpdate(data);
        }
        
        // Show notification
        this.showUpdateNotification(data);
    }

    handleCenterStatusUpdate(data) {
        // Store center status
        this.centerStatuses.set(data.center, {
            status: data.status,
            lastUpdate: data.lastUpdate,
            incidentCount: data.incidentCount,
            health: data.health
        });

        // Update center status indicator in UI
        this.updateCenterStatusIndicator(data);
    }

    updateCenterStatusIndicator(data) {
        // Find or create center status indicator
        let indicator = document.getElementById(`center-status-${data.center}`);
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = `center-status-${data.center}`;
            indicator.className = 'center-status-indicator';
            indicator.innerHTML = `
                <span class="center-code">${data.center}</span>
                <span class="center-name">${data.centerName}</span>
                <span class="status-dot"></span>
                <span class="incident-count">${data.incidentCount} incidents</span>
            `;
            
            // Add to status container
            const statusContainer = document.getElementById('center-status-container');
            if (statusContainer) {
                statusContainer.appendChild(indicator);
            }
        }

        // Update status
        const statusDot = indicator.querySelector('.status-dot');
        const incidentCount = indicator.querySelector('.incident-count');
        
        statusDot.className = `status-dot ${data.status}`;
        incidentCount.textContent = `${data.incidentCount} incidents`;
        
        // Add timestamp
        indicator.title = `Last update: ${new Date(data.lastUpdate).toLocaleString()}`;
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

    async triggerScrapingAllCenters() {
        try {
            console.log('🔄 Triggering scraping for all centers...');
            const results = await this.realtimeService.triggerScrapingAllCenters();
            console.log('✅ All centers scraping completed:', results);
            
            // Show notification
            this.showUpdateNotification({
                center: 'ALL',
                centerName: 'All Centers',
                timestamp: new Date().toISOString(),
                eventType: 'scrape-all-complete'
            });
        } catch (error) {
            console.error('❌ Failed to scrape all centers:', error);
            this.connectionManager.showError(`Failed to scrape all centers: ${error.message}`);
        }
    }

    async triggerScrapingCenter(centerCode) {
        try {
            console.log(`🔄 Triggering scraping for ${centerCode}...`);
            const result = await this.realtimeService.triggerScraping(centerCode);
            console.log(`✅ ${centerCode} scraping completed:`, result);
            
            // Show notification
            this.showUpdateNotification({
                center: centerCode,
                centerName: WEBSOCKET_CONFIG.centers[centerCode]?.name || centerCode,
                timestamp: new Date().toISOString(),
                eventType: 'scrape-complete'
            });
        } catch (error) {
            console.error(`❌ Failed to scrape ${centerCode}:`, error);
            this.connectionManager.showError(`Failed to scrape ${centerCode}: ${error.message}`);
        }
    }

    enableRealtime() {
        console.log('🔴 Enabling multi-center real-time updates');
        const allCenters = getAllCenterCodes();
        this.realtimeService.initialize(allCenters);
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
