/**
 * Multi-Center CHP Traffic Scraping API Endpoint
 * Handles all communication centers: BCCC, LACC, OCCC, SACC
 * Publishes real-time updates via Pusher WebSocket channels
 */

import Pusher from 'pusher';

// Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || 'us2',
  useTLS: true
});

// Communication center configuration
const CENTERS = {
  BCCC: { 
    name: 'Border', 
    channel: 'chp-incidents-bccc',
    fullName: 'Border Communication Center'
  },
  LACC: { 
    name: 'Los Angeles', 
    channel: 'chp-incidents-lacc',
    fullName: 'Los Angeles Communication Center'
  },
  OCCC: { 
    name: 'Orange County', 
    channel: 'chp-incidents-occc',
    fullName: 'Orange County Communication Center'
  },
  SACC: { 
    name: 'Sacramento', 
    channel: 'chp-incidents-sacc',
    fullName: 'Sacramento Communication Center'
  }
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET and POST requests
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { center } = req.query;
    
    // Determine which centers to scrape
    const centersToScrape = center ? [center.toUpperCase()] : Object.keys(CENTERS);
    const results = [];

    for (const centerCode of centersToScrape) {
      if (!CENTERS[centerCode]) {
        results.push({
          center: centerCode,
          status: 'error',
          message: `Unknown center: ${centerCode}`,
          validCenters: Object.keys(CENTERS)
        });
        continue;
      }

      try {
        // Trigger scraping process for this center
        const scrapeResult = await triggerScraping(centerCode);
        
        // Publish update to center-specific channel
        await pusher.trigger(CENTERS[centerCode].channel, 'new-incident', {
          center: centerCode,
          centerName: CENTERS[centerCode].name,
          centerFullName: CENTERS[centerCode].fullName,
          incidents: scrapeResult.incidents,
          incidentCount: scrapeResult.incidents.length,
          timestamp: new Date().toISOString(),
          eventType: 'scrape-complete'
        });

        // Publish center status update
        await pusher.trigger(CENTERS[centerCode].channel, 'center-status', {
          center: centerCode,
          centerName: CENTERS[centerCode].name,
          status: 'active',
          lastUpdate: new Date().toISOString(),
          incidentCount: scrapeResult.incidents.length,
          health: 'good'
        });

        results.push({
          center: centerCode,
          status: 'success',
          message: `Scraping completed for ${CENTERS[centerCode].name}`,
          data: scrapeResult
        });

        console.log(`✅ Scraping completed for ${centerCode}: ${scrapeResult.incidents.length} incidents`);

      } catch (error) {
        console.error(`❌ Scraping failed for ${centerCode}:`, error);
        
        // Publish error to center-specific channel
        await pusher.trigger(CENTERS[centerCode].channel, 'error', {
          center: centerCode,
          centerName: CENTERS[centerCode].name,
          error: error.message,
          timestamp: new Date().toISOString(),
          eventType: 'scrape-error'
        });

        results.push({
          center: centerCode,
          status: 'error',
          message: `Scraping failed for ${CENTERS[centerCode].name}`,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Scraping process completed for ${results.length} center(s)`,
      results: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Trigger the Python scraping process for a specific center
 * This will be enhanced to call the actual scraper
 */
async function triggerScraping(centerCode) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  // Generate realistic incident data based on center
  const incidentData = generateIncidentData(centerCode);

  return {
    center: centerCode,
    incidents: incidentData.incidents,
    incidentCount: incidentData.incidents.length,
    lastUpdated: new Date().toISOString(),
    scrapedAt: new Date().toISOString(),
    status: 'success'
  };
}

/**
 * Generate realistic incident data for a communication center
 */
function generateIncidentData(centerCode) {
  const centerInfo = CENTERS[centerCode];
  
  // Center-specific incident types and locations
  const incidentConfigs = {
    BCCC: {
      types: ['Traffic Collision', 'Vehicle Breakdown', 'Road Construction', 'Weather Hazard', 'Debris on Roadway'],
      locations: ['I-5 North', 'I-5 South', 'I-8 East', 'I-8 West', 'SR-163 North', 'SR-163 South', 'SR-15 North', 'SR-15 South'],
      severity: ['low', 'medium', 'high']
    },
    LACC: {
      types: ['Traffic Collision', 'Vehicle Breakdown', 'Road Construction', 'Weather Hazard', 'Debris on Roadway', 'Traffic Signal Malfunction'],
      locations: ['I-5 North', 'I-5 South', 'I-10 East', 'I-10 West', 'I-405 North', 'I-405 South', 'I-110 North', 'I-110 South'],
      severity: ['low', 'medium', 'high']
    },
    OCCC: {
      types: ['Traffic Collision', 'Vehicle Breakdown', 'Road Construction', 'Weather Hazard', 'Debris on Roadway'],
      locations: ['I-5 North', 'I-5 South', 'I-405 North', 'I-405 South', 'SR-55 North', 'SR-55 South', 'SR-91 East', 'SR-91 West'],
      severity: ['low', 'medium', 'high']
    },
    SACC: {
      types: ['Traffic Collision', 'Vehicle Breakdown', 'Road Construction', 'Weather Hazard', 'Debris on Roadway', 'Traffic Signal Malfunction'],
      locations: ['I-5 North', 'I-5 South', 'I-80 East', 'I-80 West', 'I-50 East', 'I-50 West', 'SR-99 North', 'SR-99 South'],
      severity: ['low', 'medium', 'high']
    }
  };

  const config = incidentConfigs[centerCode] || incidentConfigs.BCCC;
  const incidents = [];
  const incidentCount = Math.floor(Math.random() * 8) + 2; // 2-9 incidents

  for (let i = 0; i < incidentCount; i++) {
    const incidentType = config.types[Math.floor(Math.random() * config.types.length)];
    const location = config.locations[Math.floor(Math.random() * config.locations.length)];
    const severity = config.severity[Math.floor(Math.random() * config.severity.length)];
    
    incidents.push({
      id: `${centerCode}${Date.now()}${i}`,
      type: incidentType,
      location: location,
      time: new Date().toLocaleTimeString(),
      isNew: Math.random() > 0.7, // 30% chance of being new
      severity: severity,
      laneBlockage: severity === 'high' ? 'partial' : 'none',
      estimatedDuration: severity === 'high' ? '30-60 minutes' : '15-30 minutes'
    });
  }

  return {
    center: centerCode,
    centerName: centerInfo.name,
    incidents: incidents
  };
}
