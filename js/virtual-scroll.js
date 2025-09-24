/**
 * Virtual Scrolling Module
 * Handles efficient rendering of large incident lists
 */

class VirtualScroll {
    constructor() {
        this.itemHeight = 80; // Approximate height of each incident card
        this.visibleCount = 8; // Number of visible items
        this.buffer = 2; // Extra items to render for smooth scrolling
        this.scrollTop = 0;
        this.totalHeight = 0;
        this.startIndex = 0;
        this.endIndex = 0;
    }

    /**
     * Initialize virtual scrolling for a container
     * @param {HTMLElement} container - Container element
     * @param {Array} incidents - Array of incident data
     */
    initVirtualScroll(container, incidents) {
        if (!incidents || incidents.length === 0) return;
        
        this.totalHeight = incidents.length * this.itemHeight;
        this.startIndex = 0;
        this.endIndex = Math.min(this.visibleCount + this.buffer, incidents.length);
        
        // Create virtual scroll container
        container.innerHTML = `
            <div class="virtual-scroll-viewport" id="virtualViewport">
                <div class="virtual-scroll-content" id="virtualContent" style="height: ${this.totalHeight}px;">
                </div>
            </div>
        `;
        
        const viewport = document.getElementById('virtualViewport');
        const content = document.getElementById('virtualContent');
        
        // Add scroll listener
        viewport.addEventListener('scroll', () => {
            this.scrollTop = viewport.scrollTop;
            this.updateVirtualScroll(incidents, content);
        });
        
        // Initial render
        this.updateVirtualScroll(incidents, content);
    }

    /**
     * Update visible items based on scroll position
     * @param {Array} incidents - Array of incident data
     * @param {HTMLElement} content - Content container element
     */
    updateVirtualScroll(incidents, content) {
        const startIndex = Math.floor(this.scrollTop / this.itemHeight);
        const endIndex = Math.min(startIndex + this.visibleCount + this.buffer, incidents.length);
        
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        
        // Clear existing items
        content.innerHTML = '';
        
        // Render visible items
        for (let i = startIndex; i < endIndex; i++) {
            const incident = incidents[i];
            const item = this.createIncidentElement(incident, i);
            item.style.position = 'absolute';
            item.style.top = `${i * this.itemHeight}px`;
            item.style.height = `${this.itemHeight}px`;
            content.appendChild(item);
        }
    }

    /**
     * Create incident element for virtual scrolling
     * @param {Object} incident - Incident data
     * @param {number} index - Index in the incidents array
     * @returns {HTMLElement} Created incident element
     */
    createIncidentElement(incident, index) {
        const typeClass = this.getTypeClass(incident.type);
        const isNew = window.previousIncidents && !window.previousIncidents.find(prev => prev.id === incident.id);
        const newClass = isNew ? ' new' : '';
        
        const div = document.createElement('div');
        div.className = `incident${newClass} virtual-scroll-item`;
        div.innerHTML = `
            <div class="incident-header">
                <span class="incident-id">#${incident.id}</span>
                <span class="incident-time">${incident.time}</span>
            </div>
            <div class="incident-type ${typeClass}">${incident.type}</div>
            <div class="incident-location">${incident.location}</div>
            ${incident.location_desc ? `<div class="incident-location">${incident.location_desc}</div>` : ''}
            <div class="incident-area">${incident.area}</div>
        `;
        
        return div;
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
}

// Export for use in other modules
window.VirtualScroll = VirtualScroll;
