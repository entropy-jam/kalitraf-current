/**
 * Incident Service - Facade Pattern
 * Single Responsibility: Orchestrates incident-related services
 * Dependency Inversion: Depends on abstractions (IDataStorage, IDataFetcher)
 */

class IncidentService {
    constructor(storage, fetcher, config) {
        this.config = config;
        
        // Initialize focused services
        this.dataService = new IncidentDataService(storage, fetcher, config);
        this.timeService = new IncidentTimeService();
        this.comparisonService = new IncidentComparisonService(this.timeService, config);
        this.realtimeService = new IncidentRealtimeService(this.dataService, config);
    }

    /**
     * Set WebSocket service for real-time updates
     * @param {Object} websocketService - WebSocket service instance
     */
    setWebSocketService(websocketService) {
        this.realtimeService.setWebSocketService(websocketService);
    }

    /**
     * Handle real-time WebSocket updates
     * @param {Object} data - WebSocket update data
     */
    handleRealtimeUpdate(data) {
        this.realtimeService.handleRealtimeUpdate(data);
    }

    /**
     * Load incident data with caching
     * @param {boolean} forceRefresh - Force refresh from server
     * @returns {Promise<Object>} Incident data
     */
    async loadIncidents(forceRefresh = false) {
        return await this.dataService.loadIncidents(forceRefresh);
    }

    /**
     * Set current communication center
     * @param {string} center - Center code
     */
    setCurrentCenter(center) {
        this.dataService.setCurrentCenter(center);
    }

    /**
     * Get current communication center
     * @returns {string} Current center code
     */
    getCurrentCenter() {
        return this.dataService.getCurrentCenter();
    }

    /**
     * Clear cache for current center
     * @returns {Promise<boolean>} Success status
     */
    async clearCache() {
        return await this.dataService.clearCache();
    }

    /**
     * Clear all incident caches
     * @returns {Promise<boolean>} Success status
     */
    async clearAllCaches() {
        return await this.dataService.clearAllCaches();
    }

    /**
     * Compare two incident datasets
     * @param {Array} oldIncidents - Previous incidents
     * @param {Array} newIncidents - Current incidents
     * @returns {Object} Comparison result with differences
     */
    compareIncidents(oldIncidents, newIncidents) {
        return this.comparisonService.compareIncidents(oldIncidents, newIncidents);
    }

    /**
     * Filter differences by time window
     * @param {Array} differences - Array of differences
     * @returns {Array} Filtered differences
     */
    filterRecentDifferences(differences) {
        return this.comparisonService.filterRecentDifferences(differences);
    }

    /**
     * Parse incident time string to Date object
     * @param {string} timeStr - Time string (e.g., "2:30 PM")
     * @returns {Date|null} Parsed date or null if invalid
     */
    parseIncidentTime(timeStr) {
        return this.timeService.parseIncidentTime(timeStr);
    }

    /**
     * Format time for display
     * @param {Date} date - Date to format
     * @returns {string} Formatted time string
     */
    formatTime(date) {
        return this.timeService.formatTime(date);
    }
}

// Export for use in other modules
window.IncidentService = IncidentService;
