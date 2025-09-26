/**
 * Filter Service - Uses Strategy Pattern for extensible filtering
 * Open/Closed Principle: New filter strategies can be added without modifying this class
 */
class FilterService {
    constructor() {
        this.activeFilters = new Set();
        this.filterStrategies = new Map();
        this.compositeStrategy = new CompositeFilterStrategy();
        
        this.initializeDefaultStrategies();
        this.initializeFilters();
        this.setupEventListeners();
    }
    
    initializeDefaultStrategies() {
        // Create default filter strategies
        this.filterStrategies.set('filter-collision', new IncidentTypeFilterStrategy(['Trfc Collision', 'Traffic Collision', 'Collision']));
        this.filterStrategies.set('filter-hazard', new IncidentTypeFilterStrategy(['Traffic Hazard', 'Hazard']));
        this.filterStrategies.set('filter-fire', new IncidentTypeFilterStrategy(['Car Fire', 'Vehicle Fire', 'Fire']));
        this.filterStrategies.set('filter-break', new IncidentTypeFilterStrategy(['Traffic Break', 'Road Blocked', 'Break']));
        this.filterStrategies.set('filter-fatality', new IncidentTypeFilterStrategy(['Fatality', 'Fatal']));
        this.filterStrategies.set('filter-hitrun', new IncidentTypeFilterStrategy(['Hit and Run', 'Hit & Run']));
        this.filterStrategies.set('filter-sigalert', new IncidentTypeFilterStrategy(['SIG Alert', 'Sig Alert']));
        this.filterStrategies.set('filter-fire-report', new IncidentTypeFilterStrategy(['Report of Fire', 'Fire Report']));
        
        // Add strategies to composite
        this.filterStrategies.forEach(strategy => {
            this.compositeStrategy.addStrategy(strategy);
        });
    }
    
    initializeFilters() {
        // Set all filters as active by default
        this.filterStrategies.forEach((strategy, filterId) => {
            this.activeFilters.add(filterId);
        });
    }
    
    setupEventListeners() {
        // Individual filter checkboxes
        this.filterStrategies.forEach((strategy, filterId) => {
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
        this.filterStrategies.forEach((strategy, filterId) => {
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
        this.filterStrategies.forEach((strategy, filterId) => {
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
        
        // Use strategy pattern to check if incident should be shown
        for (const filterId of this.activeFilters) {
            const strategy = this.filterStrategies.get(filterId);
            if (strategy && strategy.shouldInclude(incident)) {
                return true;
            }
        }
        
        return false;
    }
    
    getActiveFilterCount() {
        return this.activeFilters.size;
    }
    
    getTotalFilterCount() {
        return this.filterStrategies.size;
    }
    
    /**
     * Add a new filter strategy (Open/Closed Principle)
     * @param {string} filterId - Unique identifier for the filter
     * @param {IFilterStrategy} strategy - Filter strategy implementation
     */
    addFilterStrategy(filterId, strategy) {
        this.filterStrategies.set(filterId, strategy);
        this.compositeStrategy.addStrategy(strategy);
    }
    
    /**
     * Remove a filter strategy
     * @param {string} filterId - Filter identifier to remove
     */
    removeFilterStrategy(filterId) {
        const strategy = this.filterStrategies.get(filterId);
        if (strategy) {
            this.filterStrategies.delete(filterId);
            this.compositeStrategy.removeStrategy(strategy.getName());
            this.activeFilters.delete(filterId);
        }
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
