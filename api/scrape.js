/**
 * Vercel API Endpoint for CHP Traffic Scraping
 * Triggers real-time data scraping and publishes updates via Pusher
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
    const { center = 'BCCC' } = req.query;
    
    // Validate communication center
    const validCenters = ['BCCC', 'LACC', 'SACC', 'OCCC'];
    if (!validCenters.includes(center)) {
      return res.status(400).json({ 
        error: 'Invalid communication center',
        validCenters 
      });
    }

    // Trigger scraping process
    const scrapeResult = await triggerScraping(center);
    
    // Publish update to Pusher
    await pusher.trigger('chp-incidents', 'incident-update', {
      center,
      data: scrapeResult,
      timestamp: new Date().toISOString(),
      type: 'scrape-complete'
    });

    return res.status(200).json({
      success: true,
      center,
      message: 'Scraping completed and update published',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Scraping error:', error);
    
    // Publish error to Pusher
    await pusher.trigger('chp-incidents', 'error', {
      error: error.message,
      timestamp: new Date().toISOString(),
      type: 'scrape-error'
    });

    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Trigger the Python scraping process
 * This will be enhanced to call the actual scraper
 */
async function triggerScraping(center) {
  // For now, return mock data
  // TODO: Integrate with actual Python scraper
  return {
    center,
    incidentCount: Math.floor(Math.random() * 20) + 5,
    lastUpdated: new Date().toISOString(),
    status: 'success'
  };
}
