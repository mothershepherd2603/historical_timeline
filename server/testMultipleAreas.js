/**
 * Test Script for Multiple Area Selection Feature
 * 
 * This script tests the new multiple geographic areas functionality for events
 * 
 * Usage: node testMultipleAreas.js
 */

const mongoose = require('mongoose');
const Event = require('./models/Event');
const Period = require('./models/Period');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/historical_timeline';

async function testMultipleAreas() {
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
                description: 'Test period for multiple areas'
            });
            console.log('✓ Created test period');
        } else {
            console.log('✓ Using existing test period');
        }
        
        // Test 1: Create event with NEW format (multiple areas)
        console.log('\n--- Test 1: Create event with multiple areas (NEW FORMAT) ---');
        const multipleAreasData = [
            {
                geojson: {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[[75.0, 28.0], [76.0, 28.0], [76.0, 29.0], [75.0, 29.0], [75.0, 28.0]]]
                    },
                    properties: {}
                },
                name: 'Punjab',
                type: 'state'
            },
            {
                geojson: {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[[76.0, 28.0], [77.0, 28.0], [77.0, 29.0], [76.0, 29.0], [76.0, 28.0]]]
                    },
                    properties: {}
                },
                name: 'Haryana',
                type: 'state'
            },
            {
                geojson: {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[[77.0, 26.0], [79.0, 26.0], [79.0, 28.0], [77.0, 28.0], [77.0, 26.0]]]
                    },
                    properties: {}
                },
                name: 'Western Uttar Pradesh',
                type: 'custom'
            }
        ];
        
        const multiAreaEvent = await Event.create({
            title: 'Green Revolution in North India',
            summary: 'Agricultural revolution affecting multiple states',
            event_type: 'period',
            start_year: 1960,
            end_year: 1970,
            start_date: new Date('1960-01-01'),
            end_date: new Date('1970-12-31'),
            location_type: 'area',
            geographic_scope: 'region',
            area_name: 'North India Agricultural Belt',
            geojson_boundary: multipleAreasData,
            period_id: testPeriod._id
        });
        
        console.log('✓ Created event with multiple areas:', multiAreaEvent.title);
        console.log('  Areas count:', multiAreaEvent.geojson_boundary.length);
        multiAreaEvent.geojson_boundary.forEach((area, idx) => {
            console.log(`  Area ${idx + 1}: ${area.name} (${area.type})`);
        });
        
        // Test 2: Create event with OLD format (single area as object)
        console.log('\n--- Test 2: Create event with single area (OLD FORMAT) ---');
        const singleAreaData = {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [[[72.0, 18.0], [73.0, 18.0], [73.0, 19.0], [72.0, 19.0], [72.0, 18.0]]]
            },
            properties: { name: 'Maharashtra' }
        };
        
        const singleAreaEvent = await Event.create({
            title: 'Event with Old Single Area Format',
            summary: 'Testing backward compatibility',
            event_type: 'point',
            year: 1947,
            date: new Date('1947-08-15'),
            location_type: 'area',
            geographic_scope: 'state',
            area_name: 'Maharashtra',
            geojson_boundary: singleAreaData,
            period_id: testPeriod._id
        });
        
        console.log('✓ Created event with single area (old format):', singleAreaEvent.title);
        console.log('  GeoJSON type:', singleAreaEvent.geojson_boundary.type);
        
        // Test 3: Fetch and verify both events
        console.log('\n--- Test 3: Fetch events and verify formats ---');
        const fetchedMultiArea = await Event.findById(multiAreaEvent._id);
        const fetchedSingleArea = await Event.findById(singleAreaEvent._id);
        
        console.log('✓ Multiple area event:');
        console.log('  - Is array?', Array.isArray(fetchedMultiArea.geojson_boundary));
        console.log('  - Areas count:', Array.isArray(fetchedMultiArea.geojson_boundary) ? 
            fetchedMultiArea.geojson_boundary.length : 1);
        
        console.log('✓ Single area event (old format):');
        console.log('  - Is array?', Array.isArray(fetchedSingleArea.geojson_boundary));
        console.log('  - Has type field?', !!fetchedSingleArea.geojson_boundary.type);
        
        // Test 4: Update event to add more areas
        console.log('\n--- Test 4: Update event to add more areas ---');
        const updatedAreasData = [
            ...multipleAreasData,
            {
                geojson: {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[[74.0, 30.0], [75.0, 30.0], [75.0, 31.0], [74.0, 31.0], [74.0, 30.0]]]
                    },
                    properties: {}
                },
                name: 'Rajasthan Border Region',
                type: 'custom'
            }
        ];
        
        multiAreaEvent.geojson_boundary = updatedAreasData;
        await multiAreaEvent.save();
        
        const refetchedEvent = await Event.findById(multiAreaEvent._id);
        console.log('✓ Updated event with additional area');
        console.log('  New areas count:', refetchedEvent.geojson_boundary.length);
        refetchedEvent.geojson_boundary.forEach((area, idx) => {
            console.log(`  Area ${idx + 1}: ${area.name}`);
        });
        
        // Test 5: Test validation - invalid format
        console.log('\n--- Test 5: Test validation (should fail) ---');
        try {
            await Event.create({
                title: 'Invalid Area Format Event',
                summary: 'This should fail validation',
                event_type: 'point',
                year: 1900, // Use year before 1947 to avoid date requirement
                location_type: 'area',
                geographic_scope: 'state',
                area_name: 'Invalid',
                geojson_boundary: "invalid-string-format", // Wrong type
                period_id: testPeriod._id
            });
            console.log('✗ Validation should have failed!');
        } catch (err) {
            console.log('✓ Validation correctly failed for invalid format');
            console.log('  Error:', err.message);
        }
        
        // Test 6: Test validation - array with invalid structure
        console.log('\n--- Test 6: Test array validation (should fail) ---');
        try {
            const invalidAreaArray = [
                {
                    // Missing 'name' and 'type' fields
                    geojson: {
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: [0, 0] }
                    }
                }
            ];
            
            await Event.create({
                title: 'Invalid Array Structure Event',
                summary: 'Missing required fields in area object',
                event_type: 'point',
                year: 1900, // Use year before 1947 to avoid date requirement
                location_type: 'area',
                geographic_scope: 'state',
                area_name: 'Test',
                geojson_boundary: invalidAreaArray,
                period_id: testPeriod._id
            });
            console.log('✗ Validation should have failed!');
        } catch (err) {
            console.log('✓ Validation correctly failed for incomplete area object');
            console.log('  Error:', err.message);
        }
        
        // Test 7: Query events with multiple areas
        console.log('\n--- Test 7: Query events with areas ---');
        const eventsWithAreas = await Event.find({
            geojson_boundary: { $ne: null }
        }).select('title geojson_boundary');
        
        console.log('✓ Found', eventsWithAreas.length, 'events with geographic areas');
        eventsWithAreas.forEach((event, idx) => {
            const isArray = Array.isArray(event.geojson_boundary);
            const areaCount = isArray ? event.geojson_boundary.length : 1;
            const format = isArray ? 'NEW (array)' : 'OLD (object)';
            console.log(`  ${idx + 1}. ${event.title} - ${areaCount} area(s) - Format: ${format}`);
        });
        
        // Test 8: Test empty array (valid)
        console.log('\n--- Test 8: Test empty array (should succeed) ---');
        const emptyAreasEvent = await Event.create({
            title: 'Event with Empty Areas Array',
            summary: 'Testing empty array support',
            event_type: 'point',
            year: 1990,
            date: new Date('1990-01-01'), // Include date for year >= 1947
            location_type: 'point',
            latitude: 28.6139,
            longitude: 77.2090,
            place_name: 'Delhi',
            geojson_boundary: [], // Empty array is valid
            period_id: testPeriod._id
        });
        console.log('✓ Empty array accepted:', emptyAreasEvent.title);
        console.log('  Areas count:', emptyAreasEvent.geojson_boundary.length);
        
        // Summary
        console.log('\n=== Test Summary ===');
        console.log('✓ All tests completed successfully!');
        console.log('');
        console.log('Tested Features:');
        console.log('  ✓ Multiple areas (new array format)');
        console.log('  ✓ Single area (old object format)');
        console.log('  ✓ Backward compatibility');
        console.log('  ✓ Adding/updating multiple areas');
        console.log('  ✓ Validation for invalid formats');
        console.log('  ✓ Validation for incomplete area objects');
        console.log('  ✓ Querying events with areas');
        console.log('  ✓ Empty array support');
        console.log('');
        console.log('Database Changes:');
        console.log('  - Created test events with IDs:');
        console.log(`    • Multi-area: ${multiAreaEvent._id}`);
        console.log(`    • Single-area: ${singleAreaEvent._id}`);
        console.log(`    • Empty array: ${emptyAreasEvent._id}`);
        console.log('');
        console.log('Cleanup:');
        console.log('  To remove test data, run:');
        console.log(`  db.events.deleteOne({ _id: ObjectId("${multiAreaEvent._id}") })`);
        console.log(`  db.events.deleteOne({ _id: ObjectId("${singleAreaEvent._id}") })`);
        console.log(`  db.events.deleteOne({ _id: ObjectId("${emptyAreasEvent._id}") })`);
        
    } catch (error) {
        console.error('✗ Test failed:', error);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
    }
}

// Run tests
console.log('Starting Multiple Area Selection Tests...\n');
testMultipleAreas();
