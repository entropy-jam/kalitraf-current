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
        
        // Set up initial data handler
        if (this.sseService && this.sseService.eventHandlers) {
            this.sseService.eventHandlers.onInitialData = (data) => {
                this.handleInitialData(data);
            };
        }
    }
    
    /**
     * Handle initial data from SSE
     * @param {Object} data - Initial incident data
     */
    handleInitialData(data) {
        console.log('📊 IncidentRealtimeService received initial data:', data);
        
        if (!data.incidents) {
            console.warn('⚠️  Initial data missing incidents');
            return;
        }
        
        // Process each center's data
        Object.keys(data.incidents).forEach(centerCode => {
            const centerData = data.incidents[centerCode];
            const cacheData = {
                center_code: centerCode,
                center_name: this.getCenterName(centerCode),
                incident_count: centerData.length,
                incidents: centerData,
                last_updated: data.timestamp,
                timestamp: Date.now()
            };
            
            // Store in cache
            const cacheKey = `incidents_${centerCode}`;
            this.dataService.storage.set(cacheKey, cacheData);
        });
        
        console.log(`✅ Processed initial data for ${Object.keys(data.incidents).length} centers`);
        
        // Trigger display update for current center
        const currentCenter = this.dataService.getCurrentCenter();
        if (currentCenter && data.incidents[currentCenter]) {
            console.log(`📡 Updating display with initial data for ${currentCenter}`);
            this.triggerDisplayUpdate(currentCenter, data.incidents[currentCenter]);
        }
    }
    
    /**
     * Get center name from center code
     * @param {string} centerCode - Center code
     * @returns {string} Center name
     */
    getCenterName(centerCode) {
        const centerNames = {
            'BFCC': 'Bakersfield', 'BSCC': 'Barstow', 'BICC': 'Bishop', 'BCCC': 'Border',
            'CCCC': 'Capitol', 'CHCC': 'Chico', 'ECCC': 'El Centro', 'FRCC': 'Fresno',
            'GGCC': 'Golden Gate', 'HMCC': 'Humboldt', 'ICCC': 'Indio', 'INCC': 'Inland',
            'LACC': 'Los Angeles', 'MRCC': 'Merced', 'MYCC': 'Monterey', 'OCCC': 'Orange County',
            'RDCC': 'Redding', 'SACC': 'Sacramento', 'SLCC': 'San Luis Obispo', 'SKCCSTCC': 'Stockton',
            'SUCC': 'Susanville', 'TKCC': 'Truckee', 'UKCC': 'Ukiah', 'VTCC': 'Ventura', 'YKCC': 'Yreka'
        };
        return centerNames[centerCode] || centerCode;
    }
    
    /**
     * Trigger display update for a center
     * @param {string} centerCode - Center code
     * @param {Array} incidents - Incident data
     */
    triggerDisplayUpdate(centerCode, incidents) {
        // This will be handled by the main app controller
        // We'll dispatch a custom event that the app can listen to
        const event = new CustomEvent('incidentDataUpdated', {
            detail: {
                center: centerCode,
                incidents: incidents,
                timestamp: Date.now()
            }
        });
        window.dispatchEvent(event);
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
