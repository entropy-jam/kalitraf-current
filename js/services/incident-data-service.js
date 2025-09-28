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

        // Data now comes from SSE - check cache only
        console.log('📡 Data now comes from SSE - checking cache only');
        
        try {
            // Try to get from cache (populated by SSE)
            const cachedData = await this.storage.get(cacheKey);
            if (cachedData) {
                console.log('✅ Found cached data from SSE');
                return cachedData;
            }
            
            // If no cache, return empty data and wait for SSE
            console.log('⏳ No cached data - waiting for SSE initial data');
            return {
                center_code: this.currentCenter,
                center_name: this.getCenterName(this.currentCenter),
                incident_count: 0,
                incidents: [],
                last_updated: new Date().toISOString(),
                timestamp: Date.now(),
                waiting_for_sse: true
            };
        } catch (error) {
            console.error('Error accessing cache:', error);
            
            throw error;
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
     * Check if cache is still valid
     * @param {number} timestamp - Cache timestamp
     * @returns {boolean} True if cache is valid
     */
    isCacheValid(timestamp) {
        return CacheUtils.isCacheValid(timestamp, this.config, 'cacheDuration');
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
