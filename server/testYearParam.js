const mongoose = require('mongoose');
const Event = require('./models/Event');
require('dotenv').config();

async function testYearParameter() {
    try {
        // Connect to MongoDB
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/historical_timeline';
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');
        
        // Test 1: Query for specific year (year 0)
        console.log('\n=== Test 1: Specific year (year=0) ===');
        const query1 = { year: 0 };
        const events1 = await Event.find(query1).limit(10).lean();
        console.log('Found', events1.length, 'events for year 0');
        events1.forEach(e => console.log(`  - ${e.title}`));
        
        // Test 2: Query for year range
        console.log('\n=== Test 2: Year range (-100 to 100) ===');
        const query2 = { year: { $gte: -100, $lte: 100 } };
        const count2 = await Event.countDocuments(query2);
        console.log('Total events in range:', count2);
        const events2 = await Event.find(query2).limit(10).lean();
        console.log('Sample of 10 events:');
        events2.forEach(e => console.log(`  - ${e.title} (${e.year})`));
        
        // Test 3: Query for negative year
        console.log('\n=== Test 3: Negative year (year=-500) ===');
        const query3 = { year: -500 };
        const count3 = await Event.countDocuments(query3);
        console.log('Total events for year -500:', count3);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testYearParameter();
