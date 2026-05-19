import { v2 as cloudinary } from "cloudinary";
import config from "../config/config.js";

cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret,
});

/**
 * Uploads a file buffer to Cloudinary.
 * @param {Buffer} fileBuffer - The file buffer to upload.
 * @param {string} folder - The destination folder name in Cloudinary.
 * @returns {Promise<object>} - The Cloudinary upload result.
 */
export const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      },
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Deletes an asset from Cloudinary by its public ID.
 * @param {string} publicId - The public ID of the asset to delete.
 * @returns {Promise<object>} - The Cloudinary destroy result.
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary Delete Error:", error);
    throw error;
  }
};
