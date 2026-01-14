const mongoose = require('mongoose');
const Event = require('./models/Event');
require('dotenv').config();

async function testDateQueries() {
    try {
        // Connect to MongoDB
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/historical_timeline';
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');
        
        // Test 1: Find events with dates (Current Affairs)
        console.log('\n=== Test 1: Count events with dates ===');
        const withDates = await Event.countDocuments({ date: { $exists: true, $ne: null } });
        console.log('Events with dates:', withDates);
        
        // Test 2: Sample some events with dates
        console.log('\n=== Test 2: Sample events with dates ===');
        const sampleEvents = await Event.find({ date: { $exists: true, $ne: null } })
            .limit(5)
            .sort({ date: -1 })
            .lean();
        
        sampleEvents.forEach(e => {
            console.log(`  - ${e.title} | Date: ${e.date} | Year: ${e.year}`);
        });
        
        // Test 3: Query by specific date
        if (sampleEvents.length > 0) {
            const testDate = sampleEvents[0].date;
            const dateObj = new Date(testDate);
            const dateStr = dateObj.toISOString().split('T')[0]; // Format: YYYY-MM-DD
            
            console.log(`\n=== Test 3: Query for specific date (${dateStr}) ===`);
            
            const selectedDate = new Date(dateStr);
            const nextDay = new Date(selectedDate);
            nextDay.setDate(nextDay.getDate() + 1);
            
            const query = {
                date: {
                    $gte: selectedDate,
                    $lt: nextDay
                }
            };
            
            const eventsOnDate = await Event.find(query).lean();
            console.log('Events on this date:', eventsOnDate.length);
            eventsOnDate.forEach(e => {
                console.log(`  - ${e.title}`);
            });
        }
        
        // Test 4: Query by date parameter (simulating API call)
        console.log('\n=== Test 4: Simulate API call with date parameter ===');
        const testDateParam = '2025-01-01';
        const selectedDate = new Date(testDateParam);
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const apiQuery = {
            date: {
                $gte: selectedDate,
                $lt: nextDay
            }
        };
        
        const apiResults = await Event.find(apiQuery).limit(10).lean();
        console.log(`Results for date=${testDateParam}:`, apiResults.length, 'events');
        apiResults.forEach(e => {
            console.log(`  - ${e.title}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testDateQueries();
