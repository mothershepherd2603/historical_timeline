const mongoose = require('mongoose');
require('dotenv').config();

const Event = require('./models/Event');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/historical_timeline';

async function testDateField() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find the event that's missing the date
        const eventId = '6967cf0211f0707adcf13e57';
        const event = await Event.findById(eventId);
        
        if (event) {
            console.log('\nEvent details:');
            console.log('Title:', event.title);
            console.log('Year:', event.year);
            console.log('Date field exists:', 'date' in event);
            console.log('Date value:', event.date);
            console.log('Date type:', typeof event.date);
            
            // Update the event with a date
            console.log('\nUpdating event with date...');
            event.date = new Date('2026-01-14');
            await event.save();
            
            console.log('Event updated successfully!');
            
            // Fetch again to verify
            const updatedEvent = await Event.findById(eventId);
            console.log('\nAfter update:');
            console.log('Date value:', updatedEvent.date);
            console.log('Date ISO string:', updatedEvent.date ? updatedEvent.date.toISOString() : 'null');
        } else {
            console.log('Event not found');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

testDateField();
