/**
 * Application Diagnostic Script
 * Comprehensive tool to diagnose application initialization failures
 */

class ApplicationDiagnostic {
    constructor() {
        this.results = {
            environment: {},
            dependencies: {},
            initialization: {},
            services: {},
            errors: []
        };
        this.testResults = [];
        this.startTime = Date.now();
    }

    /**
     * Run complete application diagnostic
     */
    async runDiagnostic() {
        console.log('🔍 Starting Application Diagnostic...');
        
        try {
            // 1. Environment Analysis
            await this.analyzeEnvironment();
            
            // 2. Dependency Check
            await this.checkDependencies();
            
            // 3. Service Initialization Test
            await this.testServiceInitialization();
            
            // 4. Application Initialization Test
            await this.testApplicationInitialization();
            
            // 5. Server-Side Testing
            await this.testServerSideFunctionality();
            
            // 6. Generate Report
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Diagnostic failed:', error);
            this.results.errors.push({
                type: 'diagnostic-error',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Analyze current environment
     */
    async analyzeEnvironment() {
        console.log('📊 Analyzing environment...');
        
        this.results.environment = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            protocol: window.location.protocol,
            host: window.location.host,
            pathname: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
            localStorage: this.testLocalStorage(),
            sessionStorage: this.testSessionStorage(),
            indexedDB: this.testIndexedDB(),
            webSocket: this.testWebSocketSupport(),
            fetch: this.testFetchSupport(),
            es6: this.testES6Support(),
            timestamp: new Date().toISOString()
        };

        console.log('Environment:', this.results.environment);
    }

    /**
     * Test localStorage support
     */
    testLocalStorage() {
        try {
            const testKey = 'diagnostic_test';
            localStorage.setItem(testKey, 'test');
            const result = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            return {
                supported: true,
                working: result === 'test'
            };
        } catch (error) {
            return {
                supported: false,
                error: error.message
            };
        }
    }

    /**
     * Test sessionStorage support
     */
    testSessionStorage() {
        try {
            const testKey = 'diagnostic_test';
            sessionStorage.setItem(testKey, 'test');
            const result = sessionStorage.getItem(testKey);
            sessionStorage.removeItem(testKey);
            return {
                supported: true,
                working: result === 'test'
            };
        } catch (error) {
            return {
                supported: false,
                error: error.message
            };
        }
    }

    /**
     * Test IndexedDB support
     */
    testIndexedDB() {
        try {
            return {
                supported: 'indexedDB' in window,
                available: !!window.indexedDB
            };
        } catch (error) {
            return {
                supported: false,
                error: error.message
            };
        }
    }

    /**
     * Test WebSocket support
     */
    testWebSocketSupport() {
        try {
            return {
                supported: 'WebSocket' in window,
                available: !!window.WebSocket
            };
        } catch (error) {
            return {
                supported: false,
                error: error.message
            };
        }
    }

    /**
     * Test Fetch API support
     */
    testFetchSupport() {
        try {
            return {
                supported: 'fetch' in window,
                available: !!window.fetch
            };
        } catch (error) {
            return {
                supported: false,
                error: error.message
            };
        }
    }

    /**
     * Test ES6 support
     */
    testES6Support() {
        try {
            // Test arrow functions
            const arrowFunction = () => true;
            // Test template literals
            const template = `test ${'string'}`;
            // Test destructuring
            const { test } = { test: 'value' };
            // Test classes
            class TestClass {}
            
            return {
                supported: true,
                arrowFunctions: typeof arrowFunction === 'function',
                templateLiterals: template === 'test string',
                destructuring: test === 'value',
                classes: typeof TestClass === 'function'
            };
        } catch (error) {
            return {
                supported: false,
                error: error.message
            };
        }
    }

    /**
     * Check JavaScript dependencies
     */
    async checkDependencies() {
        console.log('🔍 Checking dependencies...');
        
        const dependencies = [
            'ConfigManager',
            'LocalStorageAdapter', 
            'HttpFetcher',
            'IncidentRenderer',
            'IncidentService',
            'MultiCenterService',
            'DeltaService',
            'FilterService',
            'UIController',
            'RailwayWebSocketService',
            'RailwayAppController',
            'AppController',
            'IConfigManager',
            'IDataStorage',
            'IDataFetcher',
            'IUIRenderer'
        ];

        this.results.dependencies = {};

        for (const dep of dependencies) {
            try {
                const isAvailable = typeof window[dep] !== 'undefined';
                this.results.dependencies[dep] = {
                    available: isAvailable,
                    type: isAvailable ? typeof window[dep] : 'undefined'
                };
                
                if (!isAvailable) {
                    console.warn(`⚠️ Missing dependency: ${dep}`);
                }
            } catch (error) {
                this.results.dependencies[dep] = {
                    available: false,
                    error: error.message
                };
            }
        }

        console.log('Dependencies:', this.results.dependencies);
    }

    /**
     * Test service initialization
     */
    async testServiceInitialization() {
        console.log('🧪 Testing service initialization...');
        
        const services = [
            { name: 'ConfigManager', test: () => new ConfigManager() },
            { name: 'LocalStorageAdapter', test: () => new LocalStorageAdapter('test_') },
            { name: 'HttpFetcher', test: () => new HttpFetcher() },
            { name: 'IncidentRenderer', test: () => new IncidentRenderer() },
            { name: 'IncidentService', test: () => {
                const config = new ConfigManager();
                const storage = new LocalStorageAdapter('test_');
                const fetcher = new HttpFetcher();
                return new IncidentService(storage, fetcher, config);
            }},
            { name: 'MultiCenterService', test: () => {
                const config = new ConfigManager();
                const storage = new LocalStorageAdapter('test_');
                const fetcher = new HttpFetcher();
                return new MultiCenterService(fetcher, storage, config);
            }},
            { name: 'DeltaService', test: () => new DeltaService() },
            { name: 'FilterService', test: () => new FilterService() }
        ];

        this.results.services = {};

        for (const service of services) {
            try {
                const instance = service.test();
                this.results.services[service.name] = {
                    initialized: true,
                    instance: instance,
                    methods: this.getServiceMethods(instance)
                };
                console.log(`✅ ${service.name} initialized successfully`);
            } catch (error) {
                this.results.services[service.name] = {
                    initialized: false,
                    error: error.message,
                    stack: error.stack
                };
                console.error(`❌ ${service.name} failed to initialize:`, error);
            }
        }
    }

    /**
     * Get service methods
     */
    getServiceMethods(instance) {
        const methods = [];
        for (const prop in instance) {
            if (typeof instance[prop] === 'function') {
                methods.push(prop);
            }
        }
        return methods;
    }

    /**
     * Test application initialization
     */
    async testApplicationInitialization() {
        console.log('🚀 Testing application initialization...');
        
        this.results.initialization = {
            domReady: document.readyState === 'complete',
            bodyExists: !!document.body,
            requiredElements: this.checkRequiredElements(),
            scriptsLoaded: await this.checkScriptsLoaded(),
            stylesLoaded: this.checkStylesLoaded()
        };

        // Test AppController initialization
        try {
            if (typeof AppController !== 'undefined') {
                const appController = new AppController();
                this.results.initialization.appController = {
                    created: true,
                    initialized: false
                };
                
                // Try to initialize
                try {
                    await appController.initialize();
                    this.results.initialization.appController.initialized = true;
                    console.log('✅ AppController initialized successfully');
                } catch (error) {
                    this.results.initialization.appController.initialized = false;
                    this.results.initialization.appController.error = error.message;
                    console.error('❌ AppController initialization failed:', error);
                }
            } else {
                this.results.initialization.appController = {
                    created: false,
                    error: 'AppController not defined'
                };
            }
        } catch (error) {
            this.results.initialization.appController = {
                created: false,
                error: error.message
            };
        }

        // Test RailwayAppController initialization
        try {
            if (typeof RailwayAppController !== 'undefined') {
                const railwayAppController = new RailwayAppController();
                this.results.initialization.railwayAppController = {
                    created: true,
                    initialized: false
                };
                
                // Try to initialize
                try {
                    await railwayAppController.initialize();
                    this.results.initialization.railwayAppController.initialized = true;
                    console.log('✅ RailwayAppController initialized successfully');
                } catch (error) {
                    this.results.initialization.railwayAppController.initialized = false;
                    this.results.initialization.railwayAppController.error = error.message;
                    console.error('❌ RailwayAppController initialization failed:', error);
                }
            } else {
                this.results.initialization.railwayAppController = {
                    created: false,
                    error: 'RailwayAppController not defined'
                };
            }
        } catch (error) {
            this.results.initialization.railwayAppController = {
                created: false,
                error: error.message
            };
        }
    }

    /**
     * Check required DOM elements
     */
    checkRequiredElements() {
        const requiredElements = [
            'incident-list',
            'status-display', 
            'controls',
            'themeToggle',
            'incidentsContainer',
            'incidentCount',
            'lastUpdated',
            'centerSelect',
            'refreshBtn',
            'autoRefresh'
        ];

        const results = {};
        for (const elementId of requiredElements) {
            const element = document.getElementById(elementId);
            results[elementId] = {
                exists: !!element,
                tagName: element ? element.tagName : null,
                className: element ? element.className : null,
                innerHTML: element ? element.innerHTML.substring(0, 50) + '...' : null
            };
        }

        return results;
    }

    /**
     * Check if scripts are loaded
     */
    async checkScriptsLoaded() {
        const requiredScripts = [
            'js/config-manager.js',
            'js/storage/local-storage.js',
            'js/fetchers/http-fetcher.js',
            'js/renderers/incident-renderer.js',
            'js/services/incident-service.js',
            'js/services/multi-center-service.js',
            'js/services/delta-service.js',
            'js/services/filter-service.js',
            'js/controllers/app-controller.js',
            'js/app-railway.js'
        ];

        const results = {};
        const scripts = document.querySelectorAll('script[src]');
        const loadedScripts = Array.from(scripts).map(script => script.src);

        for (const script of requiredScripts) {
            const foundScript = loadedScripts.find(src => src.includes(script));
            results[script] = {
                loaded: !!foundScript,
                url: foundScript || null,
                accessible: false
            };
        }

        // Test script accessibility
        return await this.testScriptAccessibility(results);
    }

    /**
     * Test if scripts are actually accessible
     */
    async testScriptAccessibility(results) {
        for (const [scriptName, info] of Object.entries(results)) {
            if (info.loaded && info.url) {
                try {
                    const response = await fetch(info.url, { method: 'HEAD' });
                    info.accessible = response.ok;
                    info.status = response.status;
                    if (!response.ok) {
                        info.error = `HTTP ${response.status}: ${response.statusText}`;
                    }
                } catch (error) {
                    info.accessible = false;
                    info.error = error.message;
                }
            }
        }
        return results;
    }

    /**
     * Check if styles are loaded
     */
    checkStylesLoaded() {
        const styles = document.querySelectorAll('link[rel="stylesheet"], style');
        return {
            count: styles.length,
            styles: Array.from(styles).map(style => ({
                type: style.tagName,
                href: style.href || 'inline',
                media: style.media || 'all'
            }))
        };
    }

    /**
     * Generate comprehensive diagnostic report
     */
    generateReport() {
        const duration = Date.now() - this.startTime;
        
        console.log('\n📋 Application Diagnostic Report');
        console.log('================================');
        console.log(`⏱️  Diagnostic completed in ${duration}ms`);
        
        // Environment Summary
        console.log('\n🌍 Environment:');
        console.log(`   Browser: ${this.results.environment.userAgent}`);
        console.log(`   Platform: ${this.results.environment.platform}`);
        console.log(`   Protocol: ${this.results.environment.protocol}`);
        console.log(`   Online: ${this.results.environment.onLine ? 'Yes' : 'No'}`);
        console.log(`   LocalStorage: ${this.results.environment.localStorage.supported ? 'Supported' : 'Not Supported'}`);
        console.log(`   WebSocket: ${this.results.environment.webSocket.supported ? 'Supported' : 'Not Supported'}`);
        console.log(`   Fetch: ${this.results.environment.fetch.supported ? 'Supported' : 'Not Supported'}`);
        console.log(`   ES6: ${this.results.environment.es6.supported ? 'Supported' : 'Not Supported'}`);
        
        // Dependencies Analysis
        console.log('\n📦 Dependencies:');
        const missingDeps = Object.entries(this.results.dependencies)
            .filter(([name, info]) => !info.available);
        
        if (missingDeps.length === 0) {
            console.log('   ✅ All dependencies available');
        } else {
            console.log(`   ❌ Missing dependencies (${missingDeps.length}):`);
            missingDeps.forEach(([name]) => console.log(`      - ${name}`));
        }
        
        // Services Analysis
        console.log('\n🔧 Services:');
        const failedServices = Object.entries(this.results.services)
            .filter(([name, info]) => !info.initialized);
        
        if (failedServices.length === 0) {
            console.log('   ✅ All services initialized successfully');
        } else {
            console.log(`   ❌ Failed services (${failedServices.length}):`);
            failedServices.forEach(([name, info]) => {
                console.log(`      - ${name}: ${info.error}`);
            });
        }
        
        // Initialization Analysis
        console.log('\n🚀 Initialization:');
        console.log(`   DOM Ready: ${this.results.initialization.domReady ? 'Yes' : 'No'}`);
        console.log(`   Body Exists: ${this.results.initialization.bodyExists ? 'Yes' : 'No'}`);

        // Server-Side Analysis
        if (this.results.serverSide) {
            console.log('\n🌐 Server-Side Testing:');
            
            // Data Endpoints
            if (this.results.serverSide.dataEndpoints) {
                console.log(`   Data Endpoints: ${this.results.serverSide.dataEndpoints.summary}`);
                this.results.serverSide.dataEndpoints.results.forEach(result => {
                    const status = result.success ? '✅' : '❌';
                    console.log(`      ${status} ${result.endpoint}: ${result.status} ${result.success ? `(${result.incidentCount} incidents)` : ''}`);
                });
            }
            
            // WebSocket
            if (this.results.serverSide.websocketConnection) {
                const ws = this.results.serverSide.websocketConnection;
                const status = ws.success ? '✅' : '❌';
                console.log(`   WebSocket: ${status} ${ws.success ? 'Connected' : ws.error}`);
                console.log(`      URL: ${ws.url}`);
            }
            
            // Static Files
            if (this.results.serverSide.staticFiles) {
                console.log(`   Static Files: ${this.results.serverSide.staticFiles.summary}`);
            }
            
            // Server Response
            if (this.results.serverSide.serverResponse) {
                const sr = this.results.serverSide.serverResponse;
                const status = sr.success ? '✅' : '❌';
                console.log(`   Server Response: ${status} ${sr.responseTime}ms (${sr.status})`);
            }
        }
        
        // Required Elements
        const missingElements = Object.entries(this.results.initialization.requiredElements)
            .filter(([name, info]) => !info.exists);
        
        if (missingElements.length === 0) {
            console.log('   ✅ All required elements present');
        } else {
            console.log(`   ❌ Missing elements (${missingElements.length}):`);
            missingElements.forEach(([name]) => console.log(`      - ${name}`));
        }
        
        // Scripts
        const missingScripts = Object.entries(this.results.initialization.scriptsLoaded)
            .filter(([name, info]) => !info.loaded);
        const inaccessibleScripts = Object.entries(this.results.initialization.scriptsLoaded)
            .filter(([name, info]) => info.loaded && !info.accessible);
        
        if (missingScripts.length === 0 && inaccessibleScripts.length === 0) {
            console.log('   ✅ All required scripts loaded and accessible');
        } else {
            if (missingScripts.length > 0) {
                console.log(`   ❌ Missing scripts (${missingScripts.length}):`);
                missingScripts.forEach(([name]) => console.log(`      - ${name}`));
            }
            if (inaccessibleScripts.length > 0) {
                console.log(`   ❌ Inaccessible scripts (${inaccessibleScripts.length}):`);
                inaccessibleScripts.forEach(([name, info]) => {
                    console.log(`      - ${name}: ${info.error || 'Unknown error'}`);
                });
            }
        }
        
        // Application Controllers
        console.log('\n🎮 Application Controllers:');
        if (this.results.initialization.appController) {
            const status = this.results.initialization.appController.initialized ? '✅' : '❌';
            console.log(`   ${status} AppController: ${this.results.initialization.appController.initialized ? 'Initialized' : 'Failed'}`);
            if (this.results.initialization.appController.error) {
                console.log(`      Error: ${this.results.initialization.appController.error}`);
            }
        }
        
        if (this.results.initialization.railwayAppController) {
            const status = this.results.initialization.railwayAppController.initialized ? '✅' : '❌';
            console.log(`   ${status} RailwayAppController: ${this.results.initialization.railwayAppController.initialized ? 'Initialized' : 'Failed'}`);
            if (this.results.initialization.railwayAppController.error) {
                console.log(`      Error: ${this.results.initialization.railwayAppController.error}`);
            }
        }
        
        // Recommendations
        console.log('\n💡 Recommendations:');
        this.generateRecommendations();
        
        // Fixes
        console.log('\n🔧 Suggested Fixes:');
        this.generateFixes();
    }

    /**
     * Generate recommendations based on diagnostic results
     */
    generateRecommendations() {
        const recommendations = [];
        
        // Check for missing dependencies
        const missingDeps = Object.entries(this.results.dependencies)
            .filter(([name, info]) => !info.available);
        
        if (missingDeps.length > 0) {
            recommendations.push('Load missing JavaScript dependencies');
            recommendations.push('Check script loading order in HTML');
        }
        
        // Check for failed services
        const failedServices = Object.entries(this.results.services)
            .filter(([name, info]) => !info.initialized);
        
        if (failedServices.length > 0) {
            recommendations.push('Fix service initialization errors');
            recommendations.push('Check service dependencies and constructor parameters');
        }
        
        // Check for missing elements
        const missingElements = Object.entries(this.results.initialization.requiredElements)
            .filter(([name, info]) => !info.exists);
        
        if (missingElements.length > 0) {
            recommendations.push('Add missing HTML elements to index.html');
            recommendations.push('Check element IDs and structure');
        }
        
        // Check for missing scripts
        const missingScripts = Object.entries(this.results.initialization.scriptsLoaded)
            .filter(([name, info]) => !info.loaded);
        
        if (missingScripts.length > 0) {
            recommendations.push('Add missing script tags to HTML');
            recommendations.push('Check script file paths and availability');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('Application appears to be properly configured');
            recommendations.push('Check browser console for runtime errors');
        }
        
        recommendations.forEach(rec => console.log(`   • ${rec}`));
    }

    /**
     * Generate specific fixes for identified issues
     */
    generateFixes() {
        const fixes = [];
        
        // Missing dependencies
        const missingDeps = Object.entries(this.results.dependencies)
            .filter(([name, info]) => !info.available);
        
        if (missingDeps.length > 0) {
            fixes.push('Missing Dependencies:');
            missingDeps.forEach(([name]) => {
                fixes.push(`  • Add <script src="js/[module].js"></script> for ${name}`);
            });
        }
        
        // Failed services
        const failedServices = Object.entries(this.results.services)
            .filter(([name, info]) => !info.initialized);
        
        if (failedServices.length > 0) {
            fixes.push('Service Initialization Issues:');
            failedServices.forEach(([name, info]) => {
                fixes.push(`  • ${name}: ${info.error}`);
            });
        }
        
        // Missing elements
        const missingElements = Object.entries(this.results.initialization.requiredElements)
            .filter(([name, info]) => !info.exists);
        
        if (missingElements.length > 0) {
            fixes.push('Missing HTML Elements:');
            missingElements.forEach(([name]) => {
                fixes.push(`  • Add <div id="${name}"></div> to index.html`);
            });
        }
        
        // Missing scripts
        const missingScripts = Object.entries(this.results.initialization.scriptsLoaded)
            .filter(([name, info]) => !info.loaded);
        
        if (missingScripts.length > 0) {
            fixes.push('Missing Scripts:');
            missingScripts.forEach(([name]) => {
                fixes.push(`  • Add <script src="${name}"></script> to index.html`);
            });
        }
        
        if (fixes.length === 0) {
            fixes.push('No specific fixes needed - check console for runtime errors');
        }
        
        fixes.forEach(fix => console.log(`   ${fix}`));
    }

    /**
     * Get diagnostic results as JSON
     */
    getResults() {
        return {
            environment: this.results.environment,
            dependencies: this.results.dependencies,
            services: this.results.services,
            initialization: this.results.initialization,
            errors: this.results.errors,
            timestamp: new Date().toISOString(),
            duration: Date.now() - this.startTime
        };
    }

    /**
     * Export results to file
     */
    exportResults() {
        const results = this.getResults();
        const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `app-diagnostic-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('📁 Application diagnostic results exported to file');
    }

    /**
     * Test server-side functionality
     */
    async testServerSideFunctionality() {
        console.log('🌐 Testing server-side functionality...');
        
        const serverTests = {
            dataEndpoints: await this.testDataEndpoints(),
            websocketConnection: await this.testWebSocketConnection(),
            staticFiles: await this.testStaticFiles(),
            serverResponse: await this.testServerResponse()
        };
        
        this.results.serverSide = serverTests;
        
        // Count successful tests
        const totalTests = Object.keys(serverTests).length;
        const successfulTests = Object.values(serverTests).filter(result => result.success).length;
        
        console.log(`🌐 Server-side tests: ${successfulTests}/${totalTests} passed`);
    }

    /**
     * Test data endpoints
     */
    async testDataEndpoints() {
        const endpoints = [
            'data/active_incidents_BCCC.json',
            'data/active_incidents_LACC.json', 
            'data/active_incidents_SACC.json',
            'data/active_incidents_OCCC.json',
            'data/active_incidents.json'
        ];
        
        const results = [];
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${endpoint}?t=${Date.now()}`);
                const success = response.ok;
                const data = success ? await response.json() : null;
                
                results.push({
                    endpoint,
                    success,
                    status: response.status,
                    hasData: data && data.incidents && data.incidents.length > 0,
                    incidentCount: data ? (data.incident_count || data.incidents?.length || 0) : 0
                });
                
                console.log(`${success ? '✅' : '❌'} ${endpoint}: ${response.status} ${success ? `(${data.incident_count || 0} incidents)` : ''}`);
                
            } catch (error) {
                results.push({
                    endpoint,
                    success: false,
                    error: error.message
                });
                console.log(`❌ ${endpoint}: ${error.message}`);
            }
        }
        
        return {
            success: results.some(r => r.success),
            results,
            summary: `${results.filter(r => r.success).length}/${results.length} endpoints accessible`
        };
    }

