/**
 * Filter Strategies
 * Open/Closed Principle: New filter strategies can be added without modifying existing code
 */

// Base Filter Strategy Interface
class IFilterStrategy {
    shouldInclude(incident) {
        throw new Error('IFilterStrategy.shouldInclude() must be implemented');
    }
    
    getName() {
        throw new Error('IFilterStrategy.getName() must be implemented');
    }
}

// Incident Type Filter Strategy
class IncidentTypeFilterStrategy extends IFilterStrategy {
    constructor(keywords) {
        super();
        this.keywords = keywords || [];
    }
    
    shouldInclude(incident) {
        const incidentType = incident.type || '';
        return this.keywords.some(keyword => 
            incidentType.toLowerCase().includes(keyword.toLowerCase())
        );
    }
    
    getName() {
        return 'IncidentTypeFilter';
    }
}

// Location Filter Strategy
class LocationFilterStrategy extends IFilterStrategy {
    constructor(keywords) {
        super();
        this.keywords = keywords || [];
    }
    
    shouldInclude(incident) {
        const location = incident.location || '';
        const locationDesc = incident.location_desc || '';
        const locationText = `${location} ${locationDesc}`.toLowerCase();
        
        return this.keywords.some(keyword => 
            locationText.includes(keyword.toLowerCase())
        );
    }
    
    getName() {
        return 'LocationFilter';
    }
}

// Time Filter Strategy
class TimeFilterStrategy extends IFilterStrategy {
    constructor(timeWindow = 24 * 60 * 60 * 1000) { // 24 hours default
        super();
        this.timeWindow = timeWindow;
    }
    
    shouldInclude(incident) {
        try {
            const incidentTime = this.parseIncidentTime(incident.time);
            if (!incidentTime) return true; // Include if time parsing fails
            
            const now = new Date();
            const timeDiff = now - incidentTime;
            
            return timeDiff <= this.timeWindow;
        } catch (e) {
            return true; // Include if time parsing fails
        }
    }
    
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
    
    getName() {
        return 'TimeFilter';
    }
}

// Severity Filter Strategy
class SeverityFilterStrategy extends IFilterStrategy {
    constructor(minSeverity = 'low') {
        super();
        this.severityLevels = {
            'low': 1,
            'medium': 2,
            'high': 3,
            'critical': 4
        };
        this.minSeverity = this.severityLevels[minSeverity] || 1;
    }
    
    shouldInclude(incident) {
        const severity = this.getIncidentSeverity(incident);
        return severity >= this.minSeverity;
    }
    
    getIncidentSeverity(incident) {
        const type = incident.type || '';
        
        // Critical incidents
        if (type.includes('Fatality') || type.includes('Fatal')) {
            return 4;
        }
        
        // High severity incidents
        if (type.includes('Collision') || type.includes('Fire') || type.includes('SIG Alert')) {
            return 3;
        }
        
        // Medium severity incidents
        if (type.includes('Hazard') || type.includes('Break') || type.includes('Hit and Run')) {
            return 2;
        }
        
        // Low severity incidents
        return 1;
    }
    
    getName() {
        return 'SeverityFilter';
    }
}

// Composite Filter Strategy (combines multiple strategies)
class CompositeFilterStrategy extends IFilterStrategy {
    constructor(strategies = [], operator = 'AND') {
        super();
        this.strategies = strategies;
        this.operator = operator; // 'AND' or 'OR'
    }
    
    shouldInclude(incident) {
        if (this.strategies.length === 0) return true;
        
        const results = this.strategies.map(strategy => strategy.shouldInclude(incident));
        
        if (this.operator === 'AND') {
            return results.every(result => result);
        } else { // OR
            return results.some(result => result);
        }
    }
    
    addStrategy(strategy) {
        this.strategies.push(strategy);
    }
    
    removeStrategy(strategyName) {
        this.strategies = this.strategies.filter(s => s.getName() !== strategyName);
    }
    
    getName() {
        return `CompositeFilter(${this.strategies.map(s => s.getName()).join(', ')})`;
    }
}

// Export strategies
window.IFilterStrategy = IFilterStrategy;
window.IncidentTypeFilterStrategy = IncidentTypeFilterStrategy;
window.LocationFilterStrategy = LocationFilterStrategy;
window.TimeFilterStrategy = TimeFilterStrategy;
window.SeverityFilterStrategy = SeverityFilterStrategy;
window.CompositeFilterStrategy = CompositeFilterStrategy;
