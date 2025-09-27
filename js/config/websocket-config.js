// js/config/websocket-config.js
// WebSocket Configuration for Multi-Center Communication

window.WEBSOCKET_CONFIG = {
    // Pusher Configuration
    pusher: {
        key: process.env.PUSHER_KEY || 'your-pusher-key',
        cluster: process.env.PUSHER_CLUSTER || 'us2',
        useTLS: true
    },
    
    // All 25 CHP Communication Centers
    centers: {
        BFCC: { code: 'BFCC', name: 'Bakersfield', fullName: 'Bakersfield Communication Center', channel: 'chp-incidents-bfcc', color: '#FF6B6B' },
        BSCC: { code: 'BSCC', name: 'Barstow', fullName: 'Barstow Communication Center', channel: 'chp-incidents-bscc', color: '#E74C3C' },
        BICC: { code: 'BICC', name: 'Bishop', fullName: 'Bishop Communication Center', channel: 'chp-incidents-bicc', color: '#C0392B' },
        BCCC: { code: 'BCCC', name: 'Border', fullName: 'Border Communication Center', channel: 'chp-incidents-bccc', color: '#A93226' },
        CCCC: { code: 'CCCC', name: 'Capitol', fullName: 'Capitol Communication Center', channel: 'chp-incidents-cccc', color: '#8E44AD' },
        CHCC: { code: 'CHCC', name: 'Chico', fullName: 'Chico Communication Center', channel: 'chp-incidents-chcc', color: '#9B59B6' },
        ECCC: { code: 'ECCC', name: 'El Centro', fullName: 'El Centro Communication Center', channel: 'chp-incidents-eccc', color: '#3498DB' },
        FRCC: { code: 'FRCC', name: 'Fresno', fullName: 'Fresno Communication Center', channel: 'chp-incidents-frcc', color: '#2980B9' },
        GGCC: { code: 'GGCC', name: 'Golden Gate', fullName: 'Golden Gate Communication Center', channel: 'chp-incidents-ggcc', color: '#1ABC9C' },
        HMCC: { code: 'HMCC', name: 'Humboldt', fullName: 'Humboldt Communication Center', channel: 'chp-incidents-hmcc', color: '#16A085' },
        ICCC: { code: 'ICCC', name: 'Indio', fullName: 'Indio Communication Center', channel: 'chp-incidents-iccc', color: '#2ECC71' },
        INCC: { code: 'INCC', name: 'Inland', fullName: 'Inland Communication Center', channel: 'chp-incidents-incc', color: '#27AE60' },
        LACC: { code: 'LACC', name: 'Los Angeles', fullName: 'Los Angeles Communication Center', channel: 'chp-incidents-lacc', color: '#4ECDC4' },
        MRCC: { code: 'MRCC', name: 'Merced', fullName: 'Merced Communication Center', channel: 'chp-incidents-mrcc', color: '#45B7D1' },
        MYCC: { code: 'MYCC', name: 'Monterey', fullName: 'Monterey Communication Center', channel: 'chp-incidents-mycc', color: '#96CEB4' },
        OCCC: { code: 'OCCC', name: 'Orange County', fullName: 'Orange County Communication Center', channel: 'chp-incidents-occc', color: '#F39C12' },
        RDCC: { code: 'RDCC', name: 'Redding', fullName: 'Redding Communication Center', channel: 'chp-incidents-rdcc', color: '#E67E22' },
        SACC: { code: 'SACC', name: 'Sacramento', fullName: 'Sacramento Communication Center', channel: 'chp-incidents-sacc', color: '#D35400' },
        SLCC: { code: 'SLCC', name: 'San Luis Obispo', fullName: 'San Luis Obispo Communication Center', channel: 'chp-incidents-slcc', color: '#E74C3C' },
        SKCCSTCC: { code: 'SKCCSTCC', name: 'Stockton', fullName: 'Stockton Communication Center', channel: 'chp-incidents-skccstcc', color: '#C0392B' },
        SUCC: { code: 'SUCC', name: 'Susanville', fullName: 'Susanville Communication Center', channel: 'chp-incidents-succ', color: '#A93226' },
        TKCC: { code: 'TKCC', name: 'Truckee', fullName: 'Truckee Communication Center', channel: 'chp-incidents-tkcc', color: '#8E44AD' },
        UKCC: { code: 'UKCC', name: 'Ukiah', fullName: 'Ukiah Communication Center', channel: 'chp-incidents-ukcc', color: '#9B59B6' },
        VTCC: { code: 'VTCC', name: 'Ventura', fullName: 'Ventura Communication Center', channel: 'chp-incidents-vtcc', color: '#3498DB' },
        YKCC: { code: 'YKCC', name: 'Yreka', fullName: 'Yreka Communication Center', channel: 'chp-incidents-ykcc', color: '#2980B9' }
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
