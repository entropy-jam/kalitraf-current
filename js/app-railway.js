/**
 * Railway Main Application Entry Point with Built-in WebSocket Support
 * Uses Railway's built-in WebSocket server instead of external Pusher
 */

// Railway WebSocket configuration
const RAILWAY_CONFIG = {
  websocket: {
    url: window.location.protocol === 'https:' 
      ? `wss://${window.location.host}/ws?upgrade_wait=0s&first_msg_wait=0s`
      : `ws://${window.location.hostname}:8080`,
    reconnectInterval: 5000,
    maxReconnectAttempts: 10
  },
  centers: {
    BFCC: { name: 'Bakersfield', channel: 'chp-incidents-bfcc' },
    BSCC: { name: 'Barstow', channel: 'chp-incidents-bscc' },
    BICC: { name: 'Bishop', channel: 'chp-incidents-bicc' },
    BCCC: { name: 'Border', channel: 'chp-incidents-bccc' },
    CCCC: { name: 'Capitol', channel: 'chp-incidents-cccc' },
    CHCC: { name: 'Chico', channel: 'chp-incidents-chcc' },
    ECCC: { name: 'El Centro', channel: 'chp-incidents-eccc' },
    FRCC: { name: 'Fresno', channel: 'chp-incidents-frcc' },
    GGCC: { name: 'Golden Gate', channel: 'chp-incidents-ggcc' },
    HMCC: { name: 'Humboldt', channel: 'chp-incidents-hmcc' },
    ICCC: { name: 'Indio', channel: 'chp-incidents-iccc' },
    INCC: { name: 'Inland', channel: 'chp-incidents-incc' },
    LACC: { name: 'Los Angeles', channel: 'chp-incidents-lacc' },
    MRCC: { name: 'Merced', channel: 'chp-incidents-mrcc' },
    MYCC: { name: 'Monterey', channel: 'chp-incidents-mycc' },
    OCCC: { name: 'Orange County', channel: 'chp-incidents-occc' },
    RDCC: { name: 'Redding', channel: 'chp-incidents-rdcc' },
    SACC: { name: 'Sacramento', channel: 'chp-incidents-sacc' },
    SLCC: { name: 'San Luis Obispo', channel: 'chp-incidents-slcc' },
    SKCCSTCC: { name: 'Stockton', channel: 'chp-incidents-skccstcc' },
    SUCC: { name: 'Susanville', channel: 'chp-incidents-succ' },
    TKCC: { name: 'Truckee', channel: 'chp-incidents-tkcc' },
    UKCC: { name: 'Ukiah', channel: 'chp-incidents-ukcc' },
    VTCC: { name: 'Ventura', channel: 'chp-incidents-vtcc' },
    YKCC: { name: 'Yreka', channel: 'chp-incidents-ykcc' }
  }
};

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

