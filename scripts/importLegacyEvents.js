/**
 * Safe Legacy Events Import Script
 * 
 * NON-DESTRUCTIVE: Only inserts events that don't already exist in MongoDB.
 * Uses legacyId for deduplication.
 * 
 * Run: node scripts/importLegacyEvents.js
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Event = require('../models/Event');
const { LEGACY_EVENTS } = require('../controllers/eventController');

const importLegacyEvents = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gfg_cmp';
    console.log('[Import Legacy Events] Connecting to MongoDB...');
    await mongoose.connect(connStr);
    console.log('[Import Legacy Events] Connected!');

    let imported = 0;
    let skipped = 0;

    for (const legacy of LEGACY_EVENTS) {
      // Check if already migrated by legacyId OR title
      const existing = await Event.findOne({
        $or: [
          { legacyId: legacy.legacyId },
          { title: legacy.title }
        ]
      });

      if (existing) {
        skipped++;
        console.log(`[SKIP] Already exists: "${legacy.title}"`);
        continue;
      }

      await Event.create({
        communityId: 'gfg-jamia-hamdard',
        legacyId: legacy.legacyId || legacy._id,
        source: 'legacy',
        title: legacy.title,
        description: legacy.description,
        banner: legacy.banner,
        date: legacy.date,
        status: legacy.status,
        isUpcoming: legacy.isUpcoming !== false,
        speaker: legacy.speaker || '',
        partner: legacy.partner || '',
        prizePool: legacy.prizePool || '',
        category: legacy.category || '',
        venue: ''
      });

      imported++;
      console.log(`[IMPORTED] "${legacy.title}" (${legacy.status})`);
    }

    console.log(`====================================================`);
    console.log(`✓ Import complete: ${imported} events imported, ${skipped} skipped (already exist).`);
    console.log(`  Total legacy events: ${LEGACY_EVENTS.length}`);
    console.log(`  Total events in MongoDB: ${await Event.countDocuments({ communityId: 'gfg-jamia-hamdard' })}`);
    console.log(`====================================================`);

  } catch (err) {
    console.error('[Import Legacy Events Error]:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('[Import Legacy Events] Disconnected from MongoDB.');
  }
};

importLegacyEvents();
