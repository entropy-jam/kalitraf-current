/**
 * UI Controller Module
 * Handles user interface interactions and controls
 */

class UIController {
    constructor(appController) {
        this.appController = appController;
        this.autoRefreshInterval = null;
        this.refreshTimeout = null;
        this.isRefreshing = false;
    }

    /**
     * Initialize UI event listeners and controls
     */
    initialize() {
        // Set up offline detection
        this.setupOfflineDetection();
        
        // Handle center selection change
        document.getElementById('centerSelect').addEventListener('change', (e) => {
            this.appController.setCurrentCenter(e.target.value);
            // Data comes from SSE - no manual loading needed
        });
        
        // Handle auto-refresh checkbox
        document.getElementById('autoRefresh').addEventListener('change', () => {
            this.startAutoRefresh();
        });
        
        // Data comes from SSE - no initial loading needed
        this.startAutoRefresh();
    }

    /**
     * Refresh data with UI feedback
     */
    refreshData() {
        // Debounce rapid clicks
        if (this.isRefreshing) {
            return;
        }
        
        // Cancel any pending timeout
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
        }
        
        // Debounce the actual refresh
        this.refreshTimeout = setTimeout(() => {
            this.performRefresh();
        }, 300); // Wait 300ms after last click
    }

    /**
     * Perform the actual refresh with UI states
     */
    async performRefresh() {
        const button = document.getElementById('refreshBtn');
        const originalText = button.textContent;
        
        this.isRefreshing = true;
        
        // Show loading state
        button.classList.add('loading');
        button.disabled = true;
        button.textContent = 'Refreshing...';
        
        try {
            // Data comes from SSE - no manual refresh needed
            console.log('📡 Data comes from SSE - no manual refresh needed');
            
            // Show success state
            button.classList.remove('loading');
            button.classList.add('success');
            button.textContent = '✓ Refreshed!';
            
            // Reset after 2 seconds
            setTimeout(() => {
                button.classList.remove('success');
                button.disabled = false;
                button.textContent = originalText;
                this.isRefreshing = false;
            }, 2000);
        } catch (error) {
            // Don't show error if request was aborted
            if (error.name === 'AbortError') {
                console.log('Request aborted');
                return;
            }
            
            // Show error state
            button.classList.remove('loading');
            button.classList.add('error');
            button.textContent = '✗ Failed';
            console.error('Failed to refresh data. Please try again.');
            
            // Reset after 2 seconds
            setTimeout(() => {
                button.classList.remove('error');
                button.disabled = false;
                button.textContent = originalText;
                this.isRefreshing = false;
            }, 2000);
        }
    }

    /**
     * Start auto-refresh interval
     */
    startAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
        if (document.getElementById('autoRefresh').checked) {
            this.autoRefreshInterval = setInterval(() => {
                // Data comes from SSE - no manual refresh needed
                console.log('📡 Auto-refresh disabled - data comes from SSE');
            }, 30000); // 30 seconds
        }
    }

    /**
     * Stop auto-refresh interval
     */
    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }

    /**
     * Set up offline detection
     */
    setupOfflineDetection() {
        // Check initial online status
        this.updateOnlineStatus();
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.updateOnlineStatus();
            console.log('Connection restored');
            // Data comes from SSE - no manual refresh needed
            console.log('📡 Data comes from SSE - no manual refresh needed');
        });
        
        window.addEventListener('offline', () => {
            this.updateOnlineStatus();
            console.log('You are offline - using cached data');
        });
    }

    /**
     * Update online status display
     */
    updateOnlineStatus() {
        const statusElement = document.getElementById('lastUpdated');
        if (navigator.onLine) {
            statusElement.style.color = '';
        } else {
            statusElement.style.color = 'var(--accent-danger)';
            statusElement.textContent = statusElement.textContent.replace('Last updated:', 'Last updated (OFFLINE):');
        }
    }

    /**
     * Update incidents display
     * @param {Object} data - Incident data
     */
    updateIncidents(data) {
        console.log('📡 UIController updating incidents:', data);
        
        if (data && data.incidents) {
            this.displayIncidents(data.incidents, data.center);
        }
    }

    /**
     * Display incidents in the UI
     * @param {Array} incidents - Array of incidents
     * @param {string} center - Center code
     */
    displayIncidents(incidents, center) {
        const container = document.getElementById('incidentsContainer');
        if (!container) {
            console.error('❌ Incidents container not found');
            return;
        }

        if (!incidents || incidents.length === 0) {
            container.innerHTML = '<div class="loading">No incidents reported at this time.</div>';
            return;
        }

        // Use the incident renderer
        const renderer = new IncidentRenderer();
        renderer.renderIncidents(incidents, container);

        // Update status
        this.updateStatus({
            count: incidents.length,
            lastUpdated: new Date().toISOString()
        });

        console.log(`✅ Displayed ${incidents.length} incidents for ${center}`);
    }

    /**
     * Refresh display (called by SSE updates)
     */
    async refreshDisplay() {
        console.log('🔄 UIController refreshing display...');
        
        if (this.appController && this.appController.incidentService) {
            try {
                const data = await this.appController.incidentService.loadIncidents();
                if (data && data.incidents) {
                    this.displayIncidents(data.incidents, data.center_code);
                }
            } catch (error) {
                console.error('❌ Error refreshing display:', error);
            }
        }
    }

    /**
     * Update status display
     * @param {Object} status - Status information
     */
    updateStatus(status) {
        const countElement = document.getElementById('incidentCount');
        if (countElement) {
            countElement.textContent = `${status.count} incidents`;
        }

        const lastUpdatedElement = document.getElementById('lastUpdated');
        if (lastUpdatedElement && status.lastUpdated) {
            lastUpdatedElement.textContent = `Last updated: ${this.formatTimestamp(status.lastUpdated)}`;
        }
    }

    /**
     * Format timestamp for display
     * @param {string} timestamp - ISO timestamp
     * @returns {string} Formatted timestamp
     */
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const timeString = date.toLocaleString("en-US", {
            timeZone: "America/Los_Angeles",
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        return `${timeString} PST`;
    }

    /**
     * Set current center
     * @param {string} center - Center code
     */
    setCurrentCenter(center) {
        console.log(`📡 UIController setting current center to ${center}`);
        
        if (this.appController && this.appController.incidentService) {
            this.appController.incidentService.setCurrentCenter(center);
            // Trigger a refresh to show data for the new center
            this.refreshDisplay();
        }
    }

    /**
     * Apply filters to incidents
     * @param {Object} filters - Active filters
     */
    applyFilters(filters) {
        console.log('🔍 UIController applying filters:', filters);
        // Filter logic would go here
        // For now, just refresh the display
        this.refreshDisplay();
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.stopAutoRefresh();
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
        }
        // No pending requests in SSE mode
    }
}

// Export for use in other modules
window.UIController = UIController;
