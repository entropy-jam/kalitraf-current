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
            this.appController.loadData();
        });
        
        // Handle auto-refresh checkbox
        document.getElementById('autoRefresh').addEventListener('change', () => {
            this.startAutoRefresh();
        });
        
        // Initial data load
        this.appController.loadData();
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
            // Force refresh from server
            await this.appController.loadData(true);
            
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
            this.dataManager.showNotification('Failed to refresh data. Please try again.', 'error');
            
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
                this.dataManager.loadData();
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
            this.dataManager.showNotification('Connection restored', 'success');
            // Try to refresh data when back online
            this.dataManager.loadData();
        });
        
        window.addEventListener('offline', () => {
            this.updateOnlineStatus();
            this.dataManager.showNotification('You are offline - using cached data', 'info');
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
     * Clean up resources
     */
    destroy() {
        this.stopAutoRefresh();
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
        }
        if (this.dataManager.pendingRequest) {
            this.dataManager.pendingRequest.abort();
        }
    }
}

// Export for use in other modules
window.UIController = UIController;
