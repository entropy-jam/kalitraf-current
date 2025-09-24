/**
 * Application Controller
 * Single Responsibility: Orchestrates application components
 * Dependency Inversion: Depends on abstractions, not concrete implementations
 */

class AppController {
    constructor() {
        this.config = new ConfigManager();
        this.storage = new LocalStorageAdapter('chp_data_');
        this.fetcher = new HttpFetcher();
        this.renderer = new IncidentRenderer();
        this.incidentService = new IncidentService(this.storage, this.fetcher, this.config);
        this.deltaService = new DeltaService();
        
        this.uiController = null;
        this.previousIncidents = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            if (this.isInitialized) {
                console.warn('Application already initialized');
                return;
            }

            // Clean up old cache entries
            await this.cleanupOldCache();

            // Initialize UI controller
            this.uiController = new UIController(this);
            
            // Virtual scroll removed - using regular rendering

            // Set up global references for backward compatibility
            window.previousIncidents = null;
            window.refreshData = () => this.refreshData();

            // Initialize UI
            this.uiController.initialize();

            // Start delta monitoring for real-time updates
            this.deltaService.startDeltaMonitoring();

            this.isInitialized = true;
            console.log('CHP Traffic Monitor initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showInitializationError();
        }
    }

    /**
     * Load incident data
     * @param {boolean} forceRefresh - Force refresh from server
     * @returns {Promise<Object>} Incident data
     */
    async loadData(forceRefresh = false) {
        try {
            const data = await this.incidentService.loadIncidents(forceRefresh);
            
            // Update status
            this.renderer.updateStatus({
                count: data.incident_count || 0,
                lastUpdated: data.last_updated
            });

            // Check for differences
            if (this.previousIncidents) {
                const comparison = this.incidentService.compareIncidents(
                    this.previousIncidents, 
                    data.incidents
                );
                
                if (comparison.hasChanges) {
                    const recentDifferences = this.incidentService.filterRecentDifferences(
                        comparison.differences
                    );
                    this.renderDifferences(recentDifferences);
                } else {
                    this.hideDifferences();
                }
            }

            // Update previous incidents
            this.previousIncidents = data.incidents;

            // Render incidents
            const container = document.getElementById('incidentsContainer');
            this.renderer.renderIncidents(data.incidents, container, this.previousIncidents);
            
            // Initialize copy buttons after rendering
            if (window.copyToClipboard) {
                window.copyToClipboard.initializeCopyButtons();
            }

            return data;
        } catch (error) {
            console.error('Error loading data:', error);
            const container = document.getElementById('incidentsContainer');
            this.renderer.showError('Failed to load incident data. Please try again.', container);
            throw error;
        }
    }

    /**
     * Refresh data with UI feedback
     */
    async refreshData() {
        if (this.uiController) {
            this.uiController.refreshData();
        }
    }

    /**
     * Set current communication center
     * @param {string} center - Center code
     */
    setCurrentCenter(center) {
        this.incidentService.setCurrentCenter(center);
    }

    /**
     * Get current communication center
     * @returns {string} Current center code
     */
    getCurrentCenter() {
        return this.incidentService.getCurrentCenter();
    }

    /**
     * Render differences in the UI
     * @param {Array} differences - Array of differences
     */
    renderDifferences(differences) {
        const section = document.getElementById('differencesSection');
        const container = document.getElementById('differencesContainer');
        
        if (!section || !container) return;

        const differencesHtml = differences.map(diff => {
            const icon = diff.type === 'new' ? '🆕' : '❌';
            const timeStr = this.formatTime(diff.time);
            const className = diff.type === 'new' ? 'new' : 'removed';
            
            return `
                <div class="difference-item ${className}">
                    <span class="difference-icon">${icon}</span>
                    <span>#${diff.incident.id} - ${diff.incident.type} - ${diff.incident.location}</span>
                    <span class="difference-time">${timeStr}</span>
                </div>
            `;
        }).join('');
        
        container.innerHTML = differencesHtml;
        section.style.display = 'block';
    }

    /**
     * Hide differences section
     */
    hideDifferences() {
        const section = document.getElementById('differencesSection');
        if (section) {
            section.style.display = 'none';
        }
    }

    /**
     * Format time for display
     * @param {Date} date - Date to format
     * @returns {string} Formatted time string
     */
    formatTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins === 1) return '1 minute ago';
        return `${diffMins} minutes ago`;
    }

    /**
     * Clean up old cache entries
     */
    async cleanupOldCache() {
        const keys = this.storage.getKeys();
        const cacheDuration = this.config.get('cacheDuration');
        
        for (const key of keys) {
            try {
                const data = await this.storage.get(key);
                if (data && data.timestamp) {
                    if (Date.now() - data.timestamp > cacheDuration) {
                        await this.storage.remove(key);
                    }
                }
            } catch (error) {
                console.error('Error cleaning up cache entry:', key, error);
            }
        }
    }

    /**
     * Show initialization error
     */
    showInitializationError() {
        const container = document.getElementById('incidentsContainer');
        if (container) {
            container.innerHTML = `
                <div class="error">
                    <h3>Failed to initialize application</h3>
                    <p>Please refresh the page and try again. If the problem persists, check the browser console for more details.</p>
                </div>
            `;
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.uiController) {
            this.uiController.destroy();
        }
        this.isInitialized = false;
    }
}

// Export for use in other modules
window.AppController = AppController;
