// Importing the cloudinary configuration module
const cloudinary = require("../config/cloudinary.config.js");

/**
 * Uploads an image to Cloudinary.
 * 
 * @param {Object} file - The file to be uploaded.
 * @param {string} folder - The folder in which the file should be stored on Cloudinary.
 * @returns {Promise} A Promise that resolves with the upload result or rejects with an error.
 */
const uploadImage = async (file, folder) => {
    // Convert the file buffer to base64 string
    const b64 = Buffer.from(file.buffer).toString("base64");
    // Construct data URI with the base64 string and file mimetype
    const dataURI = "data:" + file.mimetype + ";base64," + b64;
    // Return a Promise to handle the asynchronous upload operation
    return new Promise((resolve, reject) => {
        // Use the Cloudinary uploader to upload the image
        cloudinary.uploader.upload(dataURI, { resource_type: "auto", folder: folder }, (error, result) => {
            // If an error occurs during upload, reject the Promise with the error
            if (error) {
                reject(error);
            } else {
                // If upload is successful, resolve the Promise with the result
                resolve(result);
            }
        });
    });
};

/**
 * Deletes an image from Cloudinary.
 * 
 * @param {string} public_id - The public ID of the image to be deleted.
 * @returns {Promise} A Promise that resolves with the deletion result or rejects with an error.
 */
const deleteImage = async (public_id) => {
    // Return a Promise to handle the asynchronous deletion operation
    return new Promise((resolve, reject) => {
        // Use the Cloudinary uploader to delete the image with the specified public ID
        cloudinary.uploader.destroy(public_id, (error, result) => {
            // If an error occurs during deletion, reject the Promise with the error
            if (error) {
                reject(error);
            } else {
                // If deletion is successful, resolve the Promise with the result
                resolve(result);
            }
        });
    });
};

// Exporting the uploadImage and destroy functions
module.exports = { uploadImage, deleteImage };

