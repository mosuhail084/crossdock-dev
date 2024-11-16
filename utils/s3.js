const {S3Client} = require('@aws-sdk/client-s3');



exports.s3Client = new S3Client({
    region: "ap-south-1",
    credentials: {
        accessKeyId: process.env.accessKeyId,
        secretAccessKey: process.env.secretAccessKey,
    }
});