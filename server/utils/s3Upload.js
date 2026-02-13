// Utility to upload files to AWS S3
const s3 = require('./s3');
const path = require('path');

/**
 * Uploads a file buffer to S3 with public-read access
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
  };
  return s3.upload(params).promise();
}

/**
 * Generate a pre-signed URL for temporary secure access
 * @param {string} key - S3 key (path in bucket)
 * @param {number} expiresIn - URL expiration time in seconds (default: 1 hour)
 * @param {string} bucket - S3 bucket name
 * @returns {string} Pre-signed URL
 */
function getSignedUrl(key, expiresIn = 3600, bucket = process.env.AWS_BUCKET_NAME) {
  const params = {
    Bucket: bucket,
    Key: key,
    Expires: expiresIn,
  };
  return s3.getSignedUrl('getObject', params);
}

module.exports = { uploadToS3, getSignedUrl };
