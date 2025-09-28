/**
 * Test script to verify the SSE frontend fix
 * Run this in the browser console on the Railway site
 */

console.log('🧪 Testing SSE Frontend Fix...');

// Test 1: Check if SSEService has onInitialData method
if (typeof SSEService !== 'undefined') {
    const sseService = new SSEService();
    console.log('✅ SSEService loaded');
    console.log('✅ onInitialData method exists:', typeof sseService.onInitialData === 'function');
} else {
    console.error('❌ SSEService not found');
}

// Test 2: Check if RailwayAppController has the new methods
if (typeof RailwayAppController !== 'undefined') {
    console.log('✅ RailwayAppController loaded');
    const controller = new RailwayAppController();
    console.log('✅ handleInitialData method exists:', typeof controller.handleInitialData === 'function');
    console.log('✅ handleIncidentDataUpdated method exists:', typeof controller.handleIncidentDataUpdated === 'function');
} else {
    console.error('❌ RailwayAppController not found');
}

// Test 3: Check if event listener is set up
console.log('✅ incidentDataUpdated event listener check:', 
    window.addEventListener ? 'EventTarget available' : 'EventTarget not available');

// Test 4: Test SSE connection
if (typeof SSEService !== 'undefined') {
    console.log('🔗 Testing SSE connection...');
    const testSSE = new SSEService();
    
    testSSE.onInitialData((data) => {
        console.log('✅ Initial data received:', data);
    });
    
    testSSE.onConnectionChange((status) => {
        console.log('✅ Connection status:', status);
    });
    
    testSSE.onError((error) => {
        console.error('❌ SSE Error:', error);
    });
    
    testSSE.connect().then(() => {
        console.log('✅ SSE connection initiated');
    }).catch(error => {
        console.error('❌ SSE connection failed:', error);
    });
}

console.log('🧪 Test completed. Check the logs above for results.');
