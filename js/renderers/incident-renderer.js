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

        // Lane blockage status indicator
        const laneBlockageStatus = this.getLaneBlockageStatus(incident.lane_blockage);
        const laneBlockageHtml = this.renderLaneBlockage(incident.lane_blockage);
        
        // Details section (collapsible)
        const detailsHtml = this.renderDetails(incident.details);

        return `
            <div class="incident${newClass}">
                <div class="incident-header">
                    <span class="incident-id">#${incident.id}</span>
                    <div class="incident-status">
                        ${laneBlockageStatus}
                        ${incident.is_new ? '<span class="status-badge new">NEW</span>' : ''}
                        ${incident.is_relevant ? '<span class="status-badge relevant">RELEVANT</span>' : ''}
                    </div>
                    <button class="copy-button" data-incident-id="${incident.id}" title="Copy incident details to clipboard">⧉</button>
                </div>
                <div class="incident-type ${typeClass}">${incident.type}</div>
                <div class="incident-location">${incident.location}</div>
                ${incident.location_desc ? `<div class="incident-location">${incident.location_desc}</div>` : ''}
                <div class="incident-area">${incident.area}</div>
                ${incident.center_name ? `<div class="incident-center">${incident.center_name} (${incident.center_code})</div>` : ''}
                <div class="incident-time">${incident.time}</div>
                ${laneBlockageHtml}
                ${detailsHtml}
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
     * Get lane blockage status indicator
     * @param {Object} laneBlockage - Lane blockage data
     * @returns {string} Status indicator HTML
     */
    getLaneBlockageStatus(laneBlockage) {
        if (!laneBlockage || !laneBlockage.status) return '';
        
        const status = laneBlockage.status;
        const statusClass = status === 'blocking' ? 'blocking' : 
                           status === 'resolved' ? 'resolved' : 
                           status === 'no_blockage' ? 'no-blockage' : 'unknown';
        
        const statusText = status === 'blocking' ? '🚧 BLOCKING' :
                          status === 'resolved' ? '✅ CLEARED' :
                          status === 'no_blockage' ? '🟢 NO BLOCKAGE' : '❓ UNKNOWN';
        
        return `<span class="lane-status ${statusClass}">${statusText}</span>`;
    }

    /**
     * Render lane blockage details
     * @param {Object} laneBlockage - Lane blockage data
     * @returns {string} Lane blockage HTML
     */
    renderLaneBlockage(laneBlockage) {
        if (!laneBlockage || !laneBlockage.details || laneBlockage.details.length === 0) {
            return '';
        }

        const detailsList = laneBlockage.details.map(detail => 
            `<li class="lane-detail">${detail}</li>`
        ).join('');

        return `
            <div class="lane-blockage">
                <div class="lane-blockage-header">
                    <span class="lane-blockage-title">Lane Information</span>
                </div>
                <ul class="lane-details">${detailsList}</ul>
            </div>
        `;
    }

    /**
     * Render incident details (collapsible)
     * @param {string} details - Incident details text
     * @returns {string} Details HTML
     */
    renderDetails(details) {
        if (!details || details.trim() === '') {
            return '';
        }

        // Split details by " | " and format as timeline
        const detailLines = details.split(' | ').map(line => line.trim()).filter(line => line);
        
        if (detailLines.length === 0) {
            return '';
        }

        const timelineItems = detailLines.map(line => 
            `<li class="detail-timeline-item">${line}</li>`
        ).join('');

        return `
            <div class="incident-details">
                <div class="details-header" onclick="this.parentElement.classList.toggle('expanded')">
                    <span class="details-title">Incident Timeline</span>
                    <span class="details-toggle">▼</span>
                </div>
                <div class="details-content">
                    <ul class="detail-timeline">${timelineItems}</ul>
                </div>
            </div>
        `;
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
