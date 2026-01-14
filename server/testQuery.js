const mongoose = require('mongoose');
const Event = require('./models/Event');
require('dotenv').config();

async function testQuery() {
    try {
        // Connect to MongoDB
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/historical_timeline';
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');
        
        // Test the exact query that's failing
        const start_year = -3000;
        const end_year = 500;
        
        console.log('\nTesting query with start_year:', start_year, 'end_year:', end_year);
        
        const query = {
            year: {
                $gte: start_year,
                $lte: end_year
            }
        };
        
        console.log('Query object:', JSON.stringify(query, null, 2));
        
        // Count documents
        const count = await Event.countDocuments(query);
        console.log('Found', count, 'events');
        
        // Try to fetch events
        console.log('\nAttempting to fetch events...');
        const events = await Event.find(query)
            .sort({ year: 1, date: -1 })
            .limit(10);
        
        console.log('Successfully fetched', events.length, 'events');
        events.forEach(e => {
            console.log(`  - ${e.title} (${e.year})`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testQuery();
