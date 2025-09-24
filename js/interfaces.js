/**
 * Interface Definitions (SOLID Principles)
 * Defines contracts for different components
 */

/**
 * Interface for data storage operations
 * Single Responsibility: Data persistence
 */
class IDataStorage {
    async get(key) {
        throw new Error('get method must be implemented');
    }
    
    async set(key, value) {
        throw new Error('set method must be implemented');
    }
    
    async remove(key) {
        throw new Error('remove method must be implemented');
    }
    
    async clear() {
        throw new Error('clear method must be implemented');
    }
}

/**
 * Interface for data fetching operations
 * Single Responsibility: Data retrieval
 */
class IDataFetcher {
    async fetch(url, options = {}) {
        throw new Error('fetch method must be implemented');
    }
}

/**
 * Interface for UI rendering operations
 * Single Responsibility: UI updates
 */
class IUIRenderer {
    renderIncidents(incidents) {
        throw new Error('renderIncidents method must be implemented');
    }
    
    updateStatus(status) {
        throw new Error('updateStatus method must be implemented');
    }
    
    showNotification(message, type) {
        throw new Error('showNotification method must be implemented');
    }
}

/**
 * Interface for event handling
 * Single Responsibility: Event management
 */
class IEventHandler {
    addEventListener(element, event, handler) {
        throw new Error('addEventListener method must be implemented');
    }
    
    removeEventListener(element, event, handler) {
        throw new Error('removeEventListener method must be implemented');
    }
}

/**
 * Interface for configuration management
 * Single Responsibility: Configuration
 */
class IConfigManager {
    get(key) {
        throw new Error('get method must be implemented');
    }
    
    set(key, value) {
        throw new Error('set method must be implemented');
    }
    
    getAll() {
        throw new Error('getAll method must be implemented');
    }
}

// Export interfaces
window.IDataStorage = IDataStorage;
window.IDataFetcher = IDataFetcher;
window.IUIRenderer = IUIRenderer;
window.IEventHandler = IEventHandler;
window.IConfigManager = IConfigManager;
