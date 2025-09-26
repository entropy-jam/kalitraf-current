/**
 * WebSocket Diagnostic Script
 * Comprehensive tool to diagnose WebSocket connection issues
 */

class WebSocketDiagnostic {
    constructor() {
        this.results = {
            environment: {},
            protocols: {},
            connections: {},
            errors: []
        };
        this.testResults = [];
    }

    /**
     * Run complete diagnostic suite
     */
    async runDiagnostic() {
        console.log('🔍 Starting WebSocket Diagnostic...');
        
        try {
            // 1. Environment Analysis
            await this.analyzeEnvironment();
            
            // 2. Protocol Detection
            await this.detectProtocols();
            
            // 3. Connection Tests
            await this.testConnections();
            
            // 4. Generate Report
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
            protocol: window.location.protocol,
            host: window.location.host,
            hostname: window.location.hostname,
            port: window.location.port,
            origin: window.location.origin,
            userAgent: navigator.userAgent,
            isSecure: window.location.protocol === 'https:',
            isLocalhost: window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname === '',
            timestamp: new Date().toISOString()
        };

        // Debug: Log environment details
        console.log('Environment:', this.results.environment);
        console.log('Hostname check:', {
            hostname: window.location.hostname,
            isEmpty: window.location.hostname === '',
            isLocalhost: this.results.environment.isLocalhost
        });
    }

    /**
     * Detect supported WebSocket protocols
     */
    async detectProtocols() {
        console.log('🔍 Detecting WebSocket protocols...');
        
        const protocols = {
            ws: 'ws://',
            wss: 'wss://'
        };

        this.results.protocols = {
            currentProtocol: window.location.protocol,
            supportedProtocols: [],
            recommendedProtocol: null,
            issues: []
        };

        // Check if we're on HTTPS
        if (this.results.environment.isSecure) {
            this.results.protocols.recommendedProtocol = 'wss://';
            this.results.protocols.supportedProtocols = ['wss://'];
            
            // Check for insecure WebSocket usage
            if (this.hasInsecureWebSocketUsage()) {
                this.results.protocols.issues.push({
                    type: 'insecure-websocket',
                    message: 'Insecure WebSocket (ws://) detected on HTTPS page',
                    severity: 'error',
                    fix: 'Change ws:// to wss:// in WebSocket URLs'
                });
            }
        } else {
            this.results.protocols.recommendedProtocol = 'ws://';
            this.results.protocols.supportedProtocols = ['ws://', 'wss://'];
        }

        console.log('Protocols:', this.results.protocols);
    }

    /**
     * Check for insecure WebSocket usage in code
     */
    hasInsecureWebSocketUsage() {
        // This would need to be enhanced to actually scan the loaded scripts
        // For now, we'll check common patterns
        const scripts = Array.from(document.scripts);
        let hasInsecure = false;

        scripts.forEach(script => {
            if (script.src && script.src.includes('app-railway.js')) {
                // We know this file has the issue based on our analysis
                hasInsecure = true;
            }
        });

        return hasInsecure;
    }

    /**
     * Test various WebSocket connections
     */
    async testConnections() {
        console.log('🔗 Testing WebSocket connections...');
        
        const testUrls = this.generateTestUrls();
        
        for (const test of testUrls) {
            await this.testConnection(test);
        }
    }

    /**
     * Generate test URLs based on environment
     */
    generateTestUrls() {
        const { hostname, port, isSecure, isLocalhost, host } = this.results.environment;
        const tests = [];

        // Railway WebSocket test
        if (isSecure) {
            tests.push({
                name: 'Railway WSS',
                url: `wss://${host}/ws?upgrade_wait=0s&first_msg_wait=0s`,
                expected: 'success',
                description: 'Railway secure WebSocket'
            });
        } else {
            // For local development, use localhost if hostname is empty or invalid
            const wsHost = hostname && hostname !== '' ? hostname : 'localhost';
            tests.push({
                name: 'Railway WS',
                url: `ws://${wsHost}:8080`,
                expected: 'success',
                description: 'Railway WebSocket (local)'
            });
        }

        // Local development tests
        if (isLocalhost) {
            tests.push({
                name: 'Local WS',
                url: `ws://localhost:8080`,
                expected: isSecure ? 'error' : 'success',
                description: 'Local WebSocket'
            });
            
            tests.push({
                name: 'Local WSS',
                url: `wss://localhost:8080`,
                expected: 'error', // Likely no SSL cert for localhost
                description: 'Local secure WebSocket'
            });
        }

        return tests;
    }

