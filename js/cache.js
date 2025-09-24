/**
 * Cache Management Module
 * Handles localStorage caching for incident data
 */

class CacheManager {
    constructor() {
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        this.CACHE_PREFIX = 'chp_data_';
    }

    /**
     * Get cached data for a specific center
     * @param {string} center - Communication center code
     * @returns {Object|null} Cached data or null if not found/expired
     */
    getCachedData(center) {
        try {
            const cacheKey = `${this.CACHE_PREFIX}${center}`;
            const cached = localStorage.getItem(cacheKey);
            if (!cached) return null;
            
            const data = JSON.parse(cached);
            const now = Date.now();
            
            // Check if cache is still valid
            if (now - data.timestamp > this.CACHE_DURATION) {
                localStorage.removeItem(cacheKey);
                return null;
            }
            
            return data;
        } catch (error) {
            console.error('Error reading cache:', error);
            return null;
        }
    }

    /**
     * Save data to cache
     * @param {string} center - Communication center code
     * @param {Object} data - Data to cache
     */
    setCachedData(center, data) {
        try {
            const cacheKey = `${this.CACHE_PREFIX}${center}`;
            const cacheData = {
                ...data,
                timestamp: Date.now(),
                center: center
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            console.error('Error saving cache:', error);
        }
    }

    /**
     * Check if cache timestamp is still valid
     * @param {number} timestamp - Cache timestamp
     * @returns {boolean} True if cache is valid
     */
    isCacheValid(timestamp) {
        return Date.now() - timestamp < this.CACHE_DURATION;
    }

    /**
     * Clear expired cache entries
     */
    clearOldCache() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.CACHE_PREFIX)) {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (!this.isCacheValid(data.timestamp)) {
                        localStorage.removeItem(key);
                    }
                }
            });
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }
}

// Export for use in other modules
window.CacheManager = CacheManager;
