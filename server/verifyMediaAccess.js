const Media = require('./models/Media');
const mongoose = require('mongoose');
const https = require('https');
const http = require('http');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/historical_timeline';

async function checkUrlAccessible(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, (res) => {
      resolve({
        accessible: res.statusCode === 200,
        statusCode: res.statusCode,
        statusMessage: res.statusMessage
      });
      res.resume(); // Consume response data to free up memory
    });
    
    req.on('error', (err) => {
      resolve({
        accessible: false,
        error: err.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        accessible: false,
        error: 'Timeout'
      });
    });
  });
}

async function verifyMediaAccess() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find all media files
    const mediaFiles = await Media.find();
    console.log(`Found ${mediaFiles.length} media files in database\n`);

    if (mediaFiles.length === 0) {
      console.log('No media files to verify');
      await mongoose.connection.close();
      return;
    }

    let successCount = 0;
    let failCount = 0;

    console.log('Checking media accessibility...\n');

    for (const media of mediaFiles) {
      try {
        const result = await checkUrlAccessible(media.url);
        
        if (result.accessible) {
          console.log(`✅ ACCESSIBLE: ${media.caption}`);
          console.log(`   URL: ${media.url}`);
          console.log(`   Status: ${result.statusCode} ${result.statusMessage}\n`);
          successCount++;
        } else {
          console.log(`❌ NOT ACCESSIBLE: ${media.caption}`);
          console.log(`   URL: ${media.url}`);
          if (result.statusCode) {
            console.log(`   Status: ${result.statusCode} ${result.statusMessage}`);
          }
          if (result.error) {
            console.log(`   Error: ${result.error}`);
          }
          console.log('');
          failCount++;
        }
      } catch (err) {
        console.error(`❌ ERROR checking: ${media.caption}`);
        console.error(`   Error: ${err.message}\n`);
        failCount++;
      }
    }

    console.log('='.repeat(60));
    console.log('Summary:');
    console.log(`  Total files: ${mediaFiles.length}`);
    console.log(`  ✅ Accessible: ${successCount}`);
    console.log(`  ❌ Not accessible: ${failCount}`);
    console.log('='.repeat(60));

    if (failCount > 0) {
      console.log('\n⚠️  Some media files are not accessible!');
      console.log('Please apply the S3 bucket policy from S3_BUCKET_POLICY.md\n');
    } else {
      console.log('\n🎉 All media files are publicly accessible!\n');
    }

    await mongoose.connection.close();
    console.log('Database connection closed\n');
  } catch (err) {
    console.error('Error during verification:', err);
    process.exit(1);
  }
}

// Run the verification
verifyMediaAccess();
