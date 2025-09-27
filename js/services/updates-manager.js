/**
 * Updates Manager - Handles recent incident changes with time-based limiting
 * Integrates with DeltaService to show recent updates in a dedicated section
 */
class UpdatesManager {
    constructor(deltaService, config = {}, storage = null) {
        this.deltaService = deltaService;
        this.storage = storage;
        this.config = {
            defaultTimeWindow: 5, // minutes
            renderThrottle: 300,  // ms
            maxAgeMinutes: 60,    // Maximum age before auto-cleanup
            ...config
        };
        
        this.changes = [];
        this.userTimeWindow = this.config.defaultTimeWindow;
        this.isRendering = false;
        this.renderTimeout = null;
        this.uiInitialized = false;
        this.currentCenter = 'BCCC'; // Will be set by AppController
        
        // Delay UI initialization until DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeUI();
                this.setupEventListeners();
            });
        } else {
            // DOM is already ready
            this.initializeUI();
            this.setupEventListeners();
        }
    }
    
    initializeUI() {
        console.log('🔧 UpdatesManager: Initializing UI...');
        // Create updates section if it doesn't exist
        if (!document.getElementById('updatesSection')) {
            console.log('🔧 UpdatesManager: Creating updates section...');
            this.createUpdatesSection();
        } else {
            console.log('🔧 UpdatesManager: Updates section already exists');
        }
        this.uiInitialized = true;
        
        // Load persisted changes from storage
        this.loadPersistedChanges();
        
        // Render any queued changes now that UI is ready
        if (this.changes.length > 0) {
            console.log('🔧 UpdatesManager: Rendering queued changes...');
            this.throttledRender();
        }
    }
    
    createUpdatesSection() {
        const controlsDiv = document.querySelector('.controls');
        const statusDiv = document.querySelector('.status');
        
        console.log('🔧 UpdatesManager: Looking for controls and status divs...');
        console.log('🔧 Controls div found:', !!controlsDiv);
        console.log('🔧 Status div found:', !!statusDiv);
        
        if (!controlsDiv || !statusDiv) {
            console.error('Could not find controls or status div for updates section');
            console.error('Controls div:', controlsDiv);
            console.error('Status div:', statusDiv);
            return;
        }
        
        const updatesSection = document.createElement('div');
        updatesSection.id = 'updatesSection';
        updatesSection.className = 'updates-section';
        updatesSection.innerHTML = `
            <div class="updates-header">
                <h3>🔄 Recent Updates</h3>
                <div class="updates-controls">
                    <label for="updatesMinutes">Show updates for:</label>
                    <input type="number" id="updatesMinutes" value="${this.userTimeWindow}" 
                           min="1" max="60" step="1">
                    <span>minutes</span>
                    <div class="time-presets">
                        <button class="preset-btn" data-minutes="5">5m</button>
                        <button class="preset-btn" data-minutes="15">15m</button>
                        <button class="preset-btn" data-minutes="30">30m</button>
                        <button class="preset-btn" data-minutes="60">1h</button>
                    </div>
                </div>
                <div class="updates-stats">
                    <span id="updatesCount">0 updates</span>
                    <button id="clearUpdates" class="clear-btn">Clear</button>
                </div>
            </div>
            <div class="updates-container" id="updatesContainer">
                <div class="no-updates">No recent updates</div>
            </div>
        `;
        
        // Insert after controls div, before status div
        statusDiv.parentNode.insertBefore(updatesSection, statusDiv);
    }
    
    setupEventListeners() {
        // Time window input
        const minutesInput = document.getElementById('updatesMinutes');
        if (minutesInput) {
            minutesInput.addEventListener('change', (e) => {
                this.setTimeWindow(parseInt(e.target.value) || 5);
            });
        }
        
        // Time presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const minutes = parseInt(e.target.dataset.minutes);
                this.setTimeWindow(minutes);
                document.getElementById('updatesMinutes').value = minutes;
            });
        });
        
        // Clear updates
        const clearBtn = document.getElementById('clearUpdates');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearUpdates();
            });
        }
    }
    
    addChange(change) {
        try {
            // Add timestamp if not present
            if (!change.timestamp) {
                change.timestamp = Date.now();
            }
            
            // Add unique ID if not present
            if (!change.id) {
                change.id = `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
            
            this.changes.push(change);
            this.cleanOldChanges();
            
            // Persist changes to storage
            this.persistChanges();
            
            // Ensure UI is initialized before rendering
            if (this.uiInitialized) {
                this.throttledRender();
            } else {
                console.log('🔧 UpdatesManager: UI not yet initialized, change queued');
            }
            
        } catch (error) {
            this.handleError('Failed to add change', error);
        }
    }
    
    setTimeWindow(minutes) {
        this.userTimeWindow = Math.max(1, Math.min(60, minutes));
        this.cleanOldChanges();
        this.throttledRender();
    }
    
    cleanOldChanges() {
        const cutoff = Date.now() - (this.userTimeWindow * 60 * 1000);
        this.changes = this.changes.filter(change => change.timestamp > cutoff);
        
        // Also clean very old changes to prevent memory bloat
        const ageCutoff = Date.now() - (this.config.maxAgeMinutes * 60 * 1000);
        this.changes = this.changes.filter(change => change.timestamp > ageCutoff);
    }
    
    throttledRender() {
        if (this.renderTimeout) {
            clearTimeout(this.renderTimeout);
        }
        
        this.renderTimeout = setTimeout(() => {
            this.renderUpdates();
        }, this.config.renderThrottle);
    }
    
    renderUpdates() {
        try {
            const container = document.getElementById('updatesContainer');
            if (!container) return;
            
            this.cleanOldChanges();
            
            if (this.changes.length === 0) {
                container.innerHTML = '<div class="no-updates">No recent updates</div>';
                this.updateStats(0);
                return;
            }
            
            // Sort by timestamp (newest first)
            const sortedChanges = [...this.changes].sort((a, b) => b.timestamp - a.timestamp);
            
            const updatesHtml = sortedChanges.map(change => {
                const timeAgo = this.getTimeAgo(change.timestamp);
                const changeType = change.type || 'unknown';
                const incident = change.incident || {};
                
                return `
                    <div class="update-item ${changeType}" data-change-id="${change.id}">
                        <div class="update-header">
                            <span class="update-type">${this.getChangeIcon(changeType)}</span>
                            <span class="update-time">${timeAgo}</span>
                        </div>
                        <div class="update-details">
                            <span class="update-id">#${incident.id || 'Unknown'}</span>
                            <span class="update-type-text">${incident.type || 'Unknown Type'}</span>
                            <span class="update-location">${incident.location || 'Unknown Location'}</span>
                        </div>
                        ${change.details ? `<div class="update-details-text">${change.details}</div>` : ''}
                    </div>
                `;
            }).join('');
            
            container.innerHTML = updatesHtml;
            this.updateStats(this.changes.length);
            
        } catch (error) {
            this.handleError('Failed to render updates', error);
        }
    }
    
    getChangeIcon(type) {
        const icons = {
            'new': '🆕',
            'removed': '❌',
            'updated': '🔄',
            'status_changed': '📊',
            'location_changed': '📍',
            'type_changed': '🏷️'
        };
        return icons[type] || '📝';
    }
    
    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor(diff / 1000);
        
        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    }
    
    updateStats(count) {
        const countElement = document.getElementById('updatesCount');
        if (countElement) {
            countElement.textContent = `${count} update${count !== 1 ? 's' : ''}`;
        }
    }
    
    clearUpdates() {
        this.changes = [];
        this.clearPersistedChanges();
        this.renderUpdates();
    }
    
    handleError(message, error) {
        console.error(`${message}:`, error);
        
        const container = document.getElementById('updatesContainer');
        if (container) {
            container.innerHTML = `
                <div class="error">
                    <span class="error-icon">⚠️</span>
                    <span class="error-message">${message}</span>
                    <button class="retry-btn" onclick="location.reload()">Retry</button>
                </div>
            `;
        }
        
        // Show user notification
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    /**
     * Get current changes for external access
     */
    getChanges() {
        return [...this.changes];
    }
    
    /**
     * Get changes count
     */
    getChangesCount() {
        return this.changes.length;
    }
    
    /**
     * Set current center for persistence
     * @param {string} center - Center code
     */
    setCurrentCenter(center) {
        this.currentCenter = center;
        // Load changes for new center
        this.loadPersistedChanges();
    }
    
    /**
     * Load persisted changes from storage
     */
    async loadPersistedChanges() {
        if (!this.storage) return;
        
        try {
            const changesKey = `changes_${this.currentCenter}`;
            const persistedData = await this.storage.get(changesKey);
            
            if (persistedData && persistedData.changes) {
                // Check if data is still valid
                const now = Date.now();
                const maxAge = this.config.maxAgeMinutes * 60 * 1000;
                
                if (now - persistedData.timestamp < maxAge) {
                    this.changes = persistedData.changes;
                    console.log(`🔧 UpdatesManager: Loaded ${this.changes.length} persisted changes for ${this.currentCenter}`);
                    
                    // Clean old changes and render
                    this.cleanOldChanges();
                    if (this.uiInitialized) {
                        this.throttledRender();
                    }
                } else {
                    console.log('🔧 UpdatesManager: Persisted changes expired, clearing...');
                    this.changes = [];
                }
            }
        } catch (error) {
            console.error('Failed to load persisted changes:', error);
        }
    }
    
    /**
     * Persist changes to storage
     */
    async persistChanges() {
        if (!this.storage) return;
        
        try {
            const changesKey = `changes_${this.currentCenter}`;
            const persistedData = {
                changes: this.changes,
                timestamp: Date.now(),
                center: this.currentCenter
            };
            
            await this.storage.set(changesKey, persistedData);
            console.log(`🔧 UpdatesManager: Persisted ${this.changes.length} changes for ${this.currentCenter}`);
        } catch (error) {
            console.error('Failed to persist changes:', error);
        }
    }
    
    /**
     * Clear persisted changes
     */
    async clearPersistedChanges() {
        if (!this.storage) return;
        
        try {
            const changesKey = `changes_${this.currentCenter}`;
            await this.storage.remove(changesKey);
            console.log(`🔧 UpdatesManager: Cleared persisted changes for ${this.currentCenter}`);
        } catch (error) {
            console.error('Failed to clear persisted changes:', error);
        }
    }
}

// Export for use in other modules
window.UpdatesManager = UpdatesManager;
