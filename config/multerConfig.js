// Multer for handling file uploads
const multer = require('multer');
// Path for file path manipulation
const path = require('path');

// Configuring multer to store the file in memory
const storage = multer.memoryStorage();

// Initializing multer with configuration options
const upload = multer({
    // Specify storage configuration
    storage: storage,
    // Define file filter function
    fileFilter: function (req, file, cb) {
        // Define allowed file types
        const filetypes = /jpeg|jpg|png|webp/;
        // Check if file MIME type matches allowed types
        const mimetype = filetypes.test(file.mimetype);
        // Check if file extension matches allowed types
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        // If both MIME type and extension match allowed types, accept the file
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            // If file type is not allowed, reject the file upload with an error
            cb(new Error('Only .png, .jpg, .jpeg and .webp format allowed!'));
        }
    }
});

// Exporting the configured multer instance for file upload
module.exports = upload;
