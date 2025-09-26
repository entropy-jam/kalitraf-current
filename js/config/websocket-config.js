// js/config/websocket-config.js
// WebSocket Configuration for Multi-Center Communication

window.WEBSOCKET_CONFIG = {
    // Pusher Configuration
    pusher: {
        key: process.env.PUSHER_KEY || 'your-pusher-key',
        cluster: process.env.PUSHER_CLUSTER || 'us2',
        useTLS: true
    },
    
    // Communication Centers
    centers: {
        BCCC: {
            code: 'BCCC',
            name: 'Border',
            fullName: 'Border Communication Center',
            channel: 'chp-incidents-bccc',
            color: '#FF6B6B'
        },
        LACC: {
            code: 'LACC', 
            name: 'Los Angeles',
            fullName: 'Los Angeles Communication Center',
            channel: 'chp-incidents-lacc',
            color: '#4ECDC4'
        },
        OCCC: {
            code: 'OCCC',
            name: 'Orange County', 
            fullName: 'Orange County Communication Center',
            channel: 'chp-incidents-occc',
            color: '#45B7D1'
        },
        SACC: {
            code: 'SACC',
            name: 'Sacramento',
            fullName: 'Sacramento Communication Center', 
            channel: 'chp-incidents-sacc',
            color: '#96CEB4'
        }
    },
    
    // WebSocket Events
    events: {
        NEW_INCIDENT: 'new-incident',
        UPDATED_INCIDENT: 'updated-incident',
        RESOLVED_INCIDENT: 'resolved-incident',
        CENTER_STATUS: 'center-status',
        CONNECTION_STATUS: 'connection-status'
    },
    
    // Reconnection Settings
    reconnection: {
        maxAttempts: 10,
        interval: 5000, // 5 seconds
        backoffMultiplier: 1.5
    }
};

// Helper function to get center info by code
window.getCenterInfo = function(centerCode) {
    return WEBSOCKET_CONFIG.centers[centerCode] || null;
}

// Helper function to get all center codes
window.getAllCenterCodes = function() {
    return Object.keys(WEBSOCKET_CONFIG.centers);
}

// Helper function to get all channels
window.getAllChannels = function() {
    return Object.values(WEBSOCKET_CONFIG.centers).map(center => center.channel);
}
