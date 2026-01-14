const mongoose = require('mongoose');
const Event = require('./models/Event');
const Period = require('./models/Period');
require('dotenv').config();

async function test() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/historical_timeline');
        console.log('Connected to MongoDB');
        
        // Get periods
        const periods = await Period.find({});
        console.log('Found periods:', periods.length);
        periods.forEach(p => console.log(`  - ${p.name} (${p._id})`));
        
        // Find ancient period
        const ancientPeriod = periods.find(p => p.name.toLowerCase().includes('ancient'));
        console.log('\nAncient period:', ancientPeriod ? ancientPeriod.name : 'NOT FOUND');
        
        if (ancientPeriod) {
            console.log('\nCreating test event...');
            const event = await Event.create({
                title: 'Test Event',
                description: 'This is a test event',
                summary: 'Test',
                year: -2000,
                period_id: ancientPeriod._id,
                latitude: 28.6139,
                longitude: 77.2090,
                tags: ['test'],
                media_ids: []
            });
            console.log('Created event:', event.title);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

test();
