/**
 * Multi-Center Data Service
 * Handles fetching and aggregating data from multiple communication centers
 */

class MultiCenterService {
    constructor(fetcher, storage, config) {
        this.fetcher = fetcher;
        this.storage = storage;
        this.config = config;
        this.availableCenters = [
            'BFCC', 'BSCC', 'BICC', 'BCCC', 'CCCC', 'CHCC', 'ECCC', 'FRCC', 'GGCC', 'HMCC',
            'ICCC', 'INCC', 'LACC', 'MRCC', 'MYCC', 'OCCC', 'RDCC', 'SACC', 'SLCC', 'SKCCSTCC',
            'SUCC', 'TKCC', 'UKCC', 'VTCC', 'YKCC'
        ];
        this.selectedCenters = ['BCCC']; // Default to BCCC for backward compatibility
    }

    /**
     * Set selected centers for data aggregation
     * @param {string[]} centers - Array of center codes
     */
    setSelectedCenters(centers) {
        this.selectedCenters = centers;
        this.storage.set('selected_centers', centers);
    }

    /**
     * Get selected centers
     * @returns {string[]} Array of selected center codes
     */
    getSelectedCenters() {
        return this.selectedCenters;
    }

    /**
     * Load selected centers from storage
     */
    loadSelectedCenters() {
        const stored = this.storage.get('selected_centers');
        if (stored && Array.isArray(stored)) {
            this.selectedCenters = stored;
        }
    }

    /**
     * Fetch data from multiple centers and aggregate
     * @param {boolean} forceRefresh - Force refresh from server
     * @returns {Promise<Object>} Aggregated incident data
     */
    async loadMultiCenterData(forceRefresh = false) {
        const cacheKey = `multi_center_${this.selectedCenters.join('_')}`;
        
        // Check cache first
        if (!forceRefresh) {
            const cachedData = await this.storage.get(cacheKey);
            if (cachedData && this.isCacheValid(cachedData.timestamp)) {
                console.log('Loading multi-center data from cache');
                return cachedData;
            }
        }

        try {
            // Fetch data from all selected centers
            const centerPromises = this.selectedCenters.map(center => 
                this.fetchCenterData(center)
            );

            const centerResults = await Promise.allSettled(centerPromises);
            
            // Process results
            const centerData = {};
            const centerStats = {};
            let totalIncidents = 0;

            centerResults.forEach((result, index) => {
                const center = this.selectedCenters[index];
                
                if (result.status === 'fulfilled' && result.value) {
                    centerData[center] = result.value;
                    centerStats[center] = {
                        name: result.value.center_name || center,
                        count: result.value.incident_count || 0,
                        last_updated: result.value.last_updated
                    };
                    totalIncidents += result.value.incident_count || 0;
                } else {
                    console.warn(`Failed to load data for center ${center}:`, result.reason);
                    centerStats[center] = {
                        name: this.getCenterName(center),
                        count: 0,
                        last_updated: null,
                        status: 'error'
                    };
                }
            });

            // Aggregate incidents
            const aggregatedIncidents = this.aggregateIncidents(centerData);
            
            const aggregatedData = {
                centers: centerStats,
                total_incidents: aggregatedIncidents.length,
                incidents: aggregatedIncidents,
                last_updated: new Date().toISOString(),
                aggregation_timestamp: new Date().toISOString(),
                selected_centers: this.selectedCenters
            };

            // Cache the aggregated data
            await this.storage.set(cacheKey, {
                ...aggregatedData,
                timestamp: Date.now()
            });

            return aggregatedData;

        } catch (error) {
            console.error('Error loading multi-center data:', error);
            
            // Try to fall back to cache
            const cachedData = await this.storage.get(cacheKey);
            if (cachedData) {
                console.log('Falling back to cached multi-center data');
                return cachedData;
            }
            
            throw error;
        }
    }

    /**
     * Fetch data for a single center
     * @param {string} centerCode - Center code
     * @returns {Promise<Object>} Center data
     */
    async fetchCenterData(centerCode) {
        const filename = `data/active_incidents_${centerCode}.json`;
        
        try {
            return await this.fetcher.fetchJson(`${filename}?t=${Date.now()}`);
        } catch (error) {
            // If center-specific file doesn't exist, fall back to active_incidents.json for BCCC
            if (centerCode === 'BCCC') {
                console.log('Center-specific file not found, falling back to active_incidents.json');
                return await this.fetcher.fetchJson(`active_incidents.json?t=${Date.now()}`);
            }
            throw error;
        }
    }

    /**
     * Aggregate incidents from multiple centers
     * @param {Object} centerData - Data from multiple centers
     * @returns {Array} Aggregated incidents
     */
    aggregateIncidents(centerData) {
        const allIncidents = [];
        
        // Collect incidents from all centers
        Object.entries(centerData).forEach(([centerCode, data]) => {
            if (data && data.incidents) {
                data.incidents.forEach(incident => {
                    allIncidents.push({
                        ...incident,
                        center_code: centerCode,
                        center_name: data.center_name || centerCode
                    });
                });
            }
        });

        // Deduplicate incidents based on ID, location, and time
        const deduplicated = this.deduplicateIncidents(allIncidents);
        
        // Sort by time (most recent first)
        return deduplicated.sort((a, b) => {
            const timeA = a.time || '';
            const timeB = b.time || '';
            return timeB.localeCompare(timeA);
        });
    }

    /**
     * Remove duplicate incidents
     * @param {Array} incidents - Array of incidents
     * @returns {Array} Deduplicated incidents
     */
    deduplicateIncidents(incidents) {
        const seen = new Set();
        const deduplicated = [];

        incidents.forEach(incident => {
            // Create unique key based on ID, location, and time
            const key = `${incident.id}_${incident.location}_${incident.time}`;
            
            if (!seen.has(key)) {
                seen.add(key);
                deduplicated.push(incident);
            }
        });

        return deduplicated;
    }

    /**
     * Check if cache is still valid
     * @param {number} timestamp - Cache timestamp
     * @returns {boolean} True if cache is valid
     */
    isCacheValid(timestamp) {
        return CacheUtils.isCacheValid(timestamp, this.config, 'cacheTimeout');
    }

    /**
     * Get human-readable center name
     * @param {string} centerCode - Center code
     * @returns {string} Center name
     */
    getCenterName(centerCode) {
        const centers = {
            "BFCC": "Bakersfield",
            "BSCC": "Barstow", 
            "BICC": "Bishop",
            "BCCC": "Border",
            "CCCC": "Capitol",
            "CHCC": "Chico",
            "ECCC": "El Centro",
            "FRCC": "Fresno",
            "GGCC": "Golden Gate",
            "HMCC": "Humboldt",
            "ICCC": "Indio",
            "INCC": "Inland",
            "LACC": "Los Angeles",
            "MRCC": "Merced",
            "MYCC": "Monterey",
            "OCCC": "Orange County",
            "RDCC": "Redding",
            "SACC": "Sacramento",
            "SLCC": "San Luis Obispo",
            "SKCCSTCC": "Stockton",
            "SUCC": "Susanville",
            "TKCC": "Truckee",
            "UKCC": "Ukiah",
            "VTCC": "Ventura",
            "YKCC": "Yreka"
        };
        return centers[centerCode] || centerCode;
    }

    /**
     * Get available centers
     * @returns {string[]} Array of available center codes
     */
    getAvailableCenters() {
        return [...this.availableCenters];
    }
}

// Export for use in other modules
window.MultiCenterService = MultiCenterService;
