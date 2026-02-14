const mongoose = require('mongoose');
const Event = require('./models/Event');
const Media = require('./models/Media');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/historical_timeline';

async function testEventMedia() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all events
    const eventsCount = await Event.countDocuments();
    console.log(`Total events in database: ${eventsCount}`);

    // Get events with media_ids
    const eventsWithMedia = await Event.find({ 
      media_ids: { $exists: true, $ne: [] } 
    });
    console.log(`Events with media_ids: ${eventsWithMedia.length}\n`);

    if (eventsWithMedia.length > 0) {
      console.log('Sample event with media (before populate):');
      console.log('Title:', eventsWithMedia[0].title);
      console.log('media_ids:', eventsWithMedia[0].media_ids);
      console.log('media_ids type:', typeof eventsWithMedia[0].media_ids);
      console.log('media_ids is array:', Array.isArray(eventsWithMedia[0].media_ids));
      console.log('');
    }

    // Test populate without lean()
    console.log('Testing populate WITHOUT lean()...');
    const eventsPopulated = await Event.find({ 
      media_ids: { $exists: true, $ne: [] } 
    })
    .populate('media_ids')
    .limit(2);

    if (eventsPopulated.length > 0) {
      console.log('\nEvent 1 (without lean):');
      console.log('Title:', eventsPopulated[0].title);
      console.log('media_ids length:', eventsPopulated[0].media_ids?.length);
      if (eventsPopulated[0].media_ids?.[0]) {
        console.log('First media item:', {
          type: eventsPopulated[0].media_ids[0].type,
          caption: eventsPopulated[0].media_ids[0].caption,
          url: eventsPopulated[0].media_ids[0].url
        });
      }
    }

    // Test populate with lean()
    console.log('\n\nTesting populate WITH lean()...');
    const eventsLean = await Event.find({ 
      media_ids: { $exists: true, $ne: [] } 
    })
    .populate('media_ids')
    .limit(2)
    .lean();

    if (eventsLean.length > 0) {
      console.log('\nEvent 1 (with lean):');
      console.log('Title:', eventsLean[0].title);
      console.log('media_ids length:', eventsLean[0].media_ids?.length);
      if (eventsLean[0].media_ids?.[0]) {
        console.log('First media item:', {
          type: eventsLean[0].media_ids[0].type,
          caption: eventsLean[0].media_ids[0].caption,
          url: eventsLean[0].media_ids[0].url
        });
      }
    }

    // Get all media
    console.log('\n\nAll media in database:');
    const allMedia = await Media.find();
    allMedia.forEach(media => {
      console.log(`- ${media.caption}: ${media._id}`);
    });

    await mongoose.connection.close();
    console.log('\n\nDatabase connection closed');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testEventMedia();
