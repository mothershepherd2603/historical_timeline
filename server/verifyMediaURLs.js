const mongoose = require('mongoose');
const Media = require('./models/Media');
const Event = require('./models/Event');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/historical_timeline';

async function verifyMediaURLs() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Check all media entries
        const mediaCount = await Media.countDocuments();
        console.log(`Total media files in database: ${mediaCount}\n`);

        if (mediaCount === 0) {
            console.log('⚠ No media files found in database!');
            return;
        }

        // Get first 5 media entries to check URLs
        const mediaFiles = await Media.find().limit(5);
        
        console.log('Sample Media URLs:');
        console.log('==================');
        mediaFiles.forEach((media, index) => {
            console.log(`\n${index + 1}. Media ID: ${media._id}`);
            console.log(`   Type: ${media.type}`);
            console.log(`   URL: ${media.url}`);
            console.log(`   S3 Key: ${media.s3_key || 'N/A'}`);
            console.log(`   Bucket: ${media.bucket || 'N/A'}`);
            
            // Check if URL is properly formatted
            if (media.url && media.url.includes('s3')) {
                if (media.url.includes('historical-timeline.s3.ap-south-1.amazonaws.com')) {
                    console.log(`   ✓ URL format looks correct`);
                } else {
                    console.log(`   ⚠ URL format may be incorrect`);
                }
            } else {
                console.log(`   ✗ URL doesn't appear to be an S3 URL`);
            }
        });

        // Check if events have media
        const eventsWithMedia = await Event.find({ media_ids: { $exists: true, $ne: [] } })
            .populate('media_ids')
            .limit(3);

        console.log('\n\nSample Events with Media:');
        console.log('=========================');
        eventsWithMedia.forEach((event, index) => {
            console.log(`\n${index + 1}. Event: ${event.title}`);
            console.log(`   Media count: ${event.media_ids?.length || 0}`);
            if (event.media_ids && event.media_ids.length > 0) {
                event.media_ids.forEach((media, midx) => {
                    console.log(`   Media ${midx + 1}: ${media.url}`);
                });
            }
        });

        console.log('\n\n=== TESTING RECOMMENDATIONS ===');
        console.log('\n1. Test a media URL in your browser:');
        if (mediaFiles.length > 0) {
            console.log(`   ${mediaFiles[0].url}`);
        }
        
        console.log('\n2. Expected URL format:');
        console.log('   https://historical-timeline.s3.ap-south-1.amazonaws.com/media/images/FILENAME.jpg');
        
        console.log('\n3. Check AWS S3 Console:');
        console.log('   - Go to S3 > historical-timeline bucket');
        console.log('   - Verify files exist in media/images/ folder');
        console.log('   - Check Permissions tab > Block public access');
        console.log('   - Verify Bucket policy is applied');
        console.log('   - Verify CORS configuration is saved');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
    }
}

verifyMediaURLs();
