/**
 * Server-Sent Events Service
 * Handles real-time updates via SSE instead of WebSocket
 */

class SSEService {
    constructor() {
        this.eventSource = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectInterval = 5000; // 5 seconds
        this.eventHandlers = {
            onIncidentUpdate: null,
            onError: null,
            onConnectionChange: null,
            onScrapeSummary: null,
            onInitialData: null
        };
    }

    /**
     * Connect to SSE stream
     */
    async connect() {
        try {
            console.log('🔗 Connecting to SSE stream...');
            
            // Determine the correct URL based on environment
            const sseUrl = this.getSSEUrl();
            this.eventSource = new EventSource(sseUrl);
            
            this.eventSource.onopen = () => {
                console.log('✅ SSE connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.notifyConnectionChange(true);
            };

            this.eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('❌ Error parsing SSE message:', error);
                }
            };

            this.eventSource.onerror = (error) => {
                console.error('❌ SSE error:', error);
                console.error('❌ EventSource readyState:', this.eventSource?.readyState);
                console.error('❌ EventSource URL:', this.eventSource?.url);
                this.isConnected = false;
                this.notifyConnectionChange(false);
                this.attemptReconnect();
            };

        } catch (error) {
            console.error('❌ Failed to connect to SSE:', error);
            this.handleError(error);
        }
    }

    /**
     * Get the appropriate SSE URL based on environment
     */
    getSSEUrl() {
        // For local development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:8081/api/incidents/stream';
        }
        
        // For file:// protocol (local testing) or production (Railway)
        if (window.location.protocol === 'file:' || !window.location.host) {
            return 'https://kalitraf-production.up.railway.app/api/incidents/stream';
        }
        
        // For production (Railway)
        return `${window.location.protocol}//${window.location.host}/api/incidents/stream`;
    }

    /**
     * Handle incoming SSE messages
     */
    handleMessage(data) {
        console.log('📡 Received SSE message:', data);

        switch (data.type) {
            case 'welcome':
                console.log('👋 SSE welcome message:', data.message);
                break;
                
            case 'initial_data':
                console.log('📊 Received initial data:', data.data);
                if (this.eventHandlers.onInitialData) {
                    this.eventHandlers.onInitialData(data.data);
                }
                break;
                
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
                
            case 'heartbeat':
                // Keep connection alive - no action needed
                break;
                
            default:
                console.log('📡 Unknown SSE message type:', data.type);
        }
    }

    /**
     * Attempt to reconnect with exponential backoff
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`🔄 Attempting SSE reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

        setTimeout(() => {
            this.connect();
        }, delay);
    }

    /**
     * Handle errors
     */
    handleError(error) {
        if (this.eventHandlers.onError) {
            this.eventHandlers.onError({
                type: 'sse-error',
                error: error.message || 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Notify connection status change
     */
    notifyConnectionChange(connected) {
        if (this.eventHandlers.onConnectionChange) {
            this.eventHandlers.onConnectionChange({
                connected,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Set incident update handler
     */
    onIncidentUpdate(handler) {
        this.eventHandlers.onIncidentUpdate = handler;
    }

    /**
     * Set error handler
     */
    onError(handler) {
        this.eventHandlers.onError = handler;
    }

    /**
     * Set connection change handler
     */
    onConnectionChange(handler) {
        this.eventHandlers.onConnectionChange = handler;
    }

    /**
     * Set scrape summary handler
     */
    onScrapeSummary(handler) {
        this.eventHandlers.onScrapeSummary = handler;
    }

    /**
     * Set initial data handler
     */
    onInitialData(handler) {
        this.eventHandlers.onInitialData = handler;
    }

    /**
     * Disconnect from SSE stream
     */
    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        this.isConnected = false;
        console.log('🔌 SSE disconnected');
    }

    /**
     * Check if connected
     */
    isSSEConnected() {
        return this.isConnected && this.eventSource && this.eventSource.readyState === EventSource.OPEN;
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        if (!this.eventSource) {
            return 'disconnected';
        }
        
        switch (this.eventSource.readyState) {
            case EventSource.CONNECTING:
                return 'connecting';
            case EventSource.OPEN:
                return 'connected';
            case EventSource.CLOSED:
                return 'disconnected';
            default:
                return 'unknown';
        }
    }
}

// Export for use in other modules
window.SSEService = SSEService;
