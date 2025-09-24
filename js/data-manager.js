/**
 * Data Management Module
 * Handles data loading, refreshing, and difference detection
 */

class DataManager {
    constructor() {
        this.currentCenter = 'BCCC';
        this.previousIncidents = null;
        this.incidentHistory = [];
        this.pendingRequest = null;
        this.isRefreshing = false;
        this.cacheManager = new CacheManager();
    }

    /**
     * Load data with caching support
     * @param {boolean} forceRefresh - Force refresh from server
     * @returns {Promise} Promise resolving to incident data
     */
    async loadData(forceRefresh = false) {
        // Check cache first
        if (!forceRefresh) {
            const cachedData = this.cacheManager.getCachedData(this.currentCenter);
            if (cachedData) {
                console.log('Loading from cache');
                this.displayIncidents(cachedData);
                this.updateLastUpdated(cachedData.last_updated);
                this.showNotification('Loaded from cache', 'info');
                
                // Still refresh in background if cache is getting old
                const cacheAge = Date.now() - cachedData.timestamp;
                if (cacheAge > this.cacheManager.CACHE_DURATION * 0.8) { // Refresh when 80% expired
                    this.refreshInBackground();
                }
                return Promise.resolve(cachedData);
            }
        }
        
        // No cache or force refresh - fetch from server
        this.showRefreshIndicator();
        
        // Create abortable request
        const controller = new AbortController();
        const signal = controller.signal;
        
        // Store controller for potential cancellation
        if (this.pendingRequest) {
            this.pendingRequest.abort();
        }
        this.pendingRequest = controller;
        
        try {
            const response = await fetch(`active_incidents.json?t=${Date.now()}`, { 
                cache: 'no-store',
                signal: signal
            });
            
            if (!response.ok) {
                throw new Error('Failed to load data');
            }
            
            const data = await response.json();
            
            // Save to cache
            this.cacheManager.setCachedData(this.currentCenter, data);
            
            this.displayIncidents(data);
            this.updateLastUpdated(data.last_updated);
            this.showNotification('Data refreshed', 'success');
            return data;
        } catch (error) {
            // Don't handle aborted requests as errors
            if (error.name === 'AbortError') {
                throw error;
            }
            
            console.error('Error loading data:', error);
            
            // Try to fall back to cache on error
            const cachedData = this.cacheManager.getCachedData(this.currentCenter);
            if (cachedData) {
                console.log('Falling back to cache');
                this.displayIncidents(cachedData);
                this.updateLastUpdated(cachedData.last_updated);
                this.showNotification('Using cached data (offline)', 'info');
                return cachedData;
            } else {
                this.showError('Failed to load incident data. Please try again.');
                throw error;
            }
        } finally {
            this.hideRefreshIndicator();
            this.pendingRequest = null;
        }
    }

    /**
     * Refresh data in background
     */
    async refreshInBackground() {
        try {
            const response = await fetch(`active_incidents.json?t=${Date.now()}`, { cache: 'no-store' });
            const data = await response.json();
            
            // Check if data actually changed
            const currentData = this.cacheManager.getCachedData(this.currentCenter);
            if (currentData && this.hasDataChanged(currentData, data)) {
                console.log('Data changed - updating UI');
                this.cacheManager.setCachedData(this.currentCenter, data);
                this.displayIncidents(data);
                this.updateLastUpdated(data.last_updated);
                this.showNotification('New incidents detected!', 'info');
            } else {
                console.log('No changes detected - updating cache silently');
                this.cacheManager.setCachedData(this.currentCenter, data);
            }
        } catch (error) {
            console.log('Background refresh failed:', error);
        }
    }

    /**
     * Check if data has changed between two datasets
     * @param {Object} oldData - Previous data
     * @param {Object} newData - New data
     * @returns {boolean} True if data has changed
     */
    hasDataChanged(oldData, newData) {
        if (!oldData || !newData) return true;
        if (!oldData.incidents || !newData.incidents) return true;
        
        // Compare incident counts
        if (oldData.incident_count !== newData.incident_count) return true;
        
        // Compare incident IDs
        const oldIds = oldData.incidents.map(i => i.id).sort();
        const newIds = newData.incidents.map(i => i.id).sort();
        
        if (oldIds.length !== newIds.length) return true;
        
        for (let i = 0; i < oldIds.length; i++) {
            if (oldIds[i] !== newIds[i]) return true;
        }
        
        return false;
    }

    /**
     * Display incidents in the UI
     * @param {Object} data - Incident data
     */
    displayIncidents(data) {
        const container = document.getElementById('incidentsContainer');
        const countElement = document.getElementById('incidentCount');
        
        if (!data.incidents || data.incidents.length === 0) {
            container.innerHTML = '<div class="loading">No incidents reported at this time.</div>';
            countElement.textContent = '0 incidents';
            this.hideDifferences();
            return;
        }
        
        countElement.textContent = `${data.incident_count} incidents`;
        
        // Check for differences if we have previous data
        if (this.previousIncidents) {
            const differences = this.findDifferences(this.previousIncidents, data.incidents);
            if (differences.length > 0) {
                this.displayDifferences(differences);
            } else {
                this.hideDifferences();
            }
        }
        
        // Update previous incidents for next comparison
        this.previousIncidents = data.incidents;
        
        // Use virtual scrolling for better performance
        if (data.incidents.length > 10) {
            const virtualScroll = new VirtualScroll();
            virtualScroll.initVirtualScroll(container, data.incidents);
        } else {
            // For small lists, use regular rendering
            const incidentsHtml = data.incidents.map(incident => {
                const typeClass = this.getTypeClass(incident.type);
                const isNew = this.previousIncidents && !this.previousIncidents.find(prev => prev.id === incident.id);
                const newClass = isNew ? ' new' : '';
                
                return `
                    <div class="incident${newClass}">
                        <div class="incident-header">
                            <span class="incident-id">#${incident.id}</span>
                            <span class="incident-time">${incident.time}</span>
                        </div>
                        <div class="incident-type ${typeClass}">${incident.type}</div>
                        <div class="incident-location">${incident.location}</div>
                        ${incident.location_desc ? `<div class="incident-location">${incident.location_desc}</div>` : ''}
                        <div class="incident-area">${incident.area}</div>
                    </div>
                `;
            }).join('');
            
            container.innerHTML = incidentsHtml;
        }
    }

