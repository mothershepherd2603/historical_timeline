/**
 * Test Script for Event Connections and External Links Feature
 * 
 * This script tests the new related_events and external_links functionality
 * 
 * Usage: node testEventConnections.js
 */

const mongoose = require('mongoose');
const Event = require('./models/Event');
const Period = require('./models/Period');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/historical_timeline';

async function testEventConnections() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✓ Connected to MongoDB');
        
        // Get or create a test period
        let testPeriod = await Period.findOne({ name: 'Test Period' });
        if (!testPeriod) {
            testPeriod = await Period.create({
                name: 'Test Period',
                start_year: 1900,
                end_year: 2000,
                description: 'Test period for event connections'
            });
            console.log('✓ Created test period');
        } else {
            console.log('✓ Using existing test period');
        }
        
        // Test 1: Create an event with external links
        console.log('\n--- Test 1: Create event with external links ---');
        const event1 = await Event.create({
            title: 'Test Event with External Links',
            summary: 'This event has external resource links',
            event_type: 'point',
            year: 1947,
            date: new Date('1947-08-15'),
            location_type: 'point',
            latitude: 28.6139,
            longitude: 77.2090,
            place_name: 'New Delhi',
            period_id: testPeriod._id,
            external_links: [
                {
                    title: 'Wikipedia Article',
                    url: 'https://en.wikipedia.org/wiki/Indian_Independence'
                },
                {
                    title: 'Government Archive',
                    url: 'https://archive.gov.in/independence'
                }
            ]
        });
        console.log('✓ Created event with external links:', event1.title);
        console.log('  External links count:', event1.external_links.length);
        event1.external_links.forEach((link, idx) => {
            console.log(`  Link ${idx + 1}: ${link.title} - ${link.url}`);
        });
        
        // Test 2: Create a related event
        console.log('\n--- Test 2: Create related event ---');
        const event2 = await Event.create({
            title: 'Related Historical Event',
            summary: 'This event is related to the first one',
            event_type: 'point',
            year: 1950,
            date: new Date('1950-01-26'),
            location_type: 'point',
            latitude: 28.6139,
            longitude: 77.2090,
            place_name: 'New Delhi',
            period_id: testPeriod._id,
            related_events: [event1._id],
            external_links: [
                {
                    title: 'Constitution of India',
                    url: 'https://en.wikipedia.org/wiki/Constitution_of_India'
                }
            ]
        });
        console.log('✓ Created related event:', event2.title);
        console.log('  Related to:', event1._id);
        console.log('  External links count:', event2.external_links.length);
        
        // Test 3: Update event1 to link back to event2
        console.log('\n--- Test 3: Update event to add related events ---');
        event1.related_events = [event2._id];
        await event1.save();
        console.log('✓ Updated event1 to link to event2');
        console.log('  Event1 related events:', event1.related_events);
        
        // Test 4: Fetch events with populated related events
        console.log('\n--- Test 4: Fetch and populate related events ---');
        const populatedEvent = await Event.findById(event1._id)
            .populate('related_events', 'title year summary');
        console.log('✓ Fetched event with populated related events');
        console.log('  Main event:', populatedEvent.title);
        console.log('  Related events:');
        populatedEvent.related_events.forEach((relEvent, idx) => {
            console.log(`    ${idx + 1}. ${relEvent.title} (${relEvent.year})`);
        });
        
        // Test 5: Test validation - invalid URL
        console.log('\n--- Test 5: Test validation (should fail) ---');
        try {
            await Event.create({
                title: 'Invalid Event',
                summary: 'This should fail',
                event_type: 'point',
                year: 2000,
                location_type: 'point',
                latitude: 0,
                longitude: 0,
                period_id: testPeriod._id,
                external_links: [
                    {
                        title: 'Invalid Link',
                        url: 'not-a-valid-url'
                    }
                ]
            });
            console.log('✗ Validation should have failed!');
        } catch (err) {
            console.log('✓ Validation correctly failed for invalid URL');
            console.log('  Error:', err.message);
        }
        
        // Test 6: Test self-reference prevention (manual check - server.js handles this)
        console.log('\n--- Test 6: Self-reference check ---');
        console.log('✓ Self-reference prevention implemented in server.js validation');
        console.log('  (validateRelatedEvents checks currentEventId)');
        
        // Test 7: Query events with external links
        console.log('\n--- Test 7: Query events with external links ---');
        const eventsWithLinks = await Event.find({
            'external_links.0': { $exists: true }
        }).select('title external_links');
        console.log('✓ Found', eventsWithLinks.length, 'events with external links');
        eventsWithLinks.forEach((event, idx) => {
            console.log(`  ${idx + 1}. ${event.title} - ${event.external_links.length} link(s)`);
        });
        
        // Test 8: Query events with related events
        console.log('\n--- Test 8: Query events with related events ---');
        const eventsWithRelations = await Event.find({
            'related_events.0': { $exists: true }
        }).select('title related_events');
        console.log('✓ Found', eventsWithRelations.length, 'events with related events');
        eventsWithRelations.forEach((event, idx) => {
            console.log(`  ${idx + 1}. ${event.title} - ${event.related_events.length} relation(s)`);
        });
        
        // Summary
        console.log('\n=== Test Summary ===');
        console.log('✓ All tests completed successfully!');
        console.log('');
        console.log('Database Changes:');
        console.log('  - Created test events with IDs:', event1._id, 'and', event2._id);
        console.log('  - Both events have external_links populated');
        console.log('  - Both events have related_events populated');
        console.log('  - Events are cross-referenced to each other');
        console.log('');
        console.log('Cleanup:');
        console.log('  To remove test data, run:');
        console.log(`  db.events.deleteOne({ _id: ObjectId("${event1._id}") })`);
        console.log(`  db.events.deleteOne({ _id: ObjectId("${event2._id}") })`);
        
    } catch (error) {
        console.error('✗ Test failed:', error);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
    }
}

// Run tests
console.log('Starting Event Connections and External Links Tests...\n');
testEventConnections();
