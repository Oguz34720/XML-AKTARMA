import cron from 'node-cron';
import { runTicimaxSync } from './ticimaxSync.js';

export function initScheduler() {
  console.log('[Scheduler] Initializing cron jobs...');
  
  // Run every day at 02:00 AM Istanbul time (UTC+3 = 23:00 UTC)
  cron.schedule("0 23 * * *", async () => {
    try {
      await runTicimaxSync();
    } catch (error) {
      console.error('[Scheduler] Ticimax sync failed:', error);
    }
  }, { 
    timezone: "Europe/Istanbul" 
  });
}
