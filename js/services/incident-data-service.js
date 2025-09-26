/**
 * Incident Data Service
 * Single Responsibility: Handles incident data operations (fetching, caching, storage)
 * Dependency Inversion: Depends on abstractions (IDataStorage, IDataFetcher)
 */

class IncidentDataService {
    constructor(storage, fetcher, config) {
        this.storage = storage;
        this.fetcher = fetcher;
        this.config = config;
        this.currentCenter = config.get('defaultCenter');
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
}

// Export for use in other modules
window.IncidentDataService = IncidentDataService;
