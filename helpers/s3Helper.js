const { s3Client } = require("../utils/s3");
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

/**
 * Deletes all objects in a directory (prefix) in S3.
 * @param {string} userId - The ID of the user, used as the directory name in S3.
 * @returns {Promise<void>} - Resolves when the directory and its contents are deleted.
 */
const clearS3Directory = async (userId) => {
    const prefix = `${userId}/`; // The directory to delete

    try {
        // List all objects in the directory
        const listCommand = new ListObjectsV2Command({
            Bucket: process.env.BUCKET_NAME,
            Prefix: prefix,
        });

        const listResponse = await s3Client.send(listCommand);

        if (listResponse.Contents && listResponse.Contents.length > 0) {
            // Prepare keys for deletion
            const objectsToDelete = listResponse.Contents.map((object) => ({ Key: object.Key }));

            // Delete all objects
            const deleteCommand = new DeleteObjectsCommand({
                Bucket: process.env.BUCKET_NAME,
                Delete: {
                    Objects: objectsToDelete,
                },
            });

            await s3Client.send(deleteCommand);
        }
    } catch (error) {
        console.error(`Failed to clear directory ${prefix}:`, error);
        throw new Error('Failed to clear existing directory in S3');
    }
};

/**
 * Uploads a file to S3 using the AWS SDK.
 * @param {Object} file - The file object from multer, containing the file buffer and MIME type.
 * @param {string} userId - The ID of the user, used to create the S3 file path.
 * @returns {Promise<Object>} - A promise that resolves with the result of the S3 upload (e.g. the ETag and other metadata).
 */
const uploadToS3 = async (file, userId) => {
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: `${userId}/${file.fieldname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    return params.Key;
};

/**
 * Generates a signed URL for an S3 object.
 * @param {string} key - The S3 object key.
 * @returns {Promise<string>} - The signed URL.
 */
const generateSignedUrl = async (key) => {
    try {
        const command = new GetObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: key,
        });
        return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } catch (error) {
        console.error('Error generating signed URL:', error);
        return null;
    }
};

module.exports = {
    uploadToS3,
    clearS3Directory,
    generateSignedUrl
};
