/**
 * Railway Dependency Configuration
 * Pure SSE implementation - no static file dependencies
 */

class RailwayDependencyConfig {
    static configure(container) {
        console.log('🔧 Configuring Railway dependencies (SSE-only)');
        
        // Register core services (no static file dependencies)
        container.register('storage', () => new LocalStorageAdapter(), true);
        
        container.register('config', () => new ConfigManager(), true);
        
        // Register HTTP fetcher (not used in SSE mode, but required by interface)
        container.register('httpFetcher', () => new HttpFetcher(), true);
        
        // Register incident data service (SSE-only)
        container.register('incidentDataService', (container) => {
            return new IncidentDataService(
                container.get('storage'),
                container.get('httpFetcher'),
                container.get('config')
            );
        }, true);
        
        // Register incident realtime service (SSE handler)
        container.register('incidentRealtimeService', (container) => {
            return new IncidentRealtimeService(
                container.get('incidentDataService'),
                container.get('config')
            );
        }, true);
        
        // Register incident service (main coordinator)
        container.register('incidentService', (container) => {
            return new IncidentService(
                container.get('incidentDataService'),
                container.get('incidentRealtimeService'),
                container.get('config')
            );
        }, true);
        
        // Register filter strategies
        container.register('compositeFilterStrategy', () => new CompositeFilterStrategy(), true);
        
        container.register('filterService', (container) => {
            return new FilterService(container.get('compositeFilterStrategy'));
        }, true);
        
        // Register incident renderer
        container.register('incidentRenderer', () => new IncidentRenderer(), true);
        
        // Register incident time service
        container.register('incidentTimeService', () => new IncidentTimeService(), true);
        
        // Multi-center service removed - uses static files
        // Data comes from SSE only
        
        // Register incident comparison service
        container.register('incidentComparisonService', () => new IncidentComparisonService(), true);
        
        // Register UI controller (SSE-only - simplified constructor)
        container.register('uiController', (container) => {
            return new UIController();
        }, true);
        
        // Register Railway app controller (SSE-only)
        container.register('appController', (container) => {
            return new RailwayAppController({
                incidentService: container.get('incidentService'),
                uiController: container.get('uiController'),
                config: container.get('config'),
                storage: container.get('storage'),
                renderer: container.get('incidentRenderer')
            });
        }, true);
        
        console.log('✅ Railway dependencies configured (SSE-only)');
    }
}

// Export for use in other modules
window.RailwayDependencyConfig = RailwayDependencyConfig;
