// Utility to upload files to AWS S3
const s3 = require('./s3');
const path = require('path');

/**
 * Uploads a file buffer to S3
 * @param {Buffer} buffer - File buffer
 * @param {string} key - S3 key (path in bucket)
 * @param {string} mimetype - File MIME type
 * @param {string} bucket - S3 bucket name
 * @returns {Promise<object>} S3 upload result
 */
async function uploadToS3(buffer, key, mimetype, bucket = process.env.AWS_BUCKET_NAME) {
  const params = {
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
    ACL: 'public-read',
  };
  return s3.upload(params).promise();
}

module.exports = { uploadToS3 };
