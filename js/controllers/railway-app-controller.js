/**
 * Railway App Controller
 * SSE-only implementation - no static file dependencies
 */

class RailwayAppController {
    constructor(dependencies = {}) {
        console.log('🚀 Initializing Railway AppController (SSE-only)');
        
        // Required dependencies (injected by dependency container)
        this.incidentService = dependencies.incidentService;
        this.uiController = dependencies.uiController;
        this.config = dependencies.config;
        
        // Optional dependencies with safe defaults
        this.storage = dependencies.storage || new LocalStorage();
        this.renderer = dependencies.renderer || new IncidentRenderer();
        
        // State management
        this.isInitialized = false;
        this.allIncidents = []; // Store all incidents for filtering
        this.autoRefreshTimer = null;
    }

    /**
     * Initialize the application (SSE-only)
     */
    async initialize() {
        try {
            console.log('🔧 Starting Railway AppController initialization...');
            
            if (this.isInitialized) {
                console.warn('Application already initialized');
                return;
            }

            console.log('🔧 Cleaning up old cache...');
            await this.cleanupOldCache();

            console.log('🔧 Setting up UI controller...');
            this.uiController.setAppController(this);
            
            console.log('🔧 Setting up filter listener...');
            this.setupFilterListener();

            console.log('🔧 Setting up auto-refresh...');
            // Start auto-refresh if enabled
            const autoRefreshCheckbox = document.getElementById('autoRefresh');
            if (autoRefreshCheckbox && autoRefreshCheckbox.checked) {
                this.startAutoRefresh();
            }

            console.log('🔧 Loading initial data from SSE...');
            // In SSE mode, data comes from SSE - no need to load here
            // The SSE service will populate the cache and trigger UI updates

            this.isInitialized = true;
            console.log('✅ Railway AppController initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize Railway AppController:', error);
            throw error;
        }
    }

    /**
     * Clean up old cache entries
     */
    async cleanupOldCache() {
        try {
            const keys = this.storage.getKeys();
            const incidentKeys = keys.filter(key => key.includes('incidents_'));
            
            for (const key of incidentKeys) {
                const data = await this.storage.get(key);
                if (data && data.timestamp) {
                    const age = Date.now() - data.timestamp;
                    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
                    
                    if (age > maxAge) {
                        await this.storage.remove(key);
                        console.log(`🗑️  Removed old cache entry: ${key}`);
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️  Error cleaning up cache:', error);
        }
    }

    /**
     * Set up filter change listener
     */
    setupFilterListener() {
        const filterCheckboxes = document.querySelectorAll('.filter-checkboxes input[type="checkbox"]');
        
        filterCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.applyFilters();
            });
        });
    }

    /**
     * Apply current filters to incidents
     */
    applyFilters() {
        if (!this.uiController) return;
        
        const activeFilters = this.getActiveFilters();
        this.uiController.applyFilters(activeFilters);
    }

    /**
     * Get currently active filters
     */
    getActiveFilters() {
        const filters = {};
        const filterCheckboxes = document.querySelectorAll('.filter-checkboxes input[type="checkbox"]');
        
        filterCheckboxes.forEach(checkbox => {
            const filterName = checkbox.id.replace('filter-', '');
            filters[filterName] = checkbox.checked;
        });
        
        return filters;
    }

    /**
     * Start auto-refresh timer
     */
    startAutoRefresh() {
        if (this.autoRefreshTimer) {
            clearInterval(this.autoRefreshTimer);
        }
        
        const interval = this.config.get('autoRefreshInterval', 30000); // 30 seconds default
        this.autoRefreshTimer = setInterval(() => {
            console.log('🔄 Auto-refresh triggered');
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
            console.log('🔄 Auto-refresh stopped');
        }
    }

    /**
     * Load data (SSE mode - data comes from SSE cache)
     * This method is called by UIController for compatibility
     */
    async loadData(forceRefresh = false) {
        // Data loading disabled - data comes from SSE only
        console.log('📡 Data loading disabled - data comes from SSE only');
        return null;
    }

    /**
     * Refresh data (SSE mode - data comes from SSE)
     */
    async refreshData() {
        try {
            console.log('🔄 Refreshing data from SSE cache...');
            
            // In SSE mode, data is already in cache
            // Just trigger a UI refresh
            if (this.uiController) {
                await this.uiController.refreshDisplay();
            }
            
        } catch (error) {
            console.error('❌ Error refreshing data:', error);
        }
    }

    /**
     * Update incidents (called by SSE service)
     */
    updateIncidents(data) {
        if (!this.uiController) return;
        
        console.log('📡 Updating incidents from SSE:', data);
        
        // Update the UI with new data
        this.uiController.updateIncidents(data);
    }

    /**
     * Set current communication center
     */
    setCurrentCenter(center) {
        if (this.incidentService) {
            this.incidentService.setCurrentCenter(center);
        }
        
        if (this.uiController) {
            this.uiController.setCurrentCenter(center);
        }
    }

    /**
     * Get current communication center
     */
    getCurrentCenter() {
        if (this.incidentService) {
            return this.incidentService.getCurrentCenter();
        }
        return this.config.get('defaultCenter', 'LACC');
    }

    /**
     * Get all available centers
     */
    getAvailableCenters() {
        return this.config.get('centers', {});
    }

    /**
     * Destroy the application
     */
    destroy() {
        console.log('🔧 Destroying Railway AppController...');
        
        this.stopAutoRefresh();
        
        if (this.incidentService && this.incidentService.destroy) {
            this.incidentService.destroy();
        }
        
        if (this.uiController && this.uiController.destroy) {
            this.uiController.destroy();
        }
        
        this.isInitialized = false;
        console.log('✅ Railway AppController destroyed');
    }
}

// Export for use in other modules
window.RailwayAppController = RailwayAppController;
