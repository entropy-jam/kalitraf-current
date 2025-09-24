/**
 * Local Storage Implementation
 * Single Responsibility: Handles localStorage operations
 * Dependency Inversion: Implements IDataStorage interface
 */

class LocalStorageAdapter extends IDataStorage {
    constructor(prefix = 'chp_') {
        super();
        this.prefix = prefix;
    }

    /**
     * Get item from localStorage
     * @param {string} key - Storage key
     * @returns {Promise<*>} Stored value or null
     */
    async get(key) {
        try {
            const fullKey = this.prefix + key;
            const item = localStorage.getItem(fullKey);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    }

    /**
     * Set item in localStorage
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {Promise<boolean>} Success status
     */
    async set(key, value) {
        try {
            const fullKey = this.prefix + key;
            localStorage.setItem(fullKey, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            return false;
        }
    }

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     * @returns {Promise<boolean>} Success status
     */
    async remove(key) {
        try {
            const fullKey = this.prefix + key;
            localStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }

    /**
     * Clear all items with prefix
     * @returns {Promise<boolean>} Success status
     */
    async clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }

    /**
     * Get all keys with prefix
     * @returns {Array<string>} Array of keys
     */
    getKeys() {
        const keys = Object.keys(localStorage);
        return keys.filter(key => key.startsWith(this.prefix));
    }
}

// Export for use in other modules
window.LocalStorageAdapter = LocalStorageAdapter;
