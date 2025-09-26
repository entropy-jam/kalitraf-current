/**
 * Incident Service
 * Single Responsibility: Manages incident data operations
 * Dependency Inversion: Depends on abstractions (IDataStorage, IDataFetcher)
 */

class IncidentService {
    constructor(storage, fetcher, config) {
        this.storage = storage;
        this.fetcher = fetcher;
        this.config = config;
        this.currentCenter = config.get('defaultCenter');
        this.websocketService = null;
        this.realtimeEnabled = false;
    }

    /**
     * Set WebSocket service for real-time updates
     * @param {Object} websocketService - WebSocket service instance
     */
    setWebSocketService(websocketService) {
        this.websocketService = websocketService;
        this.realtimeEnabled = true;
        console.log('📡 IncidentService connected to WebSocket service');
    }

    /**
     * Handle real-time WebSocket updates
     * @param {Object} data - WebSocket update data
     */
    handleRealtimeUpdate(data) {
        if (!this.realtimeEnabled || !data) return;
        
        console.log(`📡 IncidentService received real-time update for ${data.center}:`, data);
        
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
            this.storage.set(cacheKey, cacheData);
            
            // If this is the current center, trigger a refresh
            if (data.center === this.currentCenter) {
                console.log(`📡 Updating display for current center ${data.center}`);
                // Trigger a refresh of the UI
                this.loadIncidents(true);
            }
        }
    }

    /**
     * Load incident data with caching
     * @param {boolean} forceRefresh - Force refresh from server
     * @returns {Promise<Object>} Incident data
     */
    async loadIncidents(forceRefresh = false) {
        const cacheKey = `incidents_${this.currentCenter}`;
        
        // Check cache first
        if (!forceRefresh) {
            const cachedData = await this.storage.get(cacheKey);
            if (cachedData && this.isCacheValid(cachedData.timestamp)) {
                console.log('Loading from cache');
                return cachedData;
            }
        }

        // Fetch from server
        try {
            const data = await this.fetcher.fetchJson(`active_incidents.json?t=${Date.now()}`);
            
            // Add timestamp and save to cache
            const dataWithTimestamp = {
                ...data,
                timestamp: Date.now(),
                center: this.currentCenter
            };
            
            await this.storage.set(cacheKey, dataWithTimestamp);
            return dataWithTimestamp;
        } catch (error) {
            console.error('Error fetching incidents:', error);
            
            // Try to fall back to cache on error
            const cachedData = await this.storage.get(cacheKey);
            if (cachedData) {
                console.log('Falling back to cache');
                return cachedData;
            }
            
            throw error;
        }
    }

    /**
     * Check if cache is still valid
     * @param {number} timestamp - Cache timestamp
     * @returns {boolean} True if cache is valid
     */
    isCacheValid(timestamp) {
        const cacheDuration = this.config.get('cacheDuration');
        return Date.now() - timestamp < cacheDuration;
    }

    /**
     * Set current communication center
     * @param {string} center - Center code
     */
    setCurrentCenter(center) {
        this.currentCenter = center;
    }

    /**
     * Get current communication center
     * @returns {string} Current center code
     */
    getCurrentCenter() {
        return this.currentCenter;
    }

    /**
     * Clear cache for current center
     * @returns {Promise<boolean>} Success status
     */
    async clearCache() {
        const cacheKey = `incidents_${this.currentCenter}`;
        return await this.storage.remove(cacheKey);
    }

    /**
     * Clear all incident caches
     * @returns {Promise<boolean>} Success status
     */
    async clearAllCaches() {
        const keys = this.storage.getKeys();
        const incidentKeys = keys.filter(key => key.includes('incidents_'));
        
        let allSuccess = true;
        for (const key of incidentKeys) {
            const success = await this.storage.remove(key);
            if (!success) allSuccess = false;
        }
        
        return allSuccess;
    }

    /**
     * Compare two incident datasets
     * @param {Array} oldIncidents - Previous incidents
     * @param {Array} newIncidents - Current incidents
     * @returns {Object} Comparison result with differences
     */
    compareIncidents(oldIncidents, newIncidents) {
        if (!oldIncidents || !newIncidents) {
            return { hasChanges: true, differences: [] };
        }

        const oldMap = new Map(oldIncidents.map(incident => [incident.id, incident]));
        const newMap = new Map(newIncidents.map(incident => [incident.id, incident]));

        const differences = [];

        // Find new incidents
        newIncidents.forEach(incident => {
            if (!oldMap.has(incident.id)) {
                differences.push({
                    type: 'new',
                    incident: incident,
                    time: this.parseIncidentTime(incident.time)
                });
            }
        });

        // Find removed incidents
        oldIncidents.forEach(incident => {
            if (!newMap.has(incident.id)) {
                differences.push({
                    type: 'removed',
                    incident: incident,
                    time: this.parseIncidentTime(incident.time)
                });
            }
        });

        return {
            hasChanges: differences.length > 0,
            differences: differences.sort((a, b) => b.time - a.time)
        };
    }

    /**
     * Parse incident time string to Date object
     * @param {string} timeStr - Time string (e.g., "2:30 PM")
     * @returns {Date|null} Parsed date or null if invalid
     */
    parseIncidentTime(timeStr) {
        try {
            const now = new Date();
            const [time, period] = timeStr.split(' ');
            const [hours, minutes] = time.split(':');
            let hour = parseInt(hours);
            const mins = parseInt(minutes);

            if (period === 'PM' && hour !== 12) hour += 12;
            if (period === 'AM' && hour === 12) hour = 0;

            const incidentTime = new Date(now);
            incidentTime.setHours(hour, mins, 0, 0);

            // If the time is in the future, assume it's from yesterday
            if (incidentTime > now) {
                incidentTime.setDate(incidentTime.getDate() - 1);
            }

            return incidentTime;
        } catch (e) {
            return null;
        }
    }

    /**
     * Filter differences by time window
     * @param {Array} differences - Array of differences
     * @returns {Array} Filtered differences
     */
    filterRecentDifferences(differences) {
        const timeWindow = this.config.get('differencesTimeWindow');
        const cutoffTime = new Date(Date.now() - timeWindow);
        
        return differences.filter(diff => 
            diff.time && diff.time >= cutoffTime
        );
    }
}

// Export for use in other modules
window.IncidentService = IncidentService;