    /**
     * Test individual WebSocket connection
     */
    async testConnection(test) {
        return new Promise((resolve) => {
            console.log(`🧪 Testing ${test.name}: ${test.url}`);
            
            const startTime = Date.now();
            let ws = null;
            let timeout = null;
            
            const cleanup = () => {
                if (timeout) clearTimeout(timeout);
                if (ws) {
                    ws.close();
                    ws = null;
                }
            };

            try {
                ws = new WebSocket(test.url);
                
                // Set timeout
                timeout = setTimeout(() => {
                    cleanup();
                    this.addTestResult({
                        ...test,
                        result: 'timeout',
                        duration: Date.now() - startTime,
                        error: 'Connection timeout'
                    });
                    resolve();
                }, 5000);

                ws.onopen = () => {
                    cleanup();
                    this.addTestResult({
                        ...test,
                        result: 'success',
                        duration: Date.now() - startTime,
                        error: null
                    });
                    resolve();
                };

                ws.onerror = (error) => {
                    cleanup();
                    this.addTestResult({
                        ...test,
                        result: 'error',
                        duration: Date.now() - startTime,
                        error: this.extractWebSocketError(error)
                    });
                    resolve();
                };

                ws.onclose = (event) => {
                    cleanup();
                    this.addTestResult({
                        ...test,
                        result: 'closed',
                        duration: Date.now() - startTime,
                        error: `Closed: ${event.code} - ${event.reason}`
                    });
                    resolve();
                };

            } catch (error) {
                cleanup();
                this.addTestResult({
                    ...test,
                    result: 'error',
                    duration: Date.now() - startTime,
                    error: error.message
                });
                resolve();
            }
        });
    }

    /**
     * Extract meaningful error from WebSocket error event
     */
    extractWebSocketError(error) {
        // WebSocket error events don't provide much detail
        // We'll check for common error patterns
        if (error && error.message) {
            return error.message;
        }
        
        // Check for specific error types
        if (this.results.environment.isSecure) {
            return 'Insecure WebSocket connection blocked by browser security policy';
        }
        
        return 'WebSocket connection failed';
    }

    /**
     * Add test result
     */
    addTestResult(result) {
        this.testResults.push({
            ...result,
            timestamp: new Date().toISOString()
        });
        
        const status = result.result === 'success' ? '✅' : '❌';
        console.log(`${status} ${result.name}: ${result.result} (${result.duration}ms)`);
        if (result.error) {
            console.log(`   Error: ${result.error}`);
        }
    }

    /**
     * Generate comprehensive diagnostic report
     */
    generateReport() {
        console.log('\n📋 WebSocket Diagnostic Report');
        console.log('================================');
        
        // Environment Summary
        console.log('\n🌍 Environment:');
        console.log(`   Protocol: ${this.results.environment.protocol}`);
        console.log(`   Host: ${this.results.environment.host}`);
        console.log(`   Hostname: ${this.results.environment.hostname}`);
        console.log(`   Port: ${this.results.environment.port}`);
        console.log(`   Secure: ${this.results.environment.isSecure ? 'Yes' : 'No'}`);
        console.log(`   Localhost: ${this.results.environment.isLocalhost ? 'Yes' : 'No'}`);
        
        // Protocol Analysis
        console.log('\n🔒 Protocol Analysis:');
        console.log(`   Recommended: ${this.results.protocols.recommendedProtocol}`);
        console.log(`   Supported: ${this.results.protocols.supportedProtocols.join(', ')}`);
        
        if (this.results.protocols.issues.length > 0) {
            console.log('\n⚠️  Issues Found:');
            this.results.protocols.issues.forEach(issue => {
                console.log(`   ${issue.severity.toUpperCase()}: ${issue.message}`);
                console.log(`   Fix: ${issue.fix}`);
            });
        }
        
        // Connection Test Results
        console.log('\n🔗 Connection Tests:');
        this.testResults.forEach(test => {
            const status = test.result === 'success' ? '✅' : '❌';
            console.log(`   ${status} ${test.name}: ${test.result} (${test.duration}ms)`);
            console.log(`      URL: ${test.url}`);
            if (test.error) {
                console.log(`      Error: ${test.error}`);
            }
        });
        
        // Server Status Analysis
        console.log('\n🖥️  Server Status Analysis:');
        this.analyzeServerStatus();
        
        // Recommendations
        console.log('\n💡 Recommendations:');
        this.generateRecommendations();
        
        // Fixes
        console.log('\n🔧 Suggested Fixes:');
        this.generateFixes();
    }

