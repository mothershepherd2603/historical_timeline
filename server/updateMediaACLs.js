const AWS = require('aws-sdk');
const Media = require('./models/Media');
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/historical_timeline';

// Verify credentials are loaded
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
  console.error('❌ Error: AWS credentials not found in environment variables');
  console.error('Please ensure .env file contains:');
  console.error('  - AWS_ACCESS_KEY_ID');
  console.error('  - AWS_SECRET_ACCESS_KEY');
  console.error('  - AWS_REGION');
  console.error('  - AWS_BUCKET_NAME');
  process.exit(1);
}

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
});

console.log('AWS Configuration:');
console.log(`  Region: ${process.env.AWS_REGION}`);
console.log(`  Bucket: ${process.env.AWS_BUCKET_NAME}`);
console.log(`  Access Key: ${process.env.AWS_ACCESS_KEY_ID?.substring(0, 4)}...`);

async function updateMediaACLs() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all media files with S3 keys
    const mediaFiles = await Media.find({ s3_key: { $exists: true, $ne: null } });
    console.log(`\nFound ${mediaFiles.length} media files in database`);

    if (mediaFiles.length === 0) {
      console.log('No media files to update');
      await mongoose.connection.close();
      return;
    }

    let successCount = 0;
    let failCount = 0;

    console.log('\nUpdating ACLs to public-read...\n');

    for (const media of mediaFiles) {
      try {
        const bucket = media.bucket || process.env.AWS_BUCKET_NAME;
        
        // Update the ACL to public-read
        await s3.putObjectAcl({
          Bucket: bucket,
          Key: media.s3_key,
          ACL: 'public-read'
        }).promise();
        
        console.log(`✅ Updated: ${media.s3_key}`);
        console.log(`   Caption: ${media.caption}`);
        console.log(`   URL: ${media.url}`);
        successCount++;
      } catch (err) {
        console.error(`❌ Failed: ${media.s3_key}`);
        console.error(`   Error: ${err.message}`);
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Summary:');
    console.log(`  Total files: ${mediaFiles.length}`);
    console.log(`  ✅ Successfully updated: ${successCount}`);
    console.log(`  ❌ Failed: ${failCount}`);
    console.log('='.repeat(60));

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    console.log('Done!\n');
  } catch (err) {
    console.error('Error during ACL update:', err);
    process.exit(1);
  }
}

// Run the update
updateMediaACLs();
