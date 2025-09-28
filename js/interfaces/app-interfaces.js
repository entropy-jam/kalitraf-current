/**
 * Application Interfaces
 * Defines contracts for dependency injection
 */

// Configuration Manager Interface
class IConfigManager {
    get(key, defaultValue = null) {
        throw new Error('IConfigManager.get() must be implemented');
    }
    
    set(key, value) {
        throw new Error('IConfigManager.set() must be implemented');
    }
}

// Data Storage Interface
class IDataStorage {
    async get(key) {
        throw new Error('IDataStorage.get() must be implemented');
    }
    
    async set(key, value) {
        throw new Error('IDataStorage.set() must be implemented');
    }
    
    async remove(key) {
        throw new Error('IDataStorage.remove() must be implemented');
    }
    
    getKeys() {
        throw new Error('IDataStorage.getKeys() must be implemented');
    }
}

// Data Fetcher Interface
class IDataFetcher {
    async fetch(url, options = {}) {
        throw new Error('IDataFetcher.fetch() must be implemented');
    }
    
    async fetchJson(url, options = {}) {
        throw new Error('IDataFetcher.fetchJson() must be implemented');
    }
}

// UI Renderer Interface
class IUIRenderer {
    renderIncidents(incidents, container, previousIncidents = []) {
        throw new Error('IUIRenderer.renderIncidents() must be implemented');
    }
    
    updateStatus(status) {
        throw new Error('IUIRenderer.updateStatus() must be implemented');
    }
    
    showError(message, container) {
        throw new Error('IUIRenderer.showError() must be implemented');
    }
    
    showNotification(message, type = 'success') {
        throw new Error('IUIRenderer.showNotification() must be implemented');
    }
}

// Incident Service Interface
class IIncidentService {
    async loadIncidents(forceRefresh = false) {
        throw new Error('IIncidentService.loadIncidents() must be implemented');
    }
    
    setCurrentCenter(center) {
        throw new Error('IIncidentService.setCurrentCenter() must be implemented');
    }
    
    getCurrentCenter() {
        throw new Error('IIncidentService.getCurrentCenter() must be implemented');
    }
    
    compareIncidents(oldIncidents, newIncidents) {
        throw new Error('IIncidentService.compareIncidents() must be implemented');
    }
    
    filterRecentDifferences(differences) {
        throw new Error('IIncidentService.filterRecentDifferences() must be implemented');
    }
    
    setSSEService(sseService) {
        throw new Error('IIncidentService.setSSEService() must be implemented');
    }
    
    handleRealtimeUpdate(data) {
        throw new Error('IIncidentService.handleRealtimeUpdate() must be implemented');
    }
}

// Multi-Center Service Interface - REMOVED (not used in SSE implementation)

// Filter Service Interface
class IFilterService {
    shouldShowIncident(incident) {
        throw new Error('IFilterService.shouldShowIncident() must be implemented');
    }
    
    getActiveFilterCount() {
        throw new Error('IFilterService.getActiveFilterCount() must be implemented');
    }
    
    getTotalFilterCount() {
        throw new Error('IFilterService.getTotalFilterCount() must be implemented');
    }
}

// Delta Service Interface
class IDeltaService {
    startDeltaMonitoring() {
        throw new Error('IDeltaService.startDeltaMonitoring() must be implemented');
    }
}

// Export interfaces
window.IConfigManager = IConfigManager;
window.IDataStorage = IDataStorage;
window.IDataFetcher = IDataFetcher;
window.IUIRenderer = IUIRenderer;
window.IIncidentService = IIncidentService;
// window.IMultiCenterService = IMultiCenterService; // REMOVED (not used in SSE)
window.IFilterService = IFilterService;
window.IDeltaService = IDeltaService;
