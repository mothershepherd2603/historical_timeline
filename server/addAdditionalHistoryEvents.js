const mongoose = require('mongoose');
const Event = require('./models/Event');
const additionalHistoryEvents = require('./additionalHistoryEvents');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/historical_timeline';

async function addAdditionalHistoryEvents() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const operations = additionalHistoryEvents.map((event) => ({
      updateOne: {
        filter: { title: event.title },
        update: {
          $set: {
            ...event,
            updated_at: new Date()
          },
          $setOnInsert: {
            created_at: new Date()
          }
        },
        upsert: true
      }
    }));

    const result = await Event.bulkWrite(operations, { ordered: false });

    console.log(`Processed ${additionalHistoryEvents.length} events.`);
    console.log(`Inserted: ${result.upsertedCount || 0}`);
    console.log(`Updated: ${result.modifiedCount || 0}`);
    console.log('Additional history events import complete.');
  } catch (error) {
    console.error('Error importing additional history events:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

addAdditionalHistoryEvents();
