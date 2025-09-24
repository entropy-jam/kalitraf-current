/**
 * Configuration Manager
 * Single Responsibility: Manages application configuration
 * Open/Closed: Can be extended without modification
 */

class ConfigManager extends IConfigManager {
    constructor() {
        super();
        this.config = {
            cacheDuration: 5 * 60 * 1000, // 5 minutes
            refreshInterval: 30000, // 30 seconds
            virtualScrollItemHeight: 80,
            virtualScrollVisibleCount: 8,
            virtualScrollBuffer: 2,
            differencesTimeWindow: 5 * 60 * 1000, // 5 minutes
            notificationDuration: 3000, // 3 seconds
            debounceDelay: 300, // 300ms
            defaultCenter: 'BCCC'
        };
    }

    /**
     * Get configuration value
     * @param {string} key - Configuration key
     * @returns {*} Configuration value
     */
    get(key) {
        return this.config[key];
    }

    /**
     * Set configuration value
     * @param {string} key - Configuration key
     * @param {*} value - Configuration value
     */
    set(key, value) {
        this.config[key] = value;
    }

    /**
     * Get all configuration
     * @returns {Object} All configuration
     */
    getAll() {
        return { ...this.config };
    }

    /**
     * Update multiple configuration values
     * @param {Object} updates - Configuration updates
     */
    update(updates) {
        Object.assign(this.config, updates);
    }
}

// Export for use in other modules
window.ConfigManager = ConfigManager;
