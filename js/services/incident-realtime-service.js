/**
 * Incident Real-time Service
 * Single Responsibility: Handles real-time SSE updates for incidents
 */

class IncidentRealtimeService {
    constructor(dataService, config) {
        this.dataService = dataService;
        this.config = config;
        this.sseService = null;
        this.realtimeEnabled = false;
    }

    /**
     * Set SSE service for real-time updates
     * @param {Object} sseService - SSE service instance
     */
    setSSEService(sseService) {
        this.sseService = sseService;
        this.realtimeEnabled = true;
        console.log('📡 IncidentRealtimeService connected to SSE service');
    }

    /**
     * Handle real-time SSE updates
     * @param {Object} data - SSE update data
     */
    handleRealtimeUpdate(data) {
        if (!this.realtimeEnabled || !data) return;
        
        console.log(`📡 IncidentRealtimeService received real-time update for ${data.center}:`, data);
        
        // Update cache with new data
        if (data.incidents) {
            const cacheData = {
                center_code: data.center,
                center_name: data.centerName,
                incident_count: data.incidentCount || data.incidents.length,
                incidents: data.incidents,
                last_updated: data.timestamp,
                timestamp: Date.now()
            };
            
            // Update cache for this center
            const cacheKey = `incidents_${data.center}`;
            this.dataService.storage.set(cacheKey, cacheData);
            
            // If this is the current center, trigger a refresh
            if (data.center === this.dataService.getCurrentCenter()) {
                console.log(`📡 Updating display for current center ${data.center}`);
                // Trigger a refresh of the UI
                this.dataService.loadIncidents(true);
            }
        }
    }

    /**
     * Check if real-time updates are enabled
     * @returns {boolean} True if real-time updates are enabled
     */
    isRealtimeEnabled() {
        return this.realtimeEnabled;
    }

    /**
     * Enable real-time updates
     */
    enableRealtime() {
        this.realtimeEnabled = true;
        console.log('📡 Real-time updates enabled');
    }

    /**
     * Disable real-time updates
     */
    disableRealtime() {
        this.realtimeEnabled = false;
        console.log('📡 Real-time updates disabled');
    }
}

// Export for use in other modules
window.IncidentRealtimeService = IncidentRealtimeService;
