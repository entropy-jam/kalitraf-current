/**
 * Railway Built-in WebSocket Service
 * Connects directly to Railway's WebSocket server running on port 8080
 */

class RailwayWebSocketService {
  constructor() {
    this.websocket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000; // 5 seconds
    this.reconnectTimer = null;
    
    this.eventHandlers = {
      onIncidentUpdate: null,
      onError: null,
      onConnectionChange: null,
      onScrapeSummary: null
    };
  }

  /**
   * Initialize WebSocket connection to Railway server
   */
  async initialize() {
    try {
      // Get the current host (Railway will provide the domain)
      // Try WSS first, fallback to WS if needed
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;
      
      console.log(`🔗 Connecting to Railway WebSocket: ${wsUrl}`);
      
      this.websocket = new WebSocket(wsUrl);
      
      // Set up event handlers
      this.setupEventHandlers();
      
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket:', error);
      this.handleConnectionError(error);
    }
  }

  /**
   * Set up WebSocket event handlers
   */
  setupEventHandlers() {
    this.websocket.onopen = () => {
      console.log('✅ Connected to Railway WebSocket server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionChange(true);
    };

    this.websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('❌ Failed to parse WebSocket message:', error);
      }
    };

    this.websocket.onclose = (event) => {
      console.log('🔌 WebSocket connection closed:', event.code, event.reason);
      this.isConnected = false;
      this.notifyConnectionChange(false);
      
      if (!event.wasClean) {
        this.attemptReconnect();
      }
    };

    this.websocket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      this.handleConnectionError(error);
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(data) {
    console.log('📡 Received WebSocket message:', data);

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

  /**
   * Set event handlers
   */
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

  /**
   * Handle connection errors
   */
  handleConnectionError(error) {
    this.isConnected = false;
    this.notifyConnectionChange(false);
    
    if (this.eventHandlers.onError) {
      this.eventHandlers.onError({
        type: 'connection-error',
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.initialize();
    }, delay);
  }

  /**
   * Notify connection status change
   */
  notifyConnectionChange(connected) {
    if (this.eventHandlers.onConnectionChange) {
      this.eventHandlers.onConnectionChange({
        connected,
        reconnectAttempts: this.reconnectAttempts,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Send message to WebSocket server
   */
  send(message) {
    if (this.isConnected && this.websocket) {
      this.websocket.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message');
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    this.isConnected = false;
    console.log('🔌 Disconnected from Railway WebSocket server');
  }
}

// Export for use in other modules
export default RailwayWebSocketService;
