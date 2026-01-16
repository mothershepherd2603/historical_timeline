/**
 * Add recommended indexes for enhanced event schema
 * 
 * Run this script to add database indexes for better query performance
 * 
 * Usage: node addIndexes.js
 */

const mongoose = require('mongoose');
const Event = require('./models/Event');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/historical_timeline';

async function addIndexes() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB\n');

        console.log('Adding indexes to events collection...\n');

        const indexes = [
            { fields: { event_type: 1 }, name: 'idx_event_type' },
            { fields: { location_type: 1 }, name: 'idx_location_type' },
            { fields: { start_year: 1 }, name: 'idx_start_year' },
            { fields: { end_year: 1 }, name: 'idx_end_year' },
            { fields: { geographic_scope: 1 }, name: 'idx_geographic_scope' },
            { fields: { period_id: 1, year: 1 }, name: 'idx_period_year' },
            { fields: { period_id: 1, start_year: 1 }, name: 'idx_period_start_year' }
        ];

        for (const index of indexes) {
            try {
                await Event.collection.createIndex(index.fields, { name: index.name });
                console.log(`✅ Created index: ${index.name}`);
            } catch (err) {
                if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
                    console.log(`⚠️  Index already exists: ${index.name}`);
                } else {
                    console.log(`❌ Error creating index ${index.name}:`, err.message);
                }
            }
        }

        console.log('\nListing all indexes on events collection:');
        const existingIndexes = await Event.collection.getIndexes();
        console.log(JSON.stringify(existingIndexes, null, 2));

        console.log('\n✨ Index creation complete!');

    } catch (error) {
        console.error('Error adding indexes:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nMongoDB connection closed');
    }
}

addIndexes().catch(console.error);
