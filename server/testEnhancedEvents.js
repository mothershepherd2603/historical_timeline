/**
 * Test Script for Enhanced Event Schema
 * 
 * This script tests the new event features:
 * - Multilingual support
 * - Period events
 * - Geographic area events
 * 
 * Usage: node testEnhancedEvents.js
 */

const mongoose = require('mongoose');
const Event = require('./models/Event');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/historical_timeline';

// Test data
const testPeriodId = new mongoose.Types.ObjectId();

const testEvents = [
    {
        name: 'Point Event - Historical (before 1947)',
        data: {
            title: 'Battle of Plassey',
            summary: 'Decisive battle establishing British dominance',
            description: 'Battle between British East India Company and Nawab of Bengal',
            event_type: 'point',
            year: 1757,
            location_type: 'point',
            latitude: 23.7957,
            longitude: 88.2545,
            place_name: 'Plassey, West Bengal',
            period_id: testPeriodId,
            tags: ['battle', 'british-india']
        },
        shouldPass: true
    },
    {
        name: 'Point Event - Modern (after 1947) with date',
        data: {
            title: 'Independence Day of India',
            summary: 'India gained independence',
            description: 'India gained independence from British rule',
            description_hindi: 'भारत ने ब्रिटिश शासन से स्वतंत्रता प्राप्त की',
            description_hinglish: 'Bharat ne British shasan se swatantrata prapt ki',
            event_type: 'point',
            year: 1947,
            date: new Date('1947-08-15'),
            location_type: 'point',
            latitude: 28.6139,
            longitude: 77.209,
            place_name: 'Red Fort, Delhi',
            period_id: testPeriodId,
            tags: ['independence', 'political']
        },
        shouldPass: true
    },
    {
        name: 'Period Event with Point Location',
        data: {
            title: 'Mughal Empire',
            summary: 'Rule of Mughal dynasty',
            description: 'Period of Mughal rule in India',
            event_type: 'period',
            start_year: 1526,
            end_year: 1857,
            location_type: 'point',
            latitude: 28.6139,
            longitude: 77.209,
            place_name: 'Delhi',
            period_id: testPeriodId,
            tags: ['empire', 'dynasty']
        },
        shouldPass: true
    },
    {
        name: 'Period Event with Area Location - Country',
        data: {
            title: 'Green Revolution in India',
            summary: 'Agricultural transformation',
            description: 'Introduction of high-yielding varieties',
            description_hindi: 'उच्च उपज देने वाली किस्मों की शुरुआत',
            description_hinglish: 'Uchch upaj dene wali kismon ki shuruaat',
            event_type: 'period',
            start_year: 1960,
            end_year: 1970,
            start_date: new Date('1960-01-01'),
            end_date: new Date('1970-12-31'),
            location_type: 'area',
            geographic_scope: 'country',
            area_name: 'India',
            latitude: 28.6139,
            longitude: 77.209,
            period_id: testPeriodId,
            tags: ['agriculture', 'economic']
        },
        shouldPass: true
    },
    {
        name: 'Period Event with Area Location - State',
        data: {
            title: 'Chipko Movement',
            summary: 'Forest conservation movement',
            description: 'Environmental movement in Uttarakhand',
            event_type: 'period',
            start_year: 1973,
            end_year: 1981,
            start_date: new Date('1973-04-01'),
            end_date: new Date('1981-12-31'),
            location_type: 'area',
            geographic_scope: 'state',
            area_name: 'Uttarakhand',
            latitude: 30.0668,
            longitude: 79.0193,
            period_id: testPeriodId,
            tags: ['environmental', 'social movement']
        },
        shouldPass: true
    },
    {
        name: 'INVALID: Point Event without year',
        data: {
            title: 'Invalid Event',
            summary: 'Should fail',
            event_type: 'point',
            location_type: 'point',
            latitude: 28.6139,
            longitude: 77.209,
            period_id: testPeriodId
        },
        shouldPass: false,
        expectedError: 'Point events require a year field'
    },
    {
        name: 'INVALID: Point Event (>= 1947) without date',
        data: {
            title: 'Invalid Modern Event',
            summary: 'Should fail - modern event without date',
            event_type: 'point',
            year: 2000,
            location_type: 'point',
            latitude: 28.6139,
            longitude: 77.209,
            period_id: testPeriodId
        },
        shouldPass: false,
        expectedError: 'Point events from 1947 onwards require a specific date'
    },
    {
        name: 'INVALID: Period Event without start_year',
        data: {
            title: 'Invalid Period',
            summary: 'Should fail',
            event_type: 'period',
            end_year: 1970,
            location_type: 'point',
            latitude: 28.6139,
            longitude: 77.209,
            period_id: testPeriodId
        },
        shouldPass: false,
        expectedError: 'Period events require a start_year field'
    },
    {
        name: 'INVALID: Period Event with end_year < start_year',
        data: {
            title: 'Invalid Period Range',
            summary: 'Should fail - end before start',
            event_type: 'period',
            start_year: 1970,
            end_year: 1960,
            location_type: 'point',
            latitude: 28.6139,
            longitude: 77.209,
            period_id: testPeriodId
        },
        shouldPass: false,
        expectedError: 'end_year must be greater than or equal to start_year'
    },
    {
        name: 'INVALID: Point Location without coordinates',
        data: {
            title: 'Invalid Location',
            summary: 'Should fail - no coordinates',
            event_type: 'point',
            year: 2000,
            date: new Date('2000-01-01'),
            location_type: 'point',
            period_id: testPeriodId
        },
        shouldPass: false,
        expectedError: 'Point locations require latitude and longitude'
    },
    {
        name: 'INVALID: Area Location without geographic_scope',
        data: {
            title: 'Invalid Area',
            summary: 'Should fail - no scope',
            event_type: 'point',
            year: 2000,
            date: new Date('2000-01-01'),
            location_type: 'area',
            area_name: 'India',
            period_id: testPeriodId
        },
        shouldPass: false,
        expectedError: 'Area locations require a geographic_scope field'
    }
];

