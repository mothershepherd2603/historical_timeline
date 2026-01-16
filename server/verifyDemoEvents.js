/**
 * Verify Demo Events
 * 
 * This script verifies the created demo events and shows distribution
 * 
 * Usage: node verifyDemoEvents.js
 */

const mongoose = require('mongoose');
const Event = require('./models/Event');
const Period = require('./models/Period');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/historical_timeline';

async function verifyDemoEvents() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB\n');

        // Get all periods
        const periods = await Period.find({});
        
        console.log('='.repeat(60));
        console.log('DEMO EVENTS VERIFICATION REPORT');
        console.log('='.repeat(60));
        console.log('');

        // Overall statistics
        const totalEvents = await Event.countDocuments({});
        const pointEvents = await Event.countDocuments({ event_type: 'point' });
        const periodEvents = await Event.countDocuments({ event_type: 'period' });
        const pointLocations = await Event.countDocuments({ location_type: 'point' });
        const areaLocations = await Event.countDocuments({ location_type: 'area' });
        
        console.log('OVERALL STATISTICS');
        console.log('-'.repeat(60));
        console.log(`Total Events: ${totalEvents}`);
        console.log('');
        console.log('Event Types:');
        console.log(`  Point Events: ${pointEvents} (${((pointEvents/totalEvents)*100).toFixed(1)}%)`);
        console.log(`  Period Events: ${periodEvents} (${((periodEvents/totalEvents)*100).toFixed(1)}%)`);
        console.log('');
        console.log('Location Types:');
        console.log(`  Point Locations: ${pointLocations} (${((pointLocations/totalEvents)*100).toFixed(1)}%)`);
        console.log(`  Area Locations: ${areaLocations} (${((areaLocations/totalEvents)*100).toFixed(1)}%)`);
        console.log('');

        // Geographic scope breakdown
        const countryScope = await Event.countDocuments({ geographic_scope: 'country' });
        const stateScope = await Event.countDocuments({ geographic_scope: 'state' });
        const districtScope = await Event.countDocuments({ geographic_scope: 'district' });
        const regionScope = await Event.countDocuments({ geographic_scope: 'region' });
        
        console.log('Geographic Scope (for area locations):');
        console.log(`  Country: ${countryScope}`);
        console.log(`  State: ${stateScope}`);
        console.log(`  District: ${districtScope}`);
        console.log(`  Region: ${regionScope}`);
        console.log('');

        // Multilingual content
        const withHindi = await Event.countDocuments({ description_hindi: { $exists: true, $ne: null } });
        const withHinglish = await Event.countDocuments({ description_hinglish: { $exists: true, $ne: null } });
        
        console.log('Multilingual Content:');
        console.log(`  Events with Hindi: ${withHindi} (${((withHindi/totalEvents)*100).toFixed(1)}%)`);
        console.log(`  Events with Hinglish: ${withHinglish} (${((withHinglish/totalEvents)*100).toFixed(1)}%)`);
        console.log('');

        // Period-wise distribution
        console.log('PERIOD-WISE DISTRIBUTION');
        console.log('-'.repeat(60));
        
        for (const period of periods) {
            const count = await Event.countDocuments({ period_id: period._id });
            const pointCount = await Event.countDocuments({ period_id: period._id, event_type: 'point' });
            const periodCount = await Event.countDocuments({ period_id: period._id, event_type: 'period' });
            
            console.log(`\n${period.name}:`);
            console.log(`  Total: ${count} events`);
            console.log(`  Point Events: ${pointCount}`);
            console.log(`  Period Events: ${periodCount}`);
            
            // Show sample events
            const sampleEvents = await Event.find({ period_id: period._id }).limit(3).select('title event_type location_type');
            if (sampleEvents.length > 0) {
                console.log(`  Sample Events:`);
                sampleEvents.forEach(event => {
                    console.log(`    - ${event.title} (${event.event_type}, ${event.location_type})`);
                });
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('✨ Demo events verification complete!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('Error verifying demo events:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nMongoDB connection closed');
    }
}

verifyDemoEvents().catch(console.error);
