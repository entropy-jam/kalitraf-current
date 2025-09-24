/**
 * Incident Renderer
 * Single Responsibility: Renders incident data to UI
 * Open/Closed: Can be extended for different rendering strategies
 */

class IncidentRenderer extends IUIRenderer {
    constructor() {
        super();
        this.typeClassMap = {
            'Traffic Hazard': 'type-traffic-hazard',
            'Trfc Collision': 'type-collision',
            'SIG Alert': 'type-sig-alert',
            'Animal Hazard': 'type-animal-hazard',
            'Road/Weather': 'type-weather'
        };
    }

    /**
     * Render incidents to the container
     * @param {Array} incidents - Array of incident data
     * @param {HTMLElement} container - Container element
     * @param {Array} previousIncidents - Previous incidents for comparison
     */
    renderIncidents(incidents, container, previousIncidents = []) {
        if (!incidents || incidents.length === 0) {
            container.innerHTML = '<div class="loading">No incidents reported at this time.</div>';
            return;
        }

        const incidentsHtml = incidents.map(incident => {
            return this.renderSingleIncident(incident, previousIncidents);
        }).join('');

        container.innerHTML = incidentsHtml;
    }

    /**
     * Render a single incident
     * @param {Object} incident - Incident data
     * @param {Array} previousIncidents - Previous incidents for comparison
     * @returns {string} HTML string for the incident
     */
    renderSingleIncident(incident, previousIncidents = []) {
        const typeClass = this.getTypeClass(incident.type);
        const isNew = previousIncidents.length > 0 && 
                     !previousIncidents.find(prev => prev.id === incident.id);
        const newClass = isNew ? ' new' : '';

        return `
            <div class="incident${newClass}">
                <div class="incident-header">
                    <span class="incident-id">#${incident.id}</span>
                    <button class="copy-button" data-incident-id="${incident.id}" title="Copy incident details to clipboard">⧉</button>
                </div>
                <div class="incident-type ${typeClass}">${incident.type}</div>
                <div class="incident-location">${incident.location}</div>
                ${incident.location_desc ? `<div class="incident-location">${incident.location_desc}</div>` : ''}
                <div class="incident-area">${incident.area}</div>
                ${incident.center_name ? `<div class="incident-center">${incident.center_name} (${incident.center_code})</div>` : ''}
                <div class="incident-time">${incident.time}</div>
            </div>
        `;
    }

    /**
     * Get CSS class for incident type
     * @param {string} type - Incident type
     * @returns {string} CSS class name
     */
    getTypeClass(type) {
        for (const [key, className] of Object.entries(this.typeClassMap)) {
            if (type.includes(key)) {
                return className;
            }
        }
        return 'type-traffic-hazard';
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

        // Auto-remove after configured duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
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
     * Show error message
     * @param {string} message - Error message
     * @param {HTMLElement} container - Container to show error in
     */
    showError(message, container) {
        if (container) {
            container.innerHTML = `<div class="error">${message}</div>`;
        }
    }

    /**
     * Show loading state
     * @param {HTMLElement} container - Container to show loading in
     */
    showLoading(container) {
        if (container) {
            container.innerHTML = '<div class="loading">Loading incidents...</div>';
        }
    }
}

// Export for use in other modules
window.IncidentRenderer = IncidentRenderer;
