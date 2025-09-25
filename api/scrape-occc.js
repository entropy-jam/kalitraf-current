// api/scrape-occc.js
// Orange County Communication Center (OCCC) specific scraping endpoint

import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || 'us2',
  useTLS: true
});

const CENTER_CONFIG = {
  code: 'OCCC',
  name: 'Orange County',
  fullName: 'Orange County Communication Center',
  channel: 'chp-incidents-occc'
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
    const scrapeResult = await scrapeOrangeCountyCenter();
    
    // Publish to OCCC-specific channel
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
    console.error(`❌ OCCC scraping error:`, error);
    
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

async function scrapeOrangeCountyCenter() {
  await new Promise(resolve => setTimeout(resolve, 900));
  
  const incidents = [
    {
      id: `OCCC${Date.now()}1`,
      type: 'Traffic Collision',
      location: 'SR-55 North / Irvine',
      time: new Date().toLocaleTimeString(),
      isNew: true,
      severity: 'medium',
      laneBlockage: 'partial',
      estimatedDuration: '30-45 minutes'
    },
    {
      id: `OCCC${Date.now()}2`,
      type: 'Weather Hazard',
      location: 'I-5 South / Anaheim',
      time: new Date().toLocaleTimeString(),
      isNew: false,
      severity: 'low',
      laneBlockage: 'none',
      estimatedDuration: '1-2 hours'
    },
    {
      id: `OCCC${Date.now()}3`,
      type: 'Debris on Roadway',
      location: 'SR-91 East',
      time: new Date().toLocaleTimeString(),
      isNew: true,
      severity: 'medium',
      laneBlockage: 'partial',
      estimatedDuration: '20-30 minutes'
    },
    {
      id: `OCCC${Date.now()}4`,
      type: 'Vehicle Breakdown',
      location: 'I-405 South / Costa Mesa',
      time: new Date().toLocaleTimeString(),
      isNew: false,
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
