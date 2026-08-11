import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

interface CloudinaryCredentials {
  cloud_name?: string;
  api_key?: string;
  api_secret?: string;
}

// Parses a `cloudinary://api_key:api_secret@cloud_name` connection string.
const parseCloudinaryUrl = (url: string): CloudinaryCredentials => {
  const match = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/.exec(url.trim());
  if (!match) return {};
  return {
    cloud_name: match[3],
    api_key: match[1],
    api_secret: match[2],
  };
};

const credentials = process.env.CLOUDINARY_URL
  ? parseCloudinaryUrl(process.env.CLOUDINARY_URL)
  : {};

cloudinary.config({
  cloud_name: credentials.cloud_name || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: credentials.api_key || process.env.CLOUDINARY_API_KEY,
  api_secret: credentials.api_secret || process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

// Uploads a single image buffer to Cloudinary and resolves with the stored URL.
export const uploadImageToCloudinary = (
  file: Express.Multer.File,
  folder: string,
): Promise<CloudinaryUploadResult> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (!result) {
          return reject(new Error("Cloudinary upload returned no result."));
        }
        return resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      },
    );
    stream.end(file.buffer);
  });
