/**
 * Incident Comparison Service
 * Single Responsibility: Handles incident comparison and difference detection
 */

class IncidentComparisonService {
    constructor(timeService, config) {
        this.timeService = timeService;
        this.config = config;
    }

    /**
     * Compare two incident datasets
     * @param {Array} oldIncidents - Previous incidents
     * @param {Array} newIncidents - Current incidents
     * @returns {Object} Comparison result with differences
     */
    compareIncidents(oldIncidents, newIncidents) {
        if (!oldIncidents || !newIncidents) {
            return { hasChanges: true, differences: [] };
        }

        const oldMap = new Map(oldIncidents.map(incident => [incident.id, incident]));
        const newMap = new Map(newIncidents.map(incident => [incident.id, incident]));

        const differences = [];

        // Find new incidents
        newIncidents.forEach(incident => {
            if (!oldMap.has(incident.id)) {
                differences.push({
                    type: 'new',
                    incident: incident,
                    time: this.timeService.parseIncidentTime(incident.time)
                });
            }
        });

        // Find removed incidents
        oldIncidents.forEach(incident => {
            if (!newMap.has(incident.id)) {
                differences.push({
                    type: 'removed',
                    incident: incident,
                    time: this.timeService.parseIncidentTime(incident.time)
                });
            }
        });

        return {
            hasChanges: differences.length > 0,
            differences: differences.sort((a, b) => b.time - a.time)
        };
    }

    /**
     * Filter differences by time window
     * @param {Array} differences - Array of differences
     * @returns {Array} Filtered differences
     */
    filterRecentDifferences(differences) {
        const timeWindow = this.config.get('differencesTimeWindow');
        const cutoffTime = new Date(Date.now() - timeWindow);
        
        return differences.filter(diff => 
            diff.time && diff.time >= cutoffTime
        );
    }
}

// Export for use in other modules
window.IncidentComparisonService = IncidentComparisonService;
