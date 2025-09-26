// api/cron-scrape.js
// Vercel Cron Job - Replaces GitHub Actions with WebSocket integration
// Runs every 30 seconds to provide real-time updates

import Pusher from 'pusher';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Pusher configuration
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || 'us2',
  useTLS: true,
});

// Communication center configuration (matching GitHub Actions matrix)
const CENTERS = ['BCCC', 'LACC', 'SACC', 'OCCC'];
const CENTER_INFO = {
  BCCC: { name: 'Border', channel: 'chp-incidents-bccc' },
  LACC: { name: 'Los Angeles', channel: 'chp-incidents-lacc' },
  SACC: { name: 'Sacramento', channel: 'chp-incidents-sacc' },
  OCCC: { name: 'Orange County', channel: 'chp-incidents-occc' }
};

export default async function handler(req, res) {
  // Verify this is a cron request
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🚀 Starting Vercel cron scrape job...');
  
  try {
    const results = [];
    
    // Process each center sequentially (like GitHub Actions max-parallel: 1)
    for (const center of CENTERS) {
      console.log(`📡 Processing ${center} (${CENTER_INFO[center].name})...`);
      
      try {
        const result = await scrapeCenter(center);
        results.push(result);
        
        // Small delay between centers to avoid overwhelming CHP servers
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Error processing ${center}:`, error);
        results.push({
          center,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Update timestamp file (like GitHub Actions)
    await updateTimestamp();
    
    console.log('✅ Cron job completed successfully');
    
    return res.status(200).json({
      success: true,
      message: 'Cron job completed',
      results: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Cron job failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Scrape a single communication center using Python scraper
 */
async function scrapeCenter(centerCode) {
  return new Promise((resolve, reject) => {
    console.log(`🐍 Starting Python scraper for ${centerCode}...`);
    
    // Set up environment variables (matching GitHub Actions)
    const env = {
      ...process.env,
      COMMUNICATION_CENTER: centerCode,
      RUN_ONCE: 'true',
      SCRAPER_MODE: 'vercel_cron',
      ENABLE_EMAIL_NOTIFICATIONS: 'false',
      PYTHONUNBUFFERED: '1'
    };
    
    // Run the Python scraper (using the existing github_scraper.py)
    const pythonProcess = spawn('python', ['src/scrapers/github_scraper.py'], {
      env,
      cwd: process.cwd()
    });
    
    let output = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      const message = data.toString();
      output += message;
      console.log(`[${centerCode}] ${message.trim()}`);
    });
    
    pythonProcess.stderr.on('data', (data) => {
      const message = data.toString();
      errorOutput += message;
      console.error(`[${centerCode}] ERROR: ${message.trim()}`);
    });
    
    pythonProcess.on('close', async (code) => {
      if (code === 0) {
        console.log(`✅ Python scraper completed for ${centerCode}`);
        
        try {
          // Check if data files were updated
          const dataUpdated = await checkDataUpdates(centerCode);
          
          if (dataUpdated) {
            // Publish to WebSocket
            await publishToWebSocket(centerCode);
            console.log(`📡 Published ${centerCode} updates to WebSocket`);
          } else {
            console.log(`ℹ️ No changes detected for ${centerCode}`);
          }
          
          resolve({
            center: centerCode,
            status: 'success',
            dataUpdated,
            output: output.trim(),
            timestamp: new Date().toISOString()
          });
          
        } catch (error) {
          reject(new Error(`Failed to process ${centerCode} results: ${error.message}`));
        }
        
      } else {
        reject(new Error(`Python scraper failed for ${centerCode} with code ${code}: ${errorOutput}`));
      }
    });
    
    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start Python scraper for ${centerCode}: ${error.message}`));
    });
    
    // Set timeout (matching GitHub Actions timeout-minutes: 5)
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error(`Python scraper timeout for ${centerCode}`));
    }, 4 * 60 * 1000); // 4 minutes timeout
  });
}

/**
 * Check if data files were updated (preserving smart caching logic)
 */
async function checkDataUpdates(centerCode) {
  try {
    const activeFile = `data/active_incidents_${centerCode}.json`;
    const deltaFile = `data/incident_deltas_${centerCode}.json`;
    
    // Check if files exist and have recent timestamps
    const activeExists = fs.existsSync(activeFile);
    const deltaExists = fs.existsSync(deltaFile);
    
    if (!activeExists) {
      return false;
    }
    
    // Check file modification time (within last 2 minutes)
    const stats = fs.statSync(activeFile);
    const now = Date.now();
    const fileAge = now - stats.mtime.getTime();
    
    // File was updated recently (within last 2 minutes)
    const recentlyUpdated = fileAge < 2 * 60 * 1000;
    
    return recentlyUpdated;
    
  } catch (error) {
    console.error(`Error checking data updates for ${centerCode}:`, error);
    return false;
  }
}

/**
 * Publish updates to WebSocket (preserving delta logic)
 */
async function publishToWebSocket(centerCode) {
  try {
    const centerInfo = CENTER_INFO[centerCode];
    
    // Read the active incidents file
    const activeFile = `data/active_incidents_${centerCode}.json`;
    const activeData = JSON.parse(fs.readFileSync(activeFile, 'utf8'));
    
    // Read delta file if it exists
    const deltaFile = `data/incident_deltas_${centerCode}.json`;
    let deltaData = null;
    
    if (fs.existsSync(deltaFile)) {
      deltaData = JSON.parse(fs.readFileSync(deltaFile, 'utf8'));
    }
    
    // Publish active incidents update
    await pusher.trigger(centerInfo.channel, 'new-incident', {
      center: centerCode,
      centerName: centerInfo.name,
      centerFullName: `${centerInfo.name} Communication Center`,
      incidents: activeData.incidents,
      incidentCount: activeData.incident_count,
      timestamp: new Date().toISOString(),
      eventType: 'scrape-complete',
      lastUpdated: activeData.last_updated
    });
    
    // Publish delta updates if available
    if (deltaData && (deltaData.new_count > 0 || deltaData.removed_count > 0)) {
      await pusher.trigger(centerInfo.channel, 'updated-incident', {
        center: centerCode,
        centerName: centerInfo.name,
        newIncidents: deltaData.new_incidents,
        removedIncidents: deltaData.removed_incidents,
        newCount: deltaData.new_count,
        removedCount: deltaData.removed_count,
        timestamp: new Date().toISOString(),
        eventType: 'delta-update'
      });
      
      console.log(`📊 Published delta update: ${deltaData.new_count} new, ${deltaData.removed_count} removed`);
    }
    
    // Publish center status update
    await pusher.trigger(centerInfo.channel, 'center-status', {
      center: centerCode,
      centerName: centerInfo.name,
      status: 'active',
      lastUpdate: new Date().toISOString(),
      incidentCount: activeData.incident_count,
      health: 'good'
    });
    
  } catch (error) {
    console.error(`Error publishing to WebSocket for ${centerCode}:`, error);
    throw error;
  }
}

/**
 * Update timestamp file (like GitHub Actions)
 */
async function updateTimestamp() {
  try {
    const timestampData = {
      last_updated: new Date().toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };
    
    fs.writeFileSync('data/timestamp.json', JSON.stringify(timestampData, null, 2));
    console.log('📅 Updated timestamp file');
    
  } catch (error) {
    console.error('Error updating timestamp:', error);
  }
}
