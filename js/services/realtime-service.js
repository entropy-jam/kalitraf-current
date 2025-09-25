/**
 * Multi-Center Real-time WebSocket Service using Pusher
 * Handles all CHP Communication Centers: BCCC, LACC, OCCC, SACC
 */

import { WEBSOCKET_CONFIG, getAllChannels, getCenterInfo } from '../config/websocket-config.js';

class RealtimeIncidentService {
  constructor() {
    this.pusher = null;
    this.channels = new Map(); // Map of center codes to channels
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = WEBSOCKET_CONFIG.reconnection.maxAttempts;
    this.reconnectDelay = WEBSOCKET_CONFIG.reconnection.interval;
    this.subscribedCenters = new Set();
    
    this.eventHandlers = {
      onIncidentUpdate: null,
      onError: null,
      onConnectionChange: null,
      onCenterStatusChange: null
    };
  }

  /**
   * Initialize Pusher connection for all communication centers
   */
  async initialize(centers = ['BCCC', 'LACC', 'OCCC', 'SACC']) {
    try {
      // Dynamic import of Pusher to avoid loading issues
      const Pusher = await import('pusher-js');
      
      this.pusher = new Pusher.default(WEBSOCKET_CONFIG.pusher.key, {
        cluster: WEBSOCKET_CONFIG.pusher.cluster,
        encrypted: WEBSOCKET_CONFIG.pusher.useTLS,
        authEndpoint: '/api/pusher-auth' // Optional: for private channels
      });

      // Set up connection event handlers
      this.setupConnectionHandlers();
      
      // Subscribe to all communication center channels
      await this.subscribeToCenters(centers);
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      this.notifyConnectionChange(true);
      
      console.log('✅ Pusher connected successfully to all centers:', centers);
      
    } catch (error) {
      console.error('❌ Failed to initialize Pusher:', error);
      this.handleConnectionError(error);
    }
  }

