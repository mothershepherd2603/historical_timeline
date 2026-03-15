const mongoose = require('mongoose');
require('dotenv').config();

const ContactQuery = require('./models/ContactQuery');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/historical_timeline';

async function test() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        const queries = await ContactQuery.find()
            .sort({ created_at: -1 })
            .limit(5)
            .select('name email subject message status created_at');

        console.log(`Found ${await ContactQuery.countDocuments()} total contact queries\n`);
        console.log('Latest 5 queries:');
        console.log('='.repeat(60));
        
        queries.forEach((q, i) => {
            console.log(`\n${i + 1}. ${q.name} (${q.email})`);
            console.log(`   Subject: ${q.subject} | Status: ${q.status}`);
            console.log(`   Message: ${q.message.substring(0, 50)}...`);
            console.log(`   Created: ${q.created_at.toISOString()}`);
        });

        await mongoose.disconnect();
        console.log('\n✓ Test complete');
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

test();
