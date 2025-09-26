/**
 * Application Controller
 * Single Responsibility: Orchestrates application components
 * Dependency Inversion: Depends on abstractions, not concrete implementations
 */

class AppController {
    constructor(dependencies = {}) {
        // Use dependency injection with defaults
        this.config = dependencies.config || new ConfigManager();
        this.storage = dependencies.storage || new LocalStorageAdapter('chp_data_');
        this.fetcher = dependencies.fetcher || new HttpFetcher();
        this.renderer = dependencies.renderer || new IncidentRenderer();
        this.incidentService = dependencies.incidentService || new IncidentService(this.storage, this.fetcher, this.config);
        this.multiCenterService = dependencies.multiCenterService || new MultiCenterService(this.fetcher, this.storage, this.config);
        this.deltaService = dependencies.deltaService || new DeltaService();
        this.filterService = dependencies.filterService || new FilterService();
        
        this.previousIncidents = null;
        this.isInitialized = false;
        this.allIncidents = []; // Store all incidents for filtering
        this.autoRefreshTimer = null;
        this.uiController = null; // Will be set by UIController
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            console.log('🔧 Starting AppController initialization...');
            
            if (this.isInitialized) {
                console.warn('Application already initialized');
                return;
            }

            console.log('🔧 Cleaning up old cache...');
            // Clean up old cache entries
            await this.cleanupOldCache();

            console.log('🔧 Setting up UI...');
            // Initialize UIController for UI management
            this.uiController = new UIController(this);
            this.uiController.initialize();
            
            console.log('🔧 Setting up global references...');
            // Set up global references for backward compatibility
            window.previousIncidents = null;
            window.refreshData = () => this.refreshData();

            console.log('🔧 Setting up filter listener...');
            // Set up filter event listener
            this.setupFilterListener();

            console.log('🔧 Starting delta monitoring...');
            // Start delta monitoring for real-time updates
            this.deltaService.startDeltaMonitoring();

            console.log('🔧 Setting up auto-refresh...');
            // Start auto-refresh if enabled
            const autoRefreshCheckbox = document.getElementById('autoRefresh');
            if (autoRefreshCheckbox && autoRefreshCheckbox.checked) {
                this.startAutoRefresh();
            }

            console.log('🔧 Loading initial data...');
            // Load initial data
            await this.loadData();

            this.isInitialized = true;
            console.log('✅ CHP Traffic Monitor initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);
            this.showInitializationError();
        }
    }

    // setupUI method removed - UIController handles UI setup

    /**
     * Change communication center
     * @param {string} centerCode - Center code to switch to
     */
    changeCenter(centerCode) {
        console.log(`🔄 Switching to center: ${centerCode}`);
        this.config.set('defaultCenter', centerCode);
        this.refreshData(true);
    }

    /**
     * Toggle auto-refresh functionality
     * @param {boolean} enabled - Whether auto-refresh should be enabled
     */
    toggleAutoRefresh(enabled) {
        if (enabled) {
            this.startAutoRefresh();
        } else {
            this.stopAutoRefresh();
        }
    }

    /**
     * Start auto-refresh timer
     */
    startAutoRefresh() {
        if (this.autoRefreshTimer) {
            clearInterval(this.autoRefreshTimer);
        }
        
        const interval = this.config.get('refreshInterval');
        this.autoRefreshTimer = setInterval(() => {
            this.refreshData();
        }, interval);
        
        console.log(`🔄 Auto-refresh started (${interval}ms interval)`);
    }

    /**
     * Stop auto-refresh timer
     */
    stopAutoRefresh() {
        if (this.autoRefreshTimer) {
            clearInterval(this.autoRefreshTimer);
            this.autoRefreshTimer = null;
        }
        console.log('⏹️ Auto-refresh stopped');
    }

    /**
     * Load incident data
     * @param {boolean} forceRefresh - Force refresh from server
     * @returns {Promise<Object>} Incident data
     */
    async loadData(forceRefresh = false) {
        try {
            // Load multi-center data
            const data = await this.multiCenterService.loadMultiCenterData(forceRefresh);
            
            console.log('📊 Loaded data:', data);
            console.log('📊 Incidents count:', data.incidents ? data.incidents.length : 'No incidents');
            
            // Update status
            this.renderer.updateStatus({
                count: data.total_incidents || 0,
                lastUpdated: data.last_updated,
                centers: data.centers
            });

            // Render incidents to UI
            const container = document.getElementById('incidentsContainer');
            console.log('📊 Container found:', !!container);
            if (container && data.incidents) {
                console.log('🎨 Rendering incidents...');
                this.renderer.renderIncidents(data.incidents, container, this.previousIncidents || []);
            } else {
                console.log('❌ Cannot render: container=', !!container, 'incidents=', !!data.incidents);
            }

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

            // Store all incidents for filtering
            this.allIncidents = data.incidents || [];
            
            // Apply filters and render incidents
            this.renderFilteredIncidents();
            
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
    async refreshData(forceRefresh = false) {
        try {
            // Show loading indicator
            const refreshIndicator = document.getElementById('refreshIndicator');
            if (refreshIndicator) {
                refreshIndicator.style.display = 'inline';
            }

            // Load fresh data
            await this.loadData(forceRefresh);

            // Hide loading indicator
            if (refreshIndicator) {
                refreshIndicator.style.display = 'none';
            }

            console.log('✅ Data refreshed successfully');
        } catch (error) {
            console.error('❌ Failed to refresh data:', error);
            
            // Hide loading indicator on error
            const refreshIndicator = document.getElementById('refreshIndicator');
            if (refreshIndicator) {
                refreshIndicator.style.display = 'none';
            }
        }
    }

    /**
     * Set current communication center
     * @param {string} center - Center code
     */
    setCurrentCenter(center) {
        this.incidentService.setCurrentCenter(center);
        // Also update multi-center service
        this.multiCenterService.setSelectedCenters([center]);
    }

    /**
     * Set selected centers for multi-center view
     * @param {string[]} centers - Array of center codes
     */
    setSelectedCenters(centers) {
        this.multiCenterService.setSelectedCenters(centers);
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
        
        HTMLSanitizer.setInnerHTML(container, differencesHtml);
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
            HTMLSanitizer.setInnerHTML(container, `
                <div class="error">
                    <h3>Failed to initialize application</h3>
                    <p>Please refresh the page and try again. If the problem persists, check the browser console for more details.</p>
                </div>
            `);
        }
    }

    /**
     * Set up filter event listener
     */
    setupFilterListener() {
        document.addEventListener('filterChanged', (event) => {
            this.renderFilteredIncidents();
        });
    }

    /**
     * Render incidents based on current filters
     */
    renderFilteredIncidents() {
        if (!this.allIncidents || this.allIncidents.length === 0) {
            return;
        }

        // Filter incidents based on active filters
        const filteredIncidents = this.allIncidents.filter(incident => 
            this.filterService.shouldShowIncident(incident)
        );

        // Render filtered incidents
        const container = document.getElementById('incidentsContainer');
        this.renderer.renderIncidents(filteredIncidents, container, this.previousIncidents);
        
        // Initialize copy buttons after rendering
        if (window.copyToClipboard) {
            window.copyToClipboard.initializeCopyButtons();
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
