// api/scrape-lacc.js
// Los Angeles Communication Center (LACC) specific scraping endpoint

import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || 'us2',
  useTLS: true
});

const CENTER_CONFIG = {
  code: 'LACC',
  name: 'Los Angeles',
  fullName: 'Los Angeles Communication Center',
  channel: 'chp-incidents-lacc'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const scrapeResult = await scrapeLosAngelesCenter();
    
    // Publish to LACC-specific channel
    await pusher.trigger(CENTER_CONFIG.channel, 'new-incident', {
      center: CENTER_CONFIG.code,
      centerName: CENTER_CONFIG.name,
      centerFullName: CENTER_CONFIG.fullName,
      incidents: scrapeResult.incidents,
      incidentCount: scrapeResult.incidents.length,
      timestamp: new Date().toISOString(),
      eventType: 'scrape-complete'
    });

    return res.status(200).json({
      success: true,
      center: CENTER_CONFIG.code,
      message: `Scraping completed for ${CENTER_CONFIG.name}`,
      data: scrapeResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ LACC scraping error:`, error);
    
    await pusher.trigger(CENTER_CONFIG.channel, 'error', {
      center: CENTER_CONFIG.code,
      centerName: CENTER_CONFIG.name,
      error: error.message,
      timestamp: new Date().toISOString(),
      eventType: 'scrape-error'
    });

    return res.status(500).json({
      success: false,
      center: CENTER_CONFIG.code,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function scrapeLosAngelesCenter() {
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  const incidents = [
    {
      id: `LACC${Date.now()}1`,
      type: 'Traffic Collision',
      location: 'I-405 North / LAX',
      time: new Date().toLocaleTimeString(),
      isNew: true,
      severity: 'high',
      laneBlockage: 'partial',
      estimatedDuration: '45-60 minutes'
    },
    {
      id: `LACC${Date.now()}2`,
      type: 'Road Construction',
      location: 'I-10 East / Downtown',
      time: new Date().toLocaleTimeString(),
      isNew: false,
      severity: 'medium',
      laneBlockage: 'partial',
      estimatedDuration: '2-4 hours'
    },
    {
      id: `LACC${Date.now()}3`,
      type: 'Vehicle Breakdown',
      location: 'I-110 South',
      time: new Date().toLocaleTimeString(),
      isNew: true,
      severity: 'low',
      laneBlockage: 'none',
      estimatedDuration: '15-30 minutes'
    }
  ];

  return {
    center: CENTER_CONFIG.code,
    centerName: CENTER_CONFIG.name,
    incidents: incidents,
    incidentCount: incidents.length,
    lastUpdated: new Date().toISOString(),
    scrapedAt: new Date().toISOString(),
    status: 'success'
  };
}
