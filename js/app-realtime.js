/**
 * Enhanced Main Application Entry Point with Real-time WebSocket Support
 * Integrates Pusher for real-time incident updates
 */

// Import the Railway WebSocket service and configuration
import RailwayWebSocketService from './services/railway-websocket-service.js';
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

// Connection status manager removed - no longer needed

// Enhanced App Controller with Railway WebSocket Support
class RealtimeAppController {
    constructor() {
        // WebSocket service disabled for now
        // this.websocketService = new RailwayWebSocketService();
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
        
        // WebSocket service disabled for now
        // await this.setupWebSocketService();
        
        // WebSocket service disabled for now
        // if (this.appController.incidentService) {
        //     // Add WebSocket integration to incident service
        //     this.appController.incidentService.setWebSocketService(this.websocketService);
        // }
            
            // Set up UI enhancements
            this.setupRealtimeUI();
            
            this.isInitialized = true;
            console.log('✅ Real-time app initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize real-time app:', error);
        }
    }

    async setupWebSocketService() {
        try {
            // Set up event handlers
            this.websocketService.onIncidentUpdate((data) => {
                console.log(`📡 [${data.center}] Real-time incident update received:`, data);
                this.handleIncidentUpdate(data);
            });

            this.websocketService.onError((error) => {
                console.error(`❌ Railway WebSocket error:`, error);
            });

            this.websocketService.onConnectionChange((status) => {
                console.log('🔗 Connection status changed:', status);
            });

            this.websocketService.onScrapeSummary((data) => {
                console.log(`📊 Scrape summary received:`, data);
                this.handleScrapeSummary(data);
            });

            // Initialize the Railway WebSocket service
            await this.websocketService.initialize();

            // Track subscribed centers
            const allCenters = getAllCenterCodes();
            this.subscribedCenters = new Set(allCenters);
            console.log(`📡 Connected to Railway WebSocket server for ${allCenters.length} communication centers:`, allCenters);
            
        } catch (error) {
            console.warn('⚠️ Railway WebSocket initialization failed, falling back to file-based data:', error);
            
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

        // Real-time toggle removed

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

        // Real-time toggle event listeners removed

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
        refreshBtn.textContent = '🔄 Refresh Now';
        
        refreshBtn.addEventListener('click', async () => {
            try {
                const center = document.getElementById('centerSelect')?.value || 'BCCC';
                await this.triggerScrapingCenter(center);
                
                // Show feedback
                refreshBtn.textContent = '✅ Scraping...';
                setTimeout(() => {
                    refreshBtn.textContent = '🔄 Refresh Now';
                }, 2000);
                
            } catch (error) {
                console.error('❌ Failed to trigger scraping:', error);
                refreshBtn.textContent = '❌ Error';
                setTimeout(() => {
                    refreshBtn.textContent = '🔄 Refresh Now';
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
            
            /* Real-time toggle CSS removed */
            
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

    handleScrapeSummary(data) {
        console.log('📊 Processing scrape summary:', data);
        
        // Update center statuses from summary
        if (data.results) {
            data.results.forEach(result => {
                this.centerStatuses.set(result.center, {
                    status: result.status,
                    lastUpdate: result.timestamp,
                    incidentCount: result.incidentCount || 0,
                    health: result.status === 'success' ? 'active' : 'warning'
                });
                
                // Update UI indicators
                this.updateCenterStatusIndicator({
                    center: result.center,
                    centerName: result.centerName,
                    status: result.status,
                    lastUpdate: result.timestamp,
                    incidentCount: result.incidentCount || 0
                });
            });
        }
        
        // Show summary notification
        this.showUpdateNotification({
            center: 'ALL',
            centerName: 'All Centers',
            timestamp: data.timestamp,
            eventType: 'scrape-summary',
            totalIncidents: data.totalIncidents
        });
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
            
            // Send message to Railway WebSocket server to trigger scraping
            this.websocketService.send({
                type: 'trigger_scraping',
                center: 'all'
            });
            
            // Show notification
            this.showUpdateNotification({
                center: 'ALL',
                centerName: 'All Centers',
                timestamp: new Date().toISOString(),
                eventType: 'scrape-all-triggered'
            });
        } catch (error) {
            console.error('❌ Failed to trigger scraping for all centers:', error);
        }
    }

    async triggerScrapingCenter(centerCode) {
        try {
            console.log(`🔄 Triggering scraping for ${centerCode}...`);
            
            // Send message to Railway WebSocket server to trigger scraping
            this.websocketService.send({
                type: 'trigger_scraping',
                center: centerCode
            });
            
            // Show notification
            this.showUpdateNotification({
                center: centerCode,
                centerName: WEBSOCKET_CONFIG.centers[centerCode]?.name || centerCode,
                timestamp: new Date().toISOString(),
                eventType: 'scrape-triggered'
            });
        } catch (error) {
            console.error(`❌ Failed to trigger scraping for ${centerCode}:`, error);
        }
    }

    enableRealtime() {
        console.log('🔴 Real-time updates disabled for now');
        // this.websocketService.initialize();
    }

    disableRealtime() {
        console.log('⚪ Real-time updates disabled');
        // this.websocketService.disconnect();
    }

    destroy() {
        // if (this.websocketService) {
        //     this.websocketService.disconnect();
        // }
        
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
