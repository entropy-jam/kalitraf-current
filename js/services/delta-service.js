/**
 * Delta Service
 * Handles incremental updates from delta files
 * Single Responsibility: Process delta updates efficiently
 */

class DeltaService {
    constructor() {
        this.lastDeltaTimestamp = null;
        this.deltaCheckInterval = 10000; // Check for deltas every 10 seconds
        this.isProcessing = false;
    }

    /**
     * Start monitoring for delta updates
     */
    startDeltaMonitoring() {
        // Check for deltas immediately
        this.checkForDeltas();
        
        // Set up interval for checking deltas
        setInterval(() => {
            this.checkForDeltas();
        }, this.deltaCheckInterval);
    }

    /**
     * Check for new delta updates
     */
    async checkForDeltas() {
        if (this.isProcessing) return;
        
        try {
            const response = await fetch(`incident_deltas.json?t=${Date.now()}`, { 
                cache: 'no-store' 
            });
            
            if (!response.ok) {
                // Delta file doesn't exist or error - this is normal
                return;
            }
            
            const deltaData = await response.json();
            
            // Check if this is a new delta
            if (this.lastDeltaTimestamp && 
                deltaData.timestamp === this.lastDeltaTimestamp) {
                return; // Same delta, no need to process
            }
            
            // Process the delta
            await this.processDelta(deltaData);
            this.lastDeltaTimestamp = deltaData.timestamp;
            
        } catch (error) {
            // Delta file doesn't exist or other error - this is normal
            console.log('No delta file available or error checking deltas:', error.message);
        }
    }

    /**
     * Process delta updates
     * @param {Object} deltaData - Delta data from server
     */
    async processDelta(deltaData) {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        
        try {
            
            // Remove resolved incidents
            if (deltaData.removed_incidents && deltaData.removed_incidents.length > 0) {
                this.removeIncidents(deltaData.removed_incidents);
            }
            
            // Add new incidents
            if (deltaData.new_incidents && deltaData.new_incidents.length > 0) {
                this.addIncidents(deltaData.new_incidents);
            }
            
            // Update incident count
            this.updateIncidentCount();
            
            // Show notification
            this.showDeltaNotification(deltaData);
            
        } catch (error) {
            console.error('Error processing delta:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Remove incidents from the UI
     * @param {Array} incidents - Incidents to remove
     */
    removeIncidents(incidents) {
        incidents.forEach(incident => {
            const element = document.querySelector(`[data-incident-id="${incident.id}"]`);
            if (element) {
                // Add removal animation
                element.style.transition = 'all 0.3s ease';
                element.style.opacity = '0';
                element.style.transform = 'translateX(-100%)';
                
                setTimeout(() => {
                    element.remove();
                }, 300);
            }
        });
    }

    /**
     * Add incidents to the UI
     * @param {Array} incidents - Incidents to add
     */
    addIncidents(incidents) {
        const container = document.getElementById('incidentsContainer');
        if (!container) return;

        incidents.forEach(incident => {
            const element = this.createIncidentElement(incident);
            element.classList.add('new'); // Mark as new for animation
            container.insertBefore(element, container.firstChild);
        });
    }

    /**
     * Create incident element for delta updates
     * @param {Object} incident - Incident data
     * @returns {HTMLElement} Created incident element
     */
    createIncidentElement(incident) {
        const typeClass = this.renderer.getTypeClass(incident.type);
        
        const div = document.createElement('div');
        div.className = 'incident new';
        div.setAttribute('data-incident-id', incident.id);
        HTMLSanitizer.setInnerHTML(div, `
            <div class="incident-header">
                <span class="incident-id">#${incident.id}</span>
                <button class="copy-button" data-incident-id="${incident.id}" title="Copy incident details to clipboard">⧉</button>
            </div>
            <div class="incident-type ${typeClass}">${incident.type}</div>
            <div class="incident-location">${incident.location}</div>
            ${incident.location_desc ? `<div class="incident-location">${incident.location_desc}</div>` : ''}
            <div class="incident-area">${incident.area}</div>
            <div class="incident-time">${incident.time}</div>
        `);
        
        return div;
    }

    /**
     * Update incident count display
     */
    updateIncidentCount() {
        const container = document.getElementById('incidentsContainer');
        const countElement = document.getElementById('incidentCount');
        
        if (container && countElement) {
            const incidents = container.querySelectorAll('.incident:not(.virtual-scroll-item)');
            countElement.textContent = `${incidents.length} incidents`;
        }
    }

    /**
     * Show notification for delta updates
     * @param {Object} deltaData - Delta data
     */
    showDeltaNotification(deltaData) {
        const message = `Updated: ${deltaData.new_count} new, ${deltaData.removed_count} resolved`;
        
        // Remove existing notifications
        const existing = document.querySelector('.status-notification');
        if (existing) {
            existing.remove();
        }
        
        // Create new notification
        const notification = document.createElement('div');
        notification.className = 'status-notification info';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
}

// Export for use in other modules
window.DeltaService = DeltaService;
