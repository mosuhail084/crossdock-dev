const { ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client } = require('../utils/s3.js');

exports.getObjectUrls = async (bucketName, folderKey) => {
    try {
        const command = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: folderKey
        });

        const response = await s3Client.send(command);

        // Generate a pre-signed URL for each object
        const objectUrls = await Promise.all(
            response.Contents.map(async (object) => {
                const getObjectCommand = new GetObjectCommand({
                    Bucket: bucketName,
                    Key: object.Key,
                });

                const url = await getSignedUrl(s3Client, getObjectCommand, { Expires: 3600 });
                return url;
            })
        );

        return objectUrls;
    } catch (error) {
        console.error('Error listing objects in folder:', error);
        throw error;
    }
};

/**
 * Extracts the S3 key from the full document URL.
 * @param {string} documentPath - Full URL of the document.
 * @returns {string} - The S3 key.
 */
function extractS3Key(documentPath) {
    const url = new URL(documentPath);
    return url.pathname.substring(1);
}

/**
 * Generates a pre-signed URL for a given S3 object path.
 * @param {string} documentPath - The path to the document in the S3 bucket.
 * @param {number} [expiresIn=3600] - Expiration time in seconds (default is 1 hour).
 * @returns {Promise<string>} - The pre-signed URL for accessing the document.
 */
exports.generatePreSignedUrl = async (documentPath, expiresIn = 3600) => {
    const key = extractS3Key(documentPath);
    const command = new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
};