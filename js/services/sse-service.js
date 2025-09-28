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
            console.log('🔗 [SSE-CLIENT] Connecting to SSE stream...');
            
            // Determine the correct URL based on environment
            const sseUrl = this.getSSEUrl();
            console.log(`🔗 [SSE-CLIENT] SSE URL: ${sseUrl}`);
            console.log(`🔗 [SSE-CLIENT] Current location: ${window.location.href}`);
            
            this.eventSource = new EventSource(sseUrl);
            console.log('🔗 [SSE-CLIENT] EventSource created');
            
            this.eventSource.onopen = () => {
                console.log('✅ [SSE-CLIENT] SSE connection opened');
                console.log('✅ [SSE-CLIENT] ReadyState:', this.eventSource.readyState);
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.notifyConnectionChange(true);
            };

            this.eventSource.onmessage = (event) => {
                console.log('📨 [SSE-CLIENT] Received message:', event.data.substring(0, 100) + '...');
                try {
                    const data = JSON.parse(event.data);
                    console.log('📨 [SSE-CLIENT] Parsed data type:', data.type);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('❌ [SSE-CLIENT] Error parsing SSE message:', error);
                    console.error('❌ [SSE-CLIENT] Raw data:', event.data);
                }
            };

            this.eventSource.onerror = (error) => {
                console.error('❌ [SSE-CLIENT] SSE error:', error);
                console.error('❌ [SSE-CLIENT] ReadyState:', this.eventSource.readyState);
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
            return 'http://localhost:8082/api/incidents/stream';
        }
        
        // For file:// protocol (local testing)
        if (window.location.protocol === 'file:') {
            return 'https://kalitraf-production.up.railway.app/api/incidents/stream';
        }
        
        // For production (Railway) - use the current host
        return `${window.location.protocol}//${window.location.host}/api/incidents/stream`;
    }

    /**
     * Handle incoming SSE messages
     */
    handleMessage(data) {
        console.log('📡 [SSE-CLIENT] Received SSE message type:', data.type);
        console.log('📡 [SSE-CLIENT] Message data keys:', Object.keys(data));

        switch (data.type) {
            case 'welcome':
                console.log('👋 [SSE-CLIENT] SSE welcome message:', data.message);
                console.log('👋 [SSE-CLIENT] Connection ID:', data.connection_id);
                break;
                
            case 'initial_data':
                console.log('📊 [SSE-CLIENT] Received initial data');
                console.log('📊 [SSE-CLIENT] Data centers:', Object.keys(data.data || {}));
                console.log('📊 [SSE-CLIENT] Total incidents:', data.data?.results?.length || 0);
                if (this.eventHandlers.onInitialData) {
                    console.log('📊 [SSE-CLIENT] Calling onInitialData handler');
                    this.eventHandlers.onInitialData(data.data);
                } else {
                    console.warn('⚠️ [SSE-CLIENT] No onInitialData handler registered');
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