  /**
   * Subscribe to specific communication center channels
   */
  async subscribeToCenters(centers) {
    for (const centerCode of centers) {
      const centerInfo = getCenterInfo(centerCode);
      if (!centerInfo) {
        console.warn(`⚠️ Unknown center code: ${centerCode}`);
        continue;
      }

      try {
        const channel = this.pusher.subscribe(centerInfo.channel);
        this.channels.set(centerCode, channel);
        this.subscribedCenters.add(centerCode);
        
        // Set up message handlers for this center
        this.setupCenterMessageHandlers(centerCode, channel);
        
        console.log(`📡 Subscribed to ${centerInfo.name} (${centerCode}) channel`);
      } catch (error) {
        console.error(`❌ Failed to subscribe to ${centerCode}:`, error);
      }
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
   * Set up message event handlers for a specific center
   */
  setupCenterMessageHandlers(centerCode, channel) {
    const centerInfo = getCenterInfo(centerCode);
    
    // Handle new incidents
    channel.bind(WEBSOCKET_CONFIG.events.NEW_INCIDENT, (data) => {
      console.log(`📡 [${centerCode}] New incident:`, data);
      
      if (this.eventHandlers.onIncidentUpdate) {
        this.eventHandlers.onIncidentUpdate({
          ...data,
          center: centerCode,
          centerInfo: centerInfo,
          eventType: 'new-incident'
        });
      }
    });

    // Handle updated incidents
    channel.bind(WEBSOCKET_CONFIG.events.UPDATED_INCIDENT, (data) => {
      console.log(`📡 [${centerCode}] Updated incident:`, data);
      
      if (this.eventHandlers.onIncidentUpdate) {
        this.eventHandlers.onIncidentUpdate({
          ...data,
          center: centerCode,
          centerInfo: centerInfo,
          eventType: 'updated-incident'
        });
      }
    });

    // Handle resolved incidents
    channel.bind(WEBSOCKET_CONFIG.events.RESOLVED_INCIDENT, (data) => {
      console.log(`📡 [${centerCode}] Resolved incident:`, data);
      
      if (this.eventHandlers.onIncidentUpdate) {
        this.eventHandlers.onIncidentUpdate({
          ...data,
          center: centerCode,
          centerInfo: centerInfo,
          eventType: 'resolved-incident'
        });
      }
    });

    // Handle center status updates
    channel.bind(WEBSOCKET_CONFIG.events.CENTER_STATUS, (data) => {
      console.log(`📊 [${centerCode}] Center status:`, data);
      
      if (this.eventHandlers.onCenterStatusChange) {
        this.eventHandlers.onCenterStatusChange({
          ...data,
          center: centerCode,
          centerInfo: centerInfo
        });
      }
    });

    // Handle errors
    channel.bind('error', (data) => {
      console.error(`❌ [${centerCode}] Received error:`, data);
      
      if (this.eventHandlers.onError) {
        this.eventHandlers.onError({
          ...data,
          center: centerCode,
          centerInfo: centerInfo
        });
      }
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

  onCenterStatusChange(handler) {
    this.eventHandlers.onCenterStatusChange = handler;
  }

  /**
   * Subscribe to additional center
   */
  async subscribeToCenter(centerCode) {
    if (this.subscribedCenters.has(centerCode)) {
      console.log(`📡 Already subscribed to ${centerCode}`);
      return;
    }

    const centerInfo = getCenterInfo(centerCode);
    if (!centerInfo) {
      console.warn(`⚠️ Unknown center code: ${centerCode}`);
      return;
    }

    try {
      const channel = this.pusher.subscribe(centerInfo.channel);
      this.channels.set(centerCode, channel);
      this.subscribedCenters.add(centerCode);
      
      this.setupCenterMessageHandlers(centerCode, channel);
      
      console.log(`📡 Subscribed to ${centerInfo.name} (${centerCode}) channel`);
    } catch (error) {
      console.error(`❌ Failed to subscribe to ${centerCode}:`, error);
    }
  }

  /**
   * Unsubscribe from center
   */
  unsubscribeFromCenter(centerCode) {
    if (!this.subscribedCenters.has(centerCode)) {
      console.log(`📡 Not subscribed to ${centerCode}`);
      return;
    }

    const channel = this.channels.get(centerCode);
    if (channel) {
      this.pusher.unsubscribe(channel.name);
      this.channels.delete(centerCode);
      this.subscribedCenters.delete(centerCode);
      
      const centerInfo = getCenterInfo(centerCode);
      console.log(`📡 Unsubscribed from ${centerInfo?.name} (${centerCode}) channel`);
    }
  }

  /**
   * Get subscribed centers
   */
  getSubscribedCenters() {
    return Array.from(this.subscribedCenters);
  }

  /**
   * Get center channel
   */
  getCenterChannel(centerCode) {
    return this.channels.get(centerCode);
  }

  /**
   * Trigger manual scraping for specific center or all centers
   */
  async triggerScraping(center = null) {
    try {
      const url = center ? `/api/scrape?center=${center}` : '/api/scrape';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Scraping failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Scraping triggered for ${center || 'all centers'}:`, result);
      
      return result;
    } catch (error) {
      console.error('❌ Failed to trigger scraping:', error);
      throw error;
    }
  }

  /**
   * Trigger scraping for all subscribed centers
   */
  async triggerScrapingAllCenters() {
    const results = [];
    
    for (const centerCode of this.subscribedCenters) {
      try {
        const result = await this.triggerScraping(centerCode);
        results.push({ center: centerCode, result });
      } catch (error) {
        console.error(`❌ Failed to scrape ${centerCode}:`, error);
        results.push({ center: centerCode, error: error.message });
      }
    }
    
    return results;
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
      // Unsubscribe from all channels
      for (const [centerCode, channel] of this.channels) {
        this.pusher.unsubscribe(channel.name);
        console.log(`📡 Unsubscribed from ${centerCode}`);
      }
      
      this.pusher.disconnect();
      this.pusher = null;
    }
    
    this.channels.clear();
    this.subscribedCenters.clear();
    this.isConnected = false;
    
    console.log('🔌 Pusher disconnected from all centers');
  }
}

// Export for use in other modules
export default RealtimeIncidentService;