    /**
     * Test WebSocket connection
     */
    async testWebSocketConnection() {
        return new Promise((resolve) => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.protocol === 'https:'
                ? window.location.host
                : `${window.location.hostname}:8080`;
            
            const wsUrl = window.location.protocol === 'https:'
                ? `${protocol}//${host}/ws?upgrade_wait=0s&first_msg_wait=0s`
                : `${protocol}//${host}`;
            
            console.log(`🔌 Testing WebSocket: ${wsUrl}`);
            
            const ws = new WebSocket(wsUrl);
            let connected = false;
            let messageReceived = false;
            
            const timeout = setTimeout(() => {
                ws.close();
                resolve({
                    success: false,
                    error: 'Connection timeout',
                    url: wsUrl
                });
            }, 5000);
            
            ws.onopen = () => {
                connected = true;
                console.log('✅ WebSocket connected');
            };
            
            ws.onmessage = (event) => {
                messageReceived = true;
                console.log('📡 WebSocket message received:', event.data);
                clearTimeout(timeout);
                ws.close();
                resolve({
                    success: true,
                    connected,
                    messageReceived,
                    url: wsUrl
                });
            };
            
            ws.onerror = (error) => {
                console.log('❌ WebSocket error:', error);
                clearTimeout(timeout);
                resolve({
                    success: false,
                    error: 'Connection failed',
                    url: wsUrl
                });
            };
            
            ws.onclose = (event) => {
                if (!messageReceived) {
                    clearTimeout(timeout);
                    resolve({
                        success: false,
                        error: `Connection closed: ${event.code}`,
                        url: wsUrl
                    });
                }
            };
        });
    }

    /**
     * Test static file serving
     */
    async testStaticFiles() {
        const files = [
            'index.html',
            'js/app-railway.js',
            'js/controllers/app-controller.js',
            'js/ui-controller.js',
            'js/renderers/incident-renderer.js',
            'assets/styles.css'
        ];
        
        const results = [];
        
        for (const file of files) {
            try {
                const response = await fetch(`${file}?t=${Date.now()}`);
                results.push({
                    file,
                    success: response.ok,
                    status: response.status,
                    size: response.headers.get('content-length') || 'unknown'
                });
                
                console.log(`${response.ok ? '✅' : '❌'} ${file}: ${response.status}`);
                
            } catch (error) {
                results.push({
                    file,
                    success: false,
                    error: error.message
                });
                console.log(`❌ ${file}: ${error.message}`);
            }
        }
        
        return {
            success: results.every(r => r.success),
            results,
            summary: `${results.filter(r => r.success).length}/${results.length} files accessible`
        };
    }

    /**
     * Test server response and performance
     */
    async testServerResponse() {
        const startTime = Date.now();
        
        try {
            const response = await fetch(`index.html?t=${Date.now()}`);
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            return {
                success: response.ok,
                status: response.status,
                responseTime,
                headers: {
                    server: response.headers.get('server'),
                    contentType: response.headers.get('content-type'),
                    cacheControl: response.headers.get('cache-control')
                }
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                responseTime: Date.now() - startTime
            };
        }
    }
}

