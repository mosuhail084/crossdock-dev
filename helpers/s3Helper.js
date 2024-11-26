const { s3Client } = require("../utils/s3");
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');

/**
 * Deletes all objects in a directory (prefix) in S3.
 * @param {string} userPhone - The phone number of the user, used as the directory name in S3.
 * @returns {Promise<void>} - Resolves when the directory and its contents are deleted.
 */
const clearS3Directory = async (userPhone) => {
    const prefix = `${userPhone}/`; // The directory to delete

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
 * @param {string} userPhone - The phone number of the user, used to create the S3 file path.
 * @returns {Promise<Object>} - A promise that resolves with the result of the S3 upload (e.g. the ETag and other metadata).
 */
const uploadToS3 = async (file, userPhone) => {
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: `${userPhone}/${file.fieldname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    return params.Key;
};

module.exports = {
    uploadToS3,
    clearS3Directory
};