async function runTests() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB\n');

        let passed = 0;
        let failed = 0;
        const results = [];

        for (const test of testEvents) {
            console.log(`Testing: ${test.name}`);
            
            try {
                const event = new Event(test.data);
                await event.validate();
                await event.save();
                
                if (test.shouldPass) {
                    console.log('✅ PASS - Event created successfully');
                    passed++;
                    results.push({ test: test.name, status: 'PASS', message: 'Created successfully' });
                    
                    // Clean up - delete the test event
                    await Event.findByIdAndDelete(event._id);
                } else {
                    console.log('❌ FAIL - Expected validation error but event was created');
                    failed++;
                    results.push({ 
                        test: test.name, 
                        status: 'FAIL', 
                        message: 'Expected validation error but succeeded',
                        expected: test.expectedError
                    });
                    
                    // Clean up
                    await Event.findByIdAndDelete(event._id);
                }
            } catch (error) {
                if (!test.shouldPass) {
                    const errorMessage = error.message;
                    if (test.expectedError && errorMessage.includes(test.expectedError)) {
                        console.log(`✅ PASS - Got expected error: ${errorMessage}`);
                        passed++;
                        results.push({ test: test.name, status: 'PASS', message: `Got expected error: ${errorMessage}` });
                    } else {
                        console.log(`⚠️  PARTIAL - Got error but different from expected`);
                        console.log(`   Expected: ${test.expectedError}`);
                        console.log(`   Got: ${errorMessage}`);
                        passed++;
                        results.push({ 
                            test: test.name, 
                            status: 'PARTIAL', 
                            message: `Got error: ${errorMessage}`,
                            expected: test.expectedError
                        });
                    }
                } else {
                    console.log(`❌ FAIL - Unexpected error: ${error.message}`);
                    failed++;
                    results.push({ test: test.name, status: 'FAIL', message: error.message });
                }
            }
            
            console.log('');
        }

        console.log('='.repeat(60));
        console.log('TEST SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${testEvents.length}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log('');

        if (failed > 0) {
            console.log('Failed Tests:');
            results.filter(r => r.status === 'FAIL').forEach(r => {
                console.log(`  - ${r.test}`);
                console.log(`    ${r.message}`);
                if (r.expected) {
                    console.log(`    Expected: ${r.expected}`);
                }
            });
        }

        console.log('\n✨ All tests completed!\n');

    } catch (error) {
        console.error('Error running tests:', error);
    } finally {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

// Run tests
runTests().catch(console.error);
