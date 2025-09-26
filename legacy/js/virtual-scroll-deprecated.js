/**
 * Virtual Scrolling Module - DEPRECATED
 * 
 * ⚠️  NOT CURRENTLY IN USE
 * 
 * This module was designed for efficient rendering of large incident lists,
 * but analysis shows it's premature optimization for our current data scale (~21 incidents).
 * Modern browsers handle this volume effortlessly without virtualization.
 * 
 * Reasons for deprecation:
 * - Small dataset (21 incidents) doesn't require virtualization
 * - Adds unnecessary complexity and positioning conflicts
 * - Creates maintenance burden without performance benefits
 * - Can be re-implemented if incidents ever reach 100+ scale
 * 
 * Single Responsibility: Handles efficient rendering of large incident lists
 * Open/Closed: Can be extended without modification
 * Dependency Inversion: Depends on abstractions, not concrete implementations
 */

class VirtualScroll {
    constructor() {
        this.itemHeight = 80;
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
        console.warn('VirtualScroll is deprecated and not in use. Use regular rendering instead.');
        
        if (!container || !incidents) {
            console.error('VirtualScroll: Invalid container or incidents data');
            return;
        }

        this.incidents = incidents;
        this.totalHeight = incidents.length * this.itemHeight;
        
        // Create virtual scroll structure
        container.innerHTML = `
            <div class="virtual-scroll-viewport" style="height: 600px; overflow-y: auto; position: relative;">
                <div class="virtual-scroll-content" style="height: ${this.totalHeight}px; position: relative;"></div>
            </div>
        `;
        
        const viewport = container.querySelector('.virtual-scroll-viewport');
        const content = container.querySelector('.virtual-scroll-content');
        
        if (!viewport || !content) {
            console.error('VirtualScroll: Failed to create viewport or content elements');
            return;
        }
        
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
        
        const div = document.createElement('div');
        div.className = 'incident virtual-scroll-item';
        div.setAttribute('data-incident-id', incident.id);
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