// Auto-run diagnostic when script loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Application Diagnostic Tool Loaded');
    
    // Create diagnostic instance
    const diagnostic = new ApplicationDiagnostic();
    
    // Add diagnostic controls to page
    const controlsDiv = document.createElement('div');
    controlsDiv.id = 'app-diagnostic-controls';
    controlsDiv.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 10000;
        font-family: monospace;
        font-size: 12px;
        max-width: 300px;
    `;
    
    controlsDiv.innerHTML = `
        <h4 style="margin: 0 0 10px 0; color: #495057;">🔍 App Diagnostic</h4>
        <button id="run-app-diagnostic" style="margin: 2px; padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Run Diagnostic</button>
        <button id="export-app-results" style="margin: 2px; padding: 5px 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Export Results</button>
        <div id="app-diagnostic-status" style="margin-top: 10px; padding: 5px; background: #e9ecef; border-radius: 4px; font-size: 11px;"></div>
    `;
    
    document.body.appendChild(controlsDiv);
    
    // Add event listeners
    document.getElementById('run-app-diagnostic').addEventListener('click', async () => {
        const statusDiv = document.getElementById('app-diagnostic-status');
        statusDiv.textContent = 'Running diagnostic...';
        statusDiv.style.background = '#fff3cd';
        
        try {
            await diagnostic.runDiagnostic();
            statusDiv.textContent = 'Diagnostic completed! Check console for results.';
            statusDiv.style.background = '#d4edda';
        } catch (error) {
            statusDiv.textContent = `Error: ${error.message}`;
            statusDiv.style.background = '#f8d7da';
        }
    });
    
    document.getElementById('export-app-results').addEventListener('click', () => {
        diagnostic.exportResults();
    });
    
    // Auto-run diagnostic after a short delay
    setTimeout(async () => {
        console.log('🔄 Auto-running application diagnostic...');
        await diagnostic.runDiagnostic();
    }, 1000);
});

// Export for manual use
window.ApplicationDiagnostic = ApplicationDiagnostic;
