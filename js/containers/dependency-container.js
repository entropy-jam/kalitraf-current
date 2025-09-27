/**
 * Dependency Injection Container
 * Manages dependencies and provides them to classes
 */

class DependencyContainer {
    constructor() {
        this.services = new Map();
        this.singletons = new Map();
    }

    /**
     * Register a service with the container
     * @param {string} name - Service name
     * @param {Function} factory - Factory function to create the service
     * @param {boolean} singleton - Whether to create as singleton
     */
    register(name, factory, singleton = false) {
        this.services.set(name, { factory, singleton });
    }

    /**
     * Get a service from the container
     * @param {string} name - Service name
     * @returns {*} Service instance
     */
    get(name) {
        const service = this.services.get(name);
        if (!service) {
            throw new Error(`Service '${name}' not registered`);
        }

        if (service.singleton) {
            if (!this.singletons.has(name)) {
                this.singletons.set(name, service.factory(this));
            }
            return this.singletons.get(name);
        }

        return service.factory(this);
    }

    /**
     * Check if a service is registered
     * @param {string} name - Service name
     * @returns {boolean} True if registered
     */
    has(name) {
        return this.services.has(name);
    }

    /**
     * Create AppController with all dependencies
     * @returns {AppController} Configured AppController
     */
    createAppController() {
        return new AppController({
            config: this.get('config'),
            storage: this.get('storage'),
            fetcher: this.get('fetcher'),
            renderer: this.get('renderer'),
            incidentService: this.get('incidentService'),
            multiCenterService: this.get('multiCenterService'),
            deltaService: this.get('deltaService'),
            filterService: this.get('filterService'),
            updatesManager: this.get('updatesManager')
        });
    }
}

/**
 * Default dependency configuration
 */
class DefaultDependencyConfig {
    static configure(container) {
        // Register core services as singletons
        container.register('config', () => new ConfigManager(), true);
        container.register('storage', () => new LocalStorageAdapter('chp_data_'), true);
        container.register('fetcher', () => new HttpFetcher(), true);
        container.register('renderer', () => new IncidentRenderer(), true);
        
        // Register abstracted services first
        container.register('incidentDataService', (container) => {
            return new IncidentDataService(
                container.get('storage'),
                container.get('fetcher'),
                container.get('config')
            );
        }, true);
        
        container.register('incidentTimeService', () => new IncidentTimeService(), true);
        
        container.register('incidentComparisonService', (container) => {
            return new IncidentComparisonService(
                container.get('incidentTimeService'),
                container.get('config')
            );
        }, true);
        
        container.register('incidentRealtimeService', (container) => {
            return new IncidentRealtimeService(
                container.get('incidentDataService'),
                container.get('config')
            );
        }, true);
        
        // Register business services as singletons
        container.register('incidentService', (container) => {
            return new IncidentService(
                container.get('storage'),
                container.get('fetcher'),
                container.get('config')
            );
        }, true);
        
        container.register('multiCenterService', (container) => {
            return new MultiCenterService(
                container.get('fetcher'),
                container.get('storage'),
                container.get('config')
            );
        }, true);
        
        container.register('deltaService', () => new DeltaService(), true);
        
        // Register UpdatesManager
        container.register('updatesManager', (container) => {
            return new UpdatesManager(container.get('deltaService'));
        }, true);
        
        // Register filter strategies
        container.register('compositeFilterStrategy', () => new CompositeFilterStrategy(), true);
        
        container.register('filterService', (container) => {
            return new FilterService(container.get('compositeFilterStrategy'));
        }, true);
    }
}

// Export for use in other modules
window.DependencyContainer = DependencyContainer;
window.DefaultDependencyConfig = DefaultDependencyConfig;
