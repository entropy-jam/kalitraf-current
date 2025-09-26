/**
 * Cache Utilities
 * Single Responsibility: Handles cache validation logic
 */

class CacheUtils {
    /**
     * Check if cache is still valid
     * @param {number} timestamp - Cache timestamp
     * @param {Object} config - Configuration object
     * @param {string} cacheKey - Cache duration key (default: 'cacheDuration')
     * @returns {boolean} True if cache is valid
     */
    static isCacheValid(timestamp, config, cacheKey = 'cacheDuration') {
        const cacheDuration = config.get(cacheKey, 300000); // 5 minutes default
        return Date.now() - timestamp < cacheDuration;
    }
}

// Export for use in other modules
window.CacheUtils = CacheUtils;
