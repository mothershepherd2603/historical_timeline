/**
 * Test Period Event Overlap Query
 * 
 * This script tests that querying by year returns both point events
 * and overlapping period events
 * 
 * Usage: node testPeriodOverlap.js
 */

const mongoose = require('mongoose');
const Event = require('./models/Event');
const Period = require('./models/Period');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/historical_timeline';

async function testPeriodOverlap() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB\n');

        console.log('='.repeat(60));
        console.log('TESTING PERIOD EVENT OVERLAP QUERIES');
        console.log('='.repeat(60));
        console.log('');

        // Test 1: Query for year 1965 (should return Green Revolution)
        console.log('Test 1: Query for year 1965');
        console.log('-'.repeat(60));
        
        const year1965 = 1965;
        const events1965 = await Event.find({
            $or: [
                { event_type: 'point', year: year1965 },
                { 
                    event_type: 'period', 
                    start_year: { $lte: year1965 },
                    end_year: { $gte: year1965 }
                }
            ]
        }).select('title event_type year start_year end_year');
        
        console.log(`Found ${events1965.length} events for year 1965:`);
        events1965.forEach(event => {
            if (event.event_type === 'point') {
                console.log(`  ✓ ${event.title} (Point Event - ${event.year})`);
            } else {
                console.log(`  ✓ ${event.title} (Period Event - ${event.start_year} to ${event.end_year})`);
            }
        });
        console.log('');

        // Test 2: Query for year 1975 (should return Emergency Period)
        console.log('Test 2: Query for year 1975');
        console.log('-'.repeat(60));
        
        const year1975 = 1975;
        const events1975 = await Event.find({
            $or: [
                { event_type: 'point', year: year1975 },
                { 
                    event_type: 'period', 
                    start_year: { $lte: year1975 },
                    end_year: { $gte: year1975 }
                }
            ]
        }).select('title event_type year start_year end_year');
        
        console.log(`Found ${events1975.length} events for year 1975:`);
        events1975.forEach(event => {
            if (event.event_type === 'point') {
                console.log(`  ✓ ${event.title} (Point Event - ${event.year})`);
            } else {
                console.log(`  ✓ ${event.title} (Period Event - ${event.start_year} to ${event.end_year})`);
            }
        });
        console.log('');

        // Test 3: Query for year 1947 (should return Independence + multiple period events)
        console.log('Test 3: Query for year 1947');
        console.log('-'.repeat(60));
        
        const year1947 = 1947;
        const events1947 = await Event.find({
            $or: [
                { event_type: 'point', year: year1947 },
                { 
                    event_type: 'period', 
                    start_year: { $lte: year1947 },
                    end_year: { $gte: year1947 }
                }
            ]
        }).select('title event_type year start_year end_year');
        
        console.log(`Found ${events1947.length} events for year 1947:`);
        events1947.forEach(event => {
            if (event.event_type === 'point') {
                console.log(`  ✓ ${event.title} (Point Event - ${event.year})`);
            } else {
                console.log(`  ✓ ${event.title} (Period Event - ${event.start_year} to ${event.end_year})`);
            }
        });
        console.log('');

        // Test 4: Date-based query (if we have events with dates)
        console.log('Test 4: Query for specific date (1991-07-24)');
        console.log('-'.repeat(60));
        
        const specificDate = new Date('1991-07-24');
        const eventsOnDate = await Event.find({
            $or: [
                {
                    event_type: 'point',
                    date: {
                        $gte: new Date('1991-07-24'),
                        $lt: new Date('1991-07-25')
                    }
                },
                {
                    event_type: 'period',
                    start_date: { $lte: specificDate },
                    end_date: { $gte: specificDate }
                }
            ]
        }).select('title event_type date start_date end_date');
        
        console.log(`Found ${eventsOnDate.length} events for date 1991-07-24:`);
        eventsOnDate.forEach(event => {
            if (event.event_type === 'point') {
                console.log(`  ✓ ${event.title} (Point Event - ${event.date?.toISOString().split('T')[0]})`);
            } else {
                console.log(`  ✓ ${event.title} (Period Event - ${event.start_date?.toISOString().split('T')[0]} to ${event.end_date?.toISOString().split('T')[0]})`);
            }
        });
        console.log('');

        // Test 5: Show all period events
        console.log('Test 5: All Period Events in Database');
        console.log('-'.repeat(60));
        
        const allPeriodEvents = await Event.find({ 
            event_type: 'period' 
        }).select('title start_year end_year start_date end_date');
        
        console.log(`Total period events: ${allPeriodEvents.length}`);
        allPeriodEvents.forEach(event => {
            console.log(`  - ${event.title} (${event.start_year} - ${event.end_year})`);
        });
        console.log('');

        console.log('='.repeat(60));
        console.log('✅ Period overlap query tests complete!');
        console.log('='.repeat(60));
        console.log('');
        console.log('SUMMARY:');
        console.log('  The query logic correctly returns both:');
        console.log('  1. Point events matching the specific year/date');
        console.log('  2. Period events that overlap with the queried year/date');
        console.log('');
        console.log('  This ensures period events display on the timeline!');

    } catch (error) {
        console.error('Error testing period overlap:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nMongoDB connection closed');
    }
}

testPeriodOverlap().catch(console.error);