// Railway WebSocket Service
class RailwayWebSocketService {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = RAILWAY_CONFIG.websocket.maxReconnectAttempts;
        this.reconnectInterval = RAILWAY_CONFIG.websocket.reconnectInterval;
        this.eventHandlers = {
            onIncidentUpdate: null,
            onError: null,
            onConnectionChange: null,
            onScrapeSummary: null
        };
    }

    async connect() {
        try {
            console.log('🔗 Connecting to Railway WebSocket...');
            this.ws = new WebSocket(RAILWAY_CONFIG.websocket.url);
            
            this.ws.onopen = () => {
                console.log('✅ Railway WebSocket connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.notifyConnectionChange(true);
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('❌ Error parsing WebSocket message:', error);
                }
            };

            this.ws.onclose = () => {
                console.log('🔌 Railway WebSocket disconnected');
                this.isConnected = false;
                this.notifyConnectionChange(false);
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('❌ Railway WebSocket error:', error);
                this.handleError(error);
            };

        } catch (error) {
            console.error('❌ Failed to connect to Railway WebSocket:', error);
            this.handleError(error);
        }
    }

    handleMessage(data) {
        console.log('📡 Received Railway WebSocket message:', data);

        switch (data.type) {
            case 'incident_update':
                if (this.eventHandlers.onIncidentUpdate) {
                    this.eventHandlers.onIncidentUpdate(data.data);
                }
                break;
            case 'scrape_summary':
                if (this.eventHandlers.onScrapeSummary) {
                    this.eventHandlers.onScrapeSummary(data.data);
                }
                break;
            default:
                console.log('📡 Unknown message type:', data.type);
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

        setTimeout(() => {
            this.connect();
        }, delay);
    }

    handleError(error) {
        if (this.eventHandlers.onError) {
            this.eventHandlers.onError({
                type: 'websocket-error',
                error: error.message || 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }

    notifyConnectionChange(connected) {
        if (this.eventHandlers.onConnectionChange) {
            this.eventHandlers.onConnectionChange({
                connected,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Event handler setters
    onIncidentUpdate(handler) {
        this.eventHandlers.onIncidentUpdate = handler;
    }

    onError(handler) {
        this.eventHandlers.onError = handler;
    }

    onConnectionChange(handler) {
        this.eventHandlers.onConnectionChange = handler;
    }

    onScrapeSummary(handler) {
        this.eventHandlers.onScrapeSummary = handler;
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        console.log('🔌 Railway WebSocket disconnected');
    }
}

// Connection Status Manager
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
            <span class="status-text">Connecting to Railway...</span>
        `;

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
            text.textContent = message || '🟢 Railway Connected';
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

// Railway App Controller
class RailwayAppController {
    constructor() {
        this.websocketService = new RailwayWebSocketService();
        this.connectionManager = new ConnectionStatusManager();
        this.appController = null;
        this.isInitialized = false;
        this.centerStatuses = new Map();
    }

    async initialize() {
        try {
            console.log('🚀 Initializing Railway CHP Traffic Monitor...');

            // Initialize the app controller with dependency injection
            const container = new DependencyContainer();
            DefaultDependencyConfig.configure(container);
            this.appController = container.createAppController();
            await this.appController.initialize();

            // Set up Railway WebSocket service
            await this.setupRailwayWebSocket();

            // Set up UI enhancements
            this.setupRailwayUI();

            this.isInitialized = true;
            console.log('✅ Railway app initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize Railway app:', error);
            this.connectionManager.showError(error.message);
        }
    }

    async setupRailwayWebSocket() {
        // Set up event handlers
        this.websocketService.onIncidentUpdate((data) => {
            console.log(`📡 [${data.center}] Railway incident update:`, data);
            this.handleIncidentUpdate(data);
        });

        this.websocketService.onError((error) => {
            console.error(`❌ Railway WebSocket error:`, error);
            this.connectionManager.showError(error.error || 'Connection error');
        });

        this.websocketService.onConnectionChange((status) => {
            console.log('🔗 Railway connection status changed:', status);
            this.connectionManager.updateStatus(status.connected);
        });

        this.websocketService.onScrapeSummary((data) => {
            console.log('📊 Railway scrape summary:', data);
            this.handleScrapeSummary(data);
        });

        // Connect to Railway WebSocket
        await this.websocketService.connect();
    }

    setupRailwayUI() {
        // Add Railway-specific controls
        this.addRailwayControls();

        // Add connection status styles
        this.addConnectionStatusStyles();
    }

    addRailwayControls() {
        const controlsDiv = document.querySelector('.controls');
        if (!controlsDiv) return;

        // Railway status container removed
    }

    addConnectionStatusStyles() {
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

            /* Railway status container CSS removed */
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

    handleScrapeSummary(data) {
        console.log('📊 Railway scrape completed:', data);
        
        // Update center statuses
        data.results.forEach(result => {
            this.centerStatuses.set(result.center, {
                status: result.status,
                incidentCount: result.get('incidentCount', 0),
                lastUpdate: result.timestamp
            });
        });

        // Show summary notification
        const totalIncidents = data.totalIncidents;
        const centers = data.centers;
        
        this.showNotification(
            `Railway scrape completed: ${totalIncidents} incidents across ${centers} centers`,
            'info'
        );
    }

    showUpdateNotification(data) {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span>📡 Update: ${data.centerName}</span>
                <span class="timestamp">${new Date(data.timestamp).toLocaleTimeString()}</span>
            </div>
        `;

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

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    showNotification(message, type) {
        // Simple notification system
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
    }

    destroy() {
        if (this.websocketService) {
            this.websocketService.disconnect();
        }

        if (this.appController && this.appController.destroy) {
            this.appController.destroy();
        }
    }
}

// Export classes to window for diagnostic access
window.RailwayAppController = RailwayAppController;
window.RailwayWebSocketService = RailwayWebSocketService;
window.ConnectionStatusManager = ConnectionStatusManager;
window.ThemeManager = ThemeManager;

// Initialize Railway app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize theme manager
        const themeManager = new ThemeManager();

        // Initialize Railway app
        const app = new RailwayAppController();
        await app.initialize();

        // Clean up on page unload
        window.addEventListener('beforeunload', () => {
            app.destroy();
        });
    } catch (error) {
        console.error('Failed to start Railway application:', error);
    }
});
