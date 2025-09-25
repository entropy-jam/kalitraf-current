/**
 * Real-time WebSocket Service using Pusher
 * Replaces file-based data fetching with real-time updates
 */

class RealtimeIncidentService {
  constructor() {
    this.pusher = null;
    this.channel = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // 1 second
    
    this.eventHandlers = {
      onIncidentUpdate: null,
      onError: null,
      onConnectionChange: null
    };
  }

  /**
   * Initialize Pusher connection
   */
  async initialize() {
    try {
      // Dynamic import of Pusher to avoid loading issues
      const Pusher = await import('pusher-js');
      
      this.pusher = new Pusher.default(process.env.PUSHER_KEY || 'your-pusher-key', {
        cluster: process.env.PUSHER_CLUSTER || 'us2',
        encrypted: true,
        authEndpoint: '/api/pusher-auth' // Optional: for private channels
      });

      // Set up connection event handlers
      this.setupConnectionHandlers();
      
      // Subscribe to incidents channel
      this.channel = this.pusher.subscribe('chp-incidents');
      
      // Set up message handlers
      this.setupMessageHandlers();
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      this.notifyConnectionChange(true);
      
      console.log('✅ Pusher connected successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Pusher:', error);
      this.handleConnectionError(error);
    }
  }

  /**
   * Set up connection event handlers
   */
  setupConnectionHandlers() {
    this.pusher.connection.bind('connected', () => {
      console.log('🔗 Pusher connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionChange(true);
    });

    this.pusher.connection.bind('disconnected', () => {
      console.log('🔌 Pusher disconnected');
      this.isConnected = false;
      this.notifyConnectionChange(false);
      this.attemptReconnect();
    });

    this.pusher.connection.bind('error', (error) => {
      console.error('❌ Pusher connection error:', error);
      this.handleConnectionError(error);
    });
  }

  /**
   * Set up message event handlers
   */
  setupMessageHandlers() {
    // Handle incident updates
    this.channel.bind('incident-update', (data) => {
      console.log('📡 Received incident update:', data);
      
      if (this.eventHandlers.onIncidentUpdate) {
        this.eventHandlers.onIncidentUpdate(data);
      }
    });

    // Handle errors
    this.channel.bind('error', (data) => {
      console.error('❌ Received error:', data);
      
      if (this.eventHandlers.onError) {
        this.eventHandlers.onError(data);
      }
    });

    // Handle connection status updates
    this.channel.bind('connection-status', (data) => {
      console.log('📊 Connection status:', data);
      this.notifyConnectionChange(data.connected);
    });
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

  /**
   * Trigger manual scraping
   */
  async triggerScraping(center = 'BCCC') {
    try {
      const response = await fetch(`/api/scrape?center=${center}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Scraping failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Scraping triggered:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Failed to trigger scraping:', error);
      throw error;
    }
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
        error: error.message,
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
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
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
   * Disconnect and cleanup
   */
  disconnect() {
    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
    }
    
    this.channel = null;
    this.isConnected = false;
    
    console.log('🔌 Pusher disconnected');
  }
}

// Export for use in other modules
export default RealtimeIncidentService;
