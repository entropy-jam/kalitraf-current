/**
 * Filter Service - Handles incident type filtering
 */
class FilterService {
    constructor() {
        this.activeFilters = new Set();
        this.filterMappings = {
            'filter-collision': ['Trfc Collision', 'Traffic Collision', 'Collision'],
            'filter-hazard': ['Traffic Hazard', 'Hazard'],
            'filter-fire': ['Car Fire', 'Vehicle Fire', 'Fire'],
            'filter-break': ['Traffic Break', 'Road Blocked', 'Break'],
            'filter-fatality': ['Fatality', 'Fatal'],
            'filter-hitrun': ['Hit and Run', 'Hit & Run'],
            'filter-sigalert': ['SIG Alert', 'Sig Alert'],
            'filter-fire-report': ['Report of Fire', 'Fire Report']
        };
        
        this.initializeFilters();
        this.setupEventListeners();
    }
    
    initializeFilters() {
        // Set all filters as active by default
        Object.keys(this.filterMappings).forEach(filterId => {
            this.activeFilters.add(filterId);
        });
    }
    
    setupEventListeners() {
        // Individual filter checkboxes
        Object.keys(this.filterMappings).forEach(filterId => {
            const checkbox = document.getElementById(filterId);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    this.toggleFilter(filterId, e.target.checked);
                });
            }
        });
        
        // Select All button
        const selectAllBtn = document.getElementById('selectAllFilters');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                this.selectAllFilters();
            });
        }
        
        // Clear All button
        const clearAllBtn = document.getElementById('clearAllFilters');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
    }
    
    toggleFilter(filterId, isActive) {
        if (isActive) {
            this.activeFilters.add(filterId);
        } else {
            this.activeFilters.delete(filterId);
        }
        
        // Trigger filter update event
        this.dispatchFilterChange();
    }
    
    selectAllFilters() {
        Object.keys(this.filterMappings).forEach(filterId => {
            this.activeFilters.add(filterId);
            const checkbox = document.getElementById(filterId);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
        
        this.dispatchFilterChange();
    }
    
    clearAllFilters() {
        this.activeFilters.clear();
        Object.keys(this.filterMappings).forEach(filterId => {
            const checkbox = document.getElementById(filterId);
            if (checkbox) {
                checkbox.checked = false;
            }
        });
        
        this.dispatchFilterChange();
    }
    
    shouldShowIncident(incident) {
        // If no filters are active, show nothing
        if (this.activeFilters.size === 0) {
            return false;
        }
        
        // Check if incident type matches any active filter
        const incidentType = incident.type || '';
        
        for (const filterId of this.activeFilters) {
            const keywords = this.filterMappings[filterId];
            if (keywords.some(keyword => 
                incidentType.toLowerCase().includes(keyword.toLowerCase())
            )) {
                return true;
            }
        }
        
        return false;
    }
    
    getActiveFilterCount() {
        return this.activeFilters.size;
    }
    
    getTotalFilterCount() {
        return Object.keys(this.filterMappings).length;
    }
    
    dispatchFilterChange() {
        const event = new CustomEvent('filterChanged', {
            detail: {
                activeFilters: Array.from(this.activeFilters),
                activeCount: this.activeFilters.size,
                totalCount: this.getTotalFilterCount()
            }
        });
        
        document.dispatchEvent(event);
    }
}

// Export for use in other modules
window.FilterService = FilterService;