    /**
     * Get CSS class for incident type
     * @param {string} type - Incident type
     * @returns {string} CSS class name
     */
    getTypeClass(type) {
        const typeMap = {
            'Traffic Hazard': 'type-traffic-hazard',
            'Trfc Collision': 'type-collision',
            'SIG Alert': 'type-sig-alert',
            'Animal Hazard': 'type-animal-hazard',
            'Road/Weather': 'type-weather'
        };
        
        for (const [key, className] of Object.entries(typeMap)) {
            if (type.includes(key)) {
                return className;
            }
        }
        return 'type-traffic-hazard';
    }

    /**
     * Find differences between previous and current incidents
     * @param {Array} previous - Previous incidents
     * @param {Array} current - Current incidents
     * @returns {Array} Array of differences
     */
    findDifferences(previous, current) {
        const differences = [];
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        
        // Create maps for easy lookup
        const previousMap = new Map();
        previous.forEach(incident => {
            previousMap.set(incident.id, incident);
        });
        
        const currentMap = new Map();
        current.forEach(incident => {
            currentMap.set(incident.id, incident);
        });
        
        // Find new incidents
        current.forEach(incident => {
            if (!previousMap.has(incident.id)) {
                const incidentTime = this.parseIncidentTime(incident.time);
                if (incidentTime && incidentTime >= fiveMinutesAgo) {
                    differences.push({
                        type: 'new',
                        incident: incident,
                        time: incidentTime
                    });
                }
            }
        });
        
        // Find removed incidents
        previous.forEach(incident => {
            if (!currentMap.has(incident.id)) {
                const incidentTime = this.parseIncidentTime(incident.time);
                if (incidentTime && incidentTime >= fiveMinutesAgo) {
                    differences.push({
                        type: 'removed',
                        incident: incident,
                        time: incidentTime
                    });
                }
            }
        });
        
        // Sort by time (most recent first)
        return differences.sort((a, b) => b.time - a.time);
    }

    /**
     * Parse incident time string to Date object
     * @param {string} timeStr - Time string (e.g., "2:30 PM")
     * @returns {Date|null} Parsed date or null if invalid
     */
    parseIncidentTime(timeStr) {
        try {
            const now = new Date();
            const [time, period] = timeStr.split(' ');
            const [hours, minutes] = time.split(':');
            let hour = parseInt(hours);
            const mins = parseInt(minutes);
            
            if (period === 'PM' && hour !== 12) hour += 12;
            if (period === 'AM' && hour === 12) hour = 0;
            
            const incidentTime = new Date(now);
            incidentTime.setHours(hour, mins, 0, 0);
            
            // If the time is in the future, assume it's from yesterday
            if (incidentTime > now) {
                incidentTime.setDate(incidentTime.getDate() - 1);
            }
            
            return incidentTime;
        } catch (e) {
            return null;
        }
    }

    /**
     * Display differences in the UI
     * @param {Array} differences - Array of differences
     */
    displayDifferences(differences) {
        const section = document.getElementById('differencesSection');
        const container = document.getElementById('differencesContainer');
        
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
        section.style.display = 'none';
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
     * Update last updated timestamp
     * @param {string} timestamp - ISO timestamp
     */
    updateLastUpdated(timestamp) {
        const lastUpdatedElement = document.getElementById('lastUpdated');
        const date = new Date(timestamp);
        // Convert to PST timezone and add PST suffix
        const pstDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
        const timeString = pstDate.toLocaleString("en-US", {
            timeZone: "America/Los_Angeles",
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        lastUpdatedElement.textContent = `Last updated: ${timeString} PST`;
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const container = document.getElementById('incidentsContainer');
        container.innerHTML = `<div class="error">${message}</div>`;
    }

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, info)
     */
    showNotification(message, type = 'success') {
        // Remove existing notifications
        const existing = document.querySelector('.status-notification');
        if (existing) {
            existing.remove();
        }
        
        // Create new notification
        const notification = document.createElement('div');
        notification.className = `status-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    /**
     * Show refresh indicator
     */
    showRefreshIndicator() {
        document.getElementById('refreshIndicator').style.display = 'inline-block';
    }

    /**
     * Hide refresh indicator
     */
    hideRefreshIndicator() {
        document.getElementById('refreshIndicator').style.display = 'none';
    }

    /**
     * Set current communication center
     * @param {string} center - Center code
     */
    setCurrentCenter(center) {
        this.currentCenter = center;
    }
}

// Export for use in other modules
window.DataManager = DataManager;
