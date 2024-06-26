//const { Upload } = require("@aws-sdk/lib-storage");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const fs = require("fs");

const s3 = new S3Client({
  endpoint: `https://${process.env.AWS_REGION}.digitaloceanspaces.com`,
  forcePathStyle: false,
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

module.exports.uploadFileAWS = async (files, elemId, dir = "orders") => {
  const showLocation = (key) =>
    Promise.resolve({
      Location: `https://${process.env.AWS_BUCKET_NAME}.${process.env.AWS_REGION}.cdn.digitaloceanspaces.com/${key}`,
    });

  const uploadParams = files.map((file) => {
    return {
      ACL: "public-read",
      Bucket: process.env.AWS_BUCKET_NAME,
      Body: fs.readFileSync(file.filepath),
      Key: `ascoline/${dir}/${elemId}/${Date.now().toString()}${
        file.newFilename
      }`,
      ContentType: file.mimetype,
    };
  });

  return await Promise.all(
    uploadParams.map(async (param) => {
      const command = new PutObjectCommand(param);
      return Promise.all([s3.send(command), showLocation(param.Key)]);
    }),
  );
};

module.exports.deleteFileAWS = async (files) => {
  const deleteParams = files.map((file) => {
    return {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: file.replace(
        `https://${process.env.AWS_BUCKET_NAME}.${process.env.AWS_REGION}.cdn.digitaloceanspaces.com/`,
        "",
      ),
    };
  });

  return await Promise.all(
    deleteParams.map((param) => {
      const command = new DeleteObjectCommand(param);
      return s3.send(command);
    }),
  );
};