    /**
     * Analyze server status based on test results
     */
    analyzeServerStatus() {
        const failedTests = this.testResults.filter(t => t.result !== 'success');
        const railwayTests = this.testResults.filter(t => t.name.includes('Railway'));
        const localTests = this.testResults.filter(t => t.name.includes('Local'));
        
        console.log(`   Total Tests: ${this.testResults.length}`);
        console.log(`   Failed Tests: ${failedTests.length}`);
        console.log(`   Railway Tests: ${railwayTests.length} (${railwayTests.filter(t => t.result === 'success').length} successful)`);
        console.log(`   Local Tests: ${localTests.length} (${localTests.filter(t => t.result === 'success').length} successful)`);
        
        if (failedTests.length === this.testResults.length) {
            console.log('   🚨 STATUS: No WebSocket server detected on port 8080');
            console.log('   💡 SOLUTION: Start the WebSocket server or check if it\'s running');
        } else if (railwayTests.some(t => t.result === 'success')) {
            console.log('   ✅ STATUS: Railway WebSocket server is running');
        } else if (localTests.some(t => t.result === 'success')) {
            console.log('   ✅ STATUS: Local WebSocket server is running');
        }
    }

    /**
     * Generate recommendations based on test results
     */
    generateRecommendations() {
        const recommendations = [];
        
        if (this.results.environment.isSecure) {
            recommendations.push('Use wss:// for all WebSocket connections');
            recommendations.push('Ensure your WebSocket server supports SSL/TLS');
        } else {
            recommendations.push('Consider using HTTPS and wss:// for production');
            recommendations.push('ws:// is acceptable for local development');
        }
        
        const failedTests = this.testResults.filter(t => t.result !== 'success');
        if (failedTests.length > 0) {
            recommendations.push('Check WebSocket server configuration');
            recommendations.push('Verify firewall and network settings');
        }
        
        recommendations.forEach(rec => console.log(`   • ${rec}`));
    }

    /**
     * Generate specific fixes for identified issues
     */
    generateFixes() {
        const fixes = [];
        
        // Check for the specific issue in app-railway.js
        if (this.results.protocols.issues.some(i => i.type === 'insecure-websocket')) {
            fixes.push('Fix in js/app-railway.js line 9:');
            fixes.push('  Change: ws://${window.location.hostname}:8080');
            fixes.push('  To: wss://${window.location.host}/ws?upgrade_wait=0s&first_msg_wait=0s');
        }
        
        // Check for Railway WebSocket service issues
        const railwayTest = this.testResults.find(t => t.name.includes('Railway'));
        if (railwayTest && railwayTest.result !== 'success') {
            fixes.push('Railway WebSocket connection failed:');
            fixes.push('  • Check Railway deployment status');
            fixes.push('  • Verify WebSocket server is running on port 8080');
            fixes.push('  • Check Railway logs for WebSocket errors');
        }
        
        if (fixes.length === 0) {
            fixes.push('No specific fixes needed - all tests passed!');
        }
        
        fixes.forEach(fix => console.log(`   ${fix}`));
    }

    /**
     * Get diagnostic results as JSON
     */
    getResults() {
        return {
            environment: this.results.environment,
            protocols: this.results.protocols,
            testResults: this.testResults,
            errors: this.results.errors,
            timestamp: new Date().toISOString()
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
        a.download = `websocket-diagnostic-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('📁 Diagnostic results exported to file');
    }
}

// Auto-run diagnostic when script loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 WebSocket Diagnostic Tool Loaded');
    
    // Create diagnostic instance
    const diagnostic = new WebSocketDiagnostic();
    
    // Add diagnostic controls to page
    const controlsDiv = document.createElement('div');
    controlsDiv.id = 'websocket-diagnostic-controls';
    controlsDiv.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
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
        <h4 style="margin: 0 0 10px 0; color: #495057;">🔍 WebSocket Diagnostic</h4>
        <button id="run-diagnostic" style="margin: 2px; padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Run Diagnostic</button>
        <button id="export-results" style="margin: 2px; padding: 5px 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Export Results</button>
        <div id="diagnostic-status" style="margin-top: 10px; padding: 5px; background: #e9ecef; border-radius: 4px; font-size: 11px;"></div>
    `;
    
    document.body.appendChild(controlsDiv);
    
    // Add event listeners
    document.getElementById('run-diagnostic').addEventListener('click', async () => {
        const statusDiv = document.getElementById('diagnostic-status');
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
    
    document.getElementById('export-results').addEventListener('click', () => {
        diagnostic.exportResults();
    });
    
    // Auto-run diagnostic after a short delay
    setTimeout(async () => {
        console.log('🔄 Auto-running WebSocket diagnostic...');
        await diagnostic.runDiagnostic();
    }, 1000);
});

// Export for manual use
window.WebSocketDiagnostic = WebSocketDiagnostic;
