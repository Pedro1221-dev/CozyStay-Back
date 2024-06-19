// Importing the file system module
const fs = require('fs');
// Importing the bcrypt library
const bcrypt = require('bcrypt');
// Importing the crypto library
const crypto = require('crypto');
// Importing the jsonwebtoken library
const jwt = require('jsonwebtoken');
// Importing the nodemailer library
const nodemailer = require("nodemailer");
// Importing all the models
const db = require("../models/index.js");
// Define a variable User to represent the User model in the database
const User = db.user;
// Define a variable Language to represent the User model in the database
//const Language = db.language;
// Define a variable Badge to represent the User model in the database
//const Badge = db.badge;
// Define a variable Property to represent the User model in the database
const Property = db.property;
const Booking = db.booking;
const Favorite = db.favorite;
const UserOTP = db.user_otp;

// Importing the uploadImage and destroy functions from the cloudinary utilities
const { uploadImage, deleteImage }  = require('../utilities/cloudinary');


//"Op" necessary for LIKE operator
const { Op, ValidationError, UniqueConstraintError } = require('sequelize');

// Nodemailer Stuff
let transporter = nodemailer.createTransport({
    host: 'smtp.outlook.com',
    port: 587,
    secure: false, 
    auth: {
        user: process.env.AUTH_EMAIL, 
        pass: process.env.AUTH_PASS, 
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.log(error);
    } else {
        console.log("Ready for message");
        console.log(success);
    }
});

/**
 * Retrieves a list of users with optional pagination and filtering.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.findAll = async (req, res) => {
    try {
        // Initialize search options object
        const searchOptions = {};

        // Destructure query parameters
        const { limit: queryLimit, page: queryPage, name, blocked} = req.query;

        // Pagination information
        // Set the limit per page, defaulting to 10 if not specified in the query parameters
        const limit = queryLimit ? parseInt(queryLimit) : 10;
        // Determine the current page, defaulting to 1 if not specified in the query parameters
        const currentPage = queryPage ? parseInt(queryPage) : 1;
        // Calculate the offset for pagination, which determines the starting index of the users to be fetched for the current page
        const offset = (currentPage - 1) * limit;

        // Add 'name' query parameter to search options if provided
        if (name) {
            searchOptions.where = { name: { [Op.like]: `%${name}%` } };
        }

        // Add 'blocked' query parameter to search options if provided
        if (blocked) {
            // If 'blocked' parameter exists, add it to the search options
            // Here, the spread operator (...) is used to merge the existing 'where' conditions with the new 'blocked' condition
            // This ensures that any other search conditions specified previously are retained while adding the new 'blocked' condition
            searchOptions.where = { ...searchOptions.where, blocked: blocked };
        }

        // Validate and handle 'blocked' query parameter
        if (blocked && !(blocked === '0' || blocked === '1')) {
            return res.status(400).json({ message: "The 'blocked' parameter must be a boolean value ('0' for false and '1' for true)"});
        }
        
        // Validate query parameters
        if (isNaN(limit) || limit <= 5) {
            return res.status(400).json({ message: "Limit must be a positive integer, greater than 5" });
        }

        if (isNaN(currentPage) || currentPage < 1) {
            return res.status(400).json({ message: "Page must be 1 or a positive integer" });
        }

        // Find users with pagination and search options
        const users = await User.findAll({
            attributes: { exclude: ['password'] }, // Exclude the password attribute
            limit: limit,
            offset: offset,
            ...searchOptions,
            include: [
                {
                    model: db.language,
                    as: 'language',
                    attributes: ["language"],
                    through: { attributes: ["language_id"] } // Specifing atributes from the user_language table
                }, 
                {
                    model: db.badge,
                    as: 'badge',
                    attributes: ["title", "description"],
                    through: { attributes: ["badge_id"] } // Specifing atributes from the user_badge table
                }, 
                {
                    model: db.property,
                    attributes: ["property_id"],
                    as: 'favoriteProperty',
                    through: { attributes: [] } // Specifing atributes from the user_badge table
                }, 
            ]
        });

        // Calculate the total number of users after applying pagination
        const totalUsers = await User.count({
            where: searchOptions.where // Apply the same search options for counting
        });
        // Calculate the total number of pages based on the total number of properties and the limit per page
        const totalPages = Math.ceil(totalUsers / limit);
        // Previous and next page links
        // Calculate the page number for the previous page
        const previousPage = currentPage > 1 ? currentPage - 1 : null;
        // Calculate the page number for the next page
        // If currentPage is less than totalPages, set nextPage to currentPage + 1
        // If currentPage is 1, set nextPage to 2
        // Otherwise, set nextPage to null
        const nextPage = currentPage < totalPages ? currentPage + 1 : (currentPage === 1 ? 2 : null);

        // Handle no results found
        if (users.length === 0) {
            return res.status(404).json({ message: "No results found" });
        }

        // Handle out-of-range page number
        if (currentPage > totalPages) {
            return res.status(404).json({ message: "No more results available" });
        }
  
        // Create a new array of users with added links
        const usersWithLinks = users.map(user => ({
            ...user.toJSON(), // Convert the Sequelize object to a simple JavaScript object
            links: [
                { "rel": "self", "href": `/users/${user.user_id}`, "method": "GET" },
                { "rel": "delete", "href": `/users/${user.user_id}`, "method": "DELETE" },
                { "rel": "modify", "href": `/users/${user.user_id}`, "method": "PATCH" }
            ]
        }));
      
        // Send response with pagination and data
        res.status(200).json({ 
            success: true, 
            pagination: {
                total: totalUsers,
                pages: totalPages,
                current: currentPage,
                limit: limit
            },
            data: usersWithLinks,
            links: [
                { 
                    "rel": "add-user", 
                    "href": `/users`, 
                    "method": "POST" 
                },
                { 
                    "rel": "previous-page",
                    "href": `/users?limit=${limit}&page=${previousPage}`,
                    "method": "GET"
                },
                { 
                    "rel": "next-page",
                    "href": `/users?limit=${limit}&page=${nextPage}`,
                    "method": "GET"
                },
                { 
                    "rel": "last-page",
                    "href": `/users?limit=${limit}&page=${totalPages}`,
                    "method": "GET"
                },
                { 
                    "rel": "first-page",
                    "href": `/users?limit=${limit}&page=1`,
                    "method": "GET"
                }
            ]
        });
    } catch (error) {
        // If an error occurs, respond with an error status code and message
        res.status(500).json({ 
            success: false, 
            msg: "Some error occurred while retrieving the users."
        });
    }
};

/**
 * Retrieves a user by their ID.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.findOne = async (req, res) => {
    try {
        let user = await User.findByPk(req.params.user_id, {
            attributes: { exclude: ['password'] }, // Exclude the password attribute
            include: [
                {
                    model: db.language,
                    attributes: ["language"],
                    as: 'language',
                    through: { attributes: ["language_id"] } // Specifing atributes from the user_language table
                }, 
                {
                    model: db.badge,
                    as: 'badge',
                    attributes: ["title", "description", "url_badge"],
                    through: { attributes: ["badge_id"] } // Specifing atributes from the user_badge table
                }, 
                {
                    model: db.property,
                    attributes: ["property_id"],
                    as: 'favoriteProperty',
                    through: { attributes: [] } // Specifing atributes from the user_badge table
                }, 
            ]
        });

        // If the user is not found, return a 404 response
        if (!user) {
            return res.status(404).json({
                success: false, 
                msg: `User with ID ${req.params.user_id} not found.`
            });
        }

        // If user is found, return it along with links for actions (HATEOAS)
        res.status(200).json({ 
            success: true, 
            data: user,
            links:[
                { "rel": "self", "href": `/users/${user.user_id}`, "method": "GET" },
                { "rel": "delete", "href": `/users/${user.user_id}`, "method": "DELETE" },
                { "rel": "modify", "href": `/users/${user.user_id}`, "method": "PATCH" },
            ]
        });

    }
    catch (err) {
        // If an error occurs, return a 500 response with an error message
        return res.status(500).json({ 
            success: false, 
            msg: `Error retrieving user with ID ${req.params.user_id}.`
        });
        
    };
};

/**
 * Deletes a user by their ID. This endpoint serves two purposes:
 * 1. Deletes the logged-in user’s account and all associated data.
 * 2. Deletes a specific user account and all associated data (only available for administrators).
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
*/
exports.delete = async (req, res) => {
    try {
        // Retrieve the user information from the token in the header
        const loggedInUser = req.userData; 

        //console.log(loggedInUser.user_id);
        //console.log(req.params.user_id);

        // Check if the logged-in user is an admin or if someone is attempting to delete their own account
        if (loggedInUser.type !== 'admin' && loggedInUser.user_id !== parseInt(req.params.user_id)) {
            return res.status(403).json({ 
                success: false, 
                msg: "Unauthorized: You don't have permission to perform this action." });
        }

        // Find the user by their ID
        let user = await User.findByPk(req.params.user_id);

        // Check if the user is the owner of any properties with pending bookings
        const propertiesWithPendingBookings = await db.property.findOne({
            where: { owner_id: user.user_id },
            include: {
                model: db.booking,
                as: 'rating',
                where: { 
                    check_out_date: { [Op.gt]: new Date() } 
                },
            }
        });

        // If the user owns properties with pending bookings, return an error
        if (propertiesWithPendingBookings) {
            return res.status(400).json({
                success: false,
                msg: "Unable to delete the user because there are pending bookings associated with properties owned by him."
            });
        }

        // Check if the user has an avatar image associated and delete it from Cloudinary if it exists
        if (user.url_avatar && user.cloudinary_avatar_id) {
            await deleteImage(user.cloudinary_avatar_id);
        }

        // Check if the user has a banner image associated and delete it from Cloudinary if it exists
        if (user.url_banner && user.cloudinary_banner_id) {
            await deleteImage(user.cloudinary_banner_id);
        }

        // Attempt to delete the user with the specified ID
        let result = await User.destroy({ 
            where: { user_id: req.params.user_id}
        });


        // Check if the user was successfully deleted
        if (result == 1) {
            // Return a success message if the user was found and deleted
            return res.status(200).json({
                success: true, 
                msg: `User with id ${req.params.user_id} was successfully deleted!`
            });
        }

         // If the user was not found, return a 404 response
        return res.status(404).json({
            success: false, 
            msg: `User with ID ${req.params.user_id} not found.`
        });
    }
    catch (err) {
        console.log(err);
         // If an error occurs, return a 500 response with an error message
        res.status(500).json({
            success: false, 
            msg: `Error deleting user with ID ${req.params.user_id}.`
        });
    };
};


/**
 * Update a user by their ID.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.update = async (req, res) => {
    try {
        // Find the user by their ID
        let user = await User.findByPk(req.params.user_id);

        // If the user is not found, return a 404 response
        if (!user) {
            return res.status(404).json({
                success: false, msg: `User with ID ${req.params.user_id} not found.`
            });
        }

        // Attempt to update the user with the provided data
        let affectedRows = await User.update(
            req.body, { 
                where: { 
                    user_id: req.params.user_id
                } 
            });

        // If no rows were affected, return a success message indicating no updates were made
        if(affectedRows[0] === 0){
            return res.status(200).json({
                success: true, 
                msg: `No updates were made to user with ID ${req.params.user_id}.`
            });
        }

        // Return a success message indicating the user was updated successfully
        return res.json({
            success: true,
            msg: `User with ID ${req.params.user_id} was updated successfully.`
        });
    }
    catch (err) {
        // If a validation error occurs, return a 400 response with error messages
        if (err instanceof ValidationError)
            return res.status(400).json({ 
                success: false, 
                msg: err.errors.map(e => e.message) 
            });

        // If an error occurs, return a 500 response with an error message
        res.status(500).json({
            success: false, 
            msg: `Error retrieving user with ID ${req.params.user_id}.`
        });
    };
};

/**
 * Update a user by their ID.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.updateCurrent = async (req, res) => {
    try {
        // Retrieve the user ID from the token in the header
        const user_id = req.userData.user_id;

        // Find the user by their ID
        let user = await User.findByPk(user_id);

        // If the user is not found, return a 404 response
        if (!user) {
            return res.status(404).json({
                success: false, msg: `User with ID ${user_id} not found.`
            });
        }

        // Check if the type is being updated
        if (req.body.type) {
            return res.status(403).json({
                success: false, msg: `You are not authorized to change the user type.`
            });
        }

        if(req.body.password || req.body.confirmPassword) {
            // Check if passwords match
            if (!(req.body.password === req.body.confirmPassword)) {
                return res.status(400).json({
                    msg: 'Passwords do not match'
                });
            }
            // Hash the password
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            req.body.password = hashedPassword
        }
        
        // If there are files attached to the request, process them
        if (req.files) {
            try {
                // Process avatar file if provided
                if (req.files.url_avatar) {
                    // Upload new avatar image in the user folder
                    const avatarResult = await uploadImage(req.files.url_avatar[0], "user");

                    // Delete old avatar image if it exists
                    if (user.url_avatar && user.cloudinary_avatar_id) {
                        await deleteImage(user.cloudinary_avatar_id);
                    }

                    // Update user data with new avatar image details
                    req.body.url_avatar = avatarResult.secure_url;
                    req.body.cloudinary_avatar_id = avatarResult.public_id;
                }

                // Process banner file if provided
                if (req.files.url_banner) {
                    // Upload new banner image in the banner folder
                    const bannerResult = await uploadImage(req.files.url_banner[0], "banner");

                    // Delete old banner image if it exists
                    if (user.url_banner && user.cloudinary_banner_id) {
                        await deleteImage(user.cloudinary_banner_id);
                    }

                    // Update user data with new banner image details
                    req.body.url_banner = bannerResult.secure_url;
                    req.body.cloudinary_banner_id = bannerResult.public_id;
                }
            } catch (uploadError) {
                // Handle upload errors
                return res.status(500).json({
                    success: false,
                    msg: "Error uploading image: " + uploadError.message
                });
            }
        }

        // Attempt to update the user with the provided data
        let affectedRows = await User.update(
            req.body, { 
                where: { 
                    user_id: user_id
                } 
            });

        // If no rows were affected, return a success message indicating no updates were made
        if(affectedRows[0] === 0){
            return res.status(200).json({
                success: true, 
                msg: `No updates were made to user with ID ${user_id}.`
            });
        }

        // Return a success message indicating the user was updated successfully
        return res.json({
            success: true,
            msg: `User with ID ${user_id} was updated successfully.`
        });
    }
    catch (err) {
        // If a validation error occurs, return a 400 response with error messages
        if (err instanceof ValidationError)
            return res.status(400).json({ 
                success: false, 
                msg: err.errors.map(e => e.message) 
            });

        // If an error occurs, return a 500 response with an error message
        res.status(500).json({
            success: false, 
            msg: `Error retrieving user with ID ${user_id}.`
        });
    };
};


/**
 * Creates a new user.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.create = async (req, res) => {
    try {
        // Extracts the password property from the request body
        const { password, email, languages } = req.body;

        // Validate the password
        // Create a temporary instance of the User model with only the password set
        const userInstance = User.build({ password });

        // Validate only the password field
        try {
            await userInstance.validate({ fields: ['password'] });
        } catch (error) {
            // If there are validation errors in the password, return them
            return res.status(400).json({ 
                success: false, 
                msg: error.errors.map(e => e.message)
            });
        }

        // Hash the password before saving it to the database
        const hashedPassword = await bcrypt.hash(password, 10);

        // Add the hashed password to the request body
        req.body.password = hashedPassword;

        // Extract necessary user data from the request body (we don't want the languages array here)
        const userdata = {
            name: req.body.name,
            password: req.body.password,
            nationality: req.body.nationality,
            email: req.body.email,
            vat_number: req.body.vat_number,
            type: req.body.type
        }
        
        // Save the user in the database
        let newUser = await User.create(userdata);

        // If the user inserts languages
        if (languages) {
            // Extract language_ids from the array of language objects
            const languageIds = languages.map(language => language.language_id);

            // Associate the extracted language IDs with the newly created user
            await newUser.addLanguage(languageIds); 
        }

        // Send OTP verification email to the user
        await sendOTPVerificationEmail(newUser.user_id, email, res);
    }
    catch (err) {
        // If a validation error occurs, return a 400 response with error messages
        if (err instanceof ValidationError)
            res.status(400).json({ 
                success: false, 
                msg: err.errors.map(e => e.message) });
        // If a unique index error occurs, return a 400 response with error messages
        else if (err instanceof UniqueConstraintError)
            res.status(400).json({ 
                success: false, 
                msg: err.errors.map(e => e.message) }); 
        // If an error occurs, return a 500 response with an error message
        else
            res.status(500).json({
                success: false, 
                msg: err.message || "Some error occurred while creating the user."
            });
    };
};

/**
 * Sends OTP verification email to the provided email address.
 * @param {string} user_id - The user ID associated with the email.
 * @param {string} email - The email address to send the verification email to.
 * @param {Object} res - The response object to send HTTP response.
 */
const sendOTPVerificationEmail = async (user_id, email, res) => {
    try {
        // Generate a random OTP
        const otp = `${Math.floor(100000 + Math.random() * 900000)}`;

        // Read the email template from file
        const emailTemplate = fs.readFileSync('./html/email_verification.html', 'utf8');

        // Replace the placeholder {{otp}} with the actual OTP in the email template
        const emailBody = emailTemplate.replace('{{otp}}', otp); 

        // Configure email options
        const mailOptions = {
            from: process.env.AUTH_EMAIL,
            to: email,
            subject: "Verify your email",
            html: emailBody
        };

        // Hash the otp before saving it to the database
        const hashedOTP = await bcrypt.hash(otp, 10);

        // Save the hashed OTP to the database, along with user_id and expiration time
        await UserOTP.create({
            user_id: user_id,
            otp_code: hashedOTP,
            created_at: new Date(),
            expires_at: new Date(Date.now() + 3600 * 1000) // 1 hour expiration
        });

        // Send the email using nodemailer transporter
        await transporter.sendMail(mailOptions);

        // Return a success message
        res.status(200).json({
            success: true,
            msg: "Verification otp email sent",
            data: {
                user_id: user_id,
                email,
            }
        });
    } catch (err) {
        //console.error("Error sending OTP verification email:", err);
        // If an error occurs, return a 500 response with an error message
        return res.status(500).json({
            success: false, 
            msg: err.message || "Some error occurred while sending the otp email."
        });
    }
}

/**
 * Verifies the email associated with a user account using the provided OTP.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.verifyEmail = async (req, res) => {
    try {
        const { user_id, otp } = req.body;

        // If the user_id is not provided
        if (!user_id) {
            return res.status(400).json({
                success: false,
                msg: "User ID is required. Please provide a valid user ID."
            });
        }

        // If the otp code is not provided
        if (!otp) {
            return res.status(400).json({
                success: false,
                msg: "OTP is required. Please provide a valid OTP code."
            });
        }

        // Find the OTP record associated with the user
        const otpRecord = await UserOTP.findOne({
            where: {
                user_id: user_id
            }
        });

        // If OTP record not found, return an error
        if (!otpRecord) {
            return res.status(404).json({
                success: false,
                msg: "Account record doesn't exist or has been verified already."
            });
        }

        // If OTP has expired, delete the OTP record and return an error
        if (otpRecord.expires_at < new Date()) {
            await UserOTP.destroy({
                where: {
                    user_id: user_id
                }
            });
            return res.status(400).json({
                success: false,
                msg: "The code has expired."
            });
        }

        // Compare the provided OTP with the hashed OTP from the database
        const isMatch = await bcrypt.compare(otp, otpRecord.otp_code);
        //console.log(isMatch);

        // If OTPs don't match, return an error
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                msg: "Invalid OTP. Please try again."
            });
        } 

        // Update the user's email verification status in the database
        await User.update({verified: true}, {
            where: {
                user_id: user_id
            }
        });

        // Delete the OTP record from the database
        await UserOTP.destroy({
            where: {
                user_id: user_id
            }
        });

        // Return a sucess message,along with links for actions (HATEOAS)
        res.status(200).json({
            success: true,
            msg: "User's email successfully verified",
            links: [
                { "rel": "self", "href": `/user/${user_id}`, "method": "GET" },
                { "rel": "delete", "href": `/user/${user_id}`, "method": "DELETE" },
                { "rel": "modify", "href": `/user/${user_id}`, "method": "PATCH" },
            ]
        });
    }
    catch (err) {
        // If an error occurs, return a 500 response with an error message
        return res.status(500).json({
                success: false, 
                msg: err.message || "Some error occurred while verifing the user's email."
            });
    };
};

/**
 * Resends the email verification for a user account.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.resendEmail = async (req, res) => {
    try {
        const { user_id, email } = req.body;

        // Delete the OTP record from the database
        await UserOTP.destroy({
            where: {
                user_id: user_id
            }
        });
        
        // Call sendOTPVerificationEmail function to resend the verification email
        sendOTPVerificationEmail(user_id, email, res);
    }
    catch (err) {
        // If an error occurs, return a 500 response with an error message
        return res.status(500).json({
                success: false, 
                msg: err.message || "Some error occurred while verifing the user's email."
            });
    };
};


/**
 * Logs in a user.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.login = async (req, res) => {
    try {
        // Finding the user with the provided email
        const user = await User.findOne(
            { 
                where: { 
                    email: req.body.email 
                } 
            });
        
        // If user doesn't exist, return 400 Bad Request status with an error message
        if (!user) {
            return res.status(400).json({
                success: false,
                msg: 'Invalid credentials'
            });
        }

        // Comparing the provided password with the hashed password stored in the database
        const match = await bcrypt.compare(req.body.password, user.password);
        
        // If passwords match, generate JWT token and return it with 200 OK status
        if (match) {
            const token = jwt.sign(
                {
                    email: user.email,
                    type: user.type,
                    user_id: user.user_id
                }, 
                    process.env.JWT_KEY, 
                {
                    expiresIn: '1h'
                }
            );
            return res.status(200).json({
                success: true,
                msg: 'Auth successful',
                accessToken: token
            });
        } else {
            // If passwords don't match, return 400 Bad Request status with an error message
            return res.status(400).json({
                success: false,
                msg: 'Invalid credentials'
            });
        }
    } catch (err) {
        // If an error occurs, return 500 Internal Server Error status with an error message
        res.status(500).json({
            error: err.msg || 'Something went wrong. Please try again later'
        });
    }
};

/**
 * Handle the forgot password request.
 * This function sends a password reset email to the user with a unique token.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.forgotPassword = async (req, res) => {
    try {
        // Finding the user with the provided email
        const user = await User.findOne(
            { 
                where: { 
                    email: req.body.email 
                } 
            });
        
        // If user doesn't exist, return 404 Not Found status with an error message
        if (!user) {
            return res.status(404).json({
                msg: 'The user was not found'
            });
        }

        const token = crypto.randomBytes(Math.ceil(128 / 2)).toString('hex').slice(0, 128);
        
        // Construct the reset URL
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${token}`

        /// Read the email template from file
        const emailTemplate = fs.readFileSync('./html/email_forgot_password.html', 'utf8');

        // Replace the placeholder {{resetUrl}} with the actual reset URL in the email template
        const emailBody = emailTemplate.replace('{{resetUrl}}', resetUrl);  

        // Configure email options
        const mailOptions = {
            from: process.env.AUTH_EMAIL,
            to: req.body.email,
            subject: "Password Reset Request",
            html: emailBody
        };

        // Delete any existing password reset tokens for the user
        await db.user_password_token.destroy({
            where: {
                user_id: user.user_id
            }
        });

        // Save the token to the database, along with user_id and expiration time
        await db.user_password_token.create({
            user_id: user.user_id,
            token: token,
            created_at: new Date(),
            expires_at: new Date(Date.now() + 3600 * 1000) // 1 hour expiration
        });


        // Send the email using nodemailer transporter
        await transporter.sendMail(mailOptions);

        // Return a success message
        res.status(200).json({
            success: true,
            msg: "Reset password email sent",
        });

        
    } catch (err) {
        // console.log(err);
        // If an error occurs, return 500 Internal Server Error status with an error message
        res.status(500).json({
            error: err.msg || 'Some error occurred while sending the reset password email.'
        });
    }
};

/**
 * Resets the password associated with a user account using the provided OTP.
 * 
 * @param {Object} req - The request object containing the token in the params and the new password in the body.
 * @param {Object} res - The response object.
 */
exports.resetPassword = async (req, res) => {
    try {
        // Extract password and confirmPassword from request body
        const {password, confirmPassword } = req.body;

        // Find the password token record associated with the user
        const passwordTokenRecord = await db.user_password_token.findOne({
            where: {
                token: req.params.token
            }
        });

        // If password token record not found, return an error
        if (!passwordTokenRecord) {
            return res.status(400).json({
                success: false,
                msg: "Password token record not found or has already been used."
            });
        }

        // If password token has expired, delete the password token record and return an error
        if (passwordTokenRecord.expires_at < new Date()) {
            await db.user_password_token.destroy({
                where: {
                    user_id: passwordTokenRecord.user_id
                }
            });
            return res.status(400).json({
                success: false,
                msg: "The password token has expired."
            });
        }

        // Check if passwords match
        if (!(password === confirmPassword)) {
            return res.status(400).json({
                msg: 'Passwords do not match'
            });
        }

        // Hash the password before saving it to the database
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user's password in the database
        await db.user.update({password: hashedPassword}, {
            where: {
                user_id: passwordTokenRecord.user_id
            }
        });

        // Delete the password token record from the database
        await db.user_password_token.destroy({
            where: {
                user_id: passwordTokenRecord.user_id
            }
        });

        // Return a success message
        res.status(200).json({
            success: true,
            msg: "Password sucessfully reset",
        });
    }
    catch (err) {
        // console.log(err);
        // If an error occurs, return a 500 response with an error message
        return res.status(500).json({
                success: false, 
                msg: err.message || "Some error occurred while reseting the password."
            });
    };
};

/**
 * Retrieves a user by their ID.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.findOneCurrent = async (req, res) => {
    try {
        // Retrieve the user ID from the token in the header
        const userId = req.userData.user_id;

        let user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] }, // Exclude the password attribute
            include: [
                {
                    model: db.language,
                    attributes: ["language"],
                    as: 'language',
                    through: { attributes: ["language_id"] } // Specifing atributes from the user_language table
                }, 
                {
                    model: db.badge,
                    as: 'badge',
                    attributes: ["title", "description", "url_badge"],
                    through: { attributes: ["badge_id"] } // Specifing atributes from the user_badge table
                }, 
                {
                    model: db.property,
                    attributes: ["property_id"],
                    as: 'favoriteProperty',
                    through: { attributes: [] } // Specifing atributes from the user_badge table
                }, 
            ]
        });

        // If the user is not found, return a 404 response
        if (!user) {
            return res.status(404).json({
                success: false, 
                msg: `User with ID ${userId} not found.`
            });
        }

        // Count the total number of properties owned by the user
        const totalOwnedProperties = await db.property.count({ where: { owner_id: userId } });
        
        // Count the total number of properties rented by the user
        const totalRentedProperties = await db.booking.count({ where: { guest_id: userId } });

        // Determine the user type based on the ownership and rental status
        let userType;
        if (totalOwnedProperties > 0 && totalRentedProperties > 0) {
            userType = 'Owner/Guest';
        } else if (totalOwnedProperties > 0) {
            userType = 'Owner';
        } else if (totalRentedProperties > 0) {
            userType = 'Guest';
        } else {
            userType = 'User';
        }

        // Find all properties owned by the user
        const userProperties = await db.property.findAll({
            where: { owner_id: userId }
        });

        // Initialize variables to calculate total property reviews and sum of ratings
        let totalPropertyReviews = 0;
        let totalRatings = 0;

        // Loop through each property owned by the user
        for (const property of userProperties) {
            // Find and count bookings for the current property with reviews (number_stars not null)
            const { count: totalRentedProperties, rows: bookingsWithReviews } = await db.booking.findAndCountAll({
                where: { 
                    property_id: property.property_id,
                    number_stars: { [Op.ne]: null } 
                }
            });
            // Add the count of reviews for the current property to the total
            totalPropertyReviews += totalRentedProperties;
            // Calculate sum of ratings for the current property
            totalRatings += bookingsWithReviews.reduce((acc, booking) => acc + booking.number_stars, 0);
        }

        // Calculate average rating for properties owned by the user
        const averagePropertyRating = totalPropertyReviews > 0 ? totalRatings / totalPropertyReviews : 0;
        
        // Count the total number of reviews made by the user as a guest
        const totalGuestReviews = await db.booking.count({
            where: { 
                guest_id: userId,
                number_stars: { [Op.ne]: null } 
            }
        });

        // Fetch all countries the user has booked properties in
        const userBookings = await db.booking.findAll({
            where: { guest_id: userId },
            include: [{
                model: db.property,
                attributes: ["country"],
            }],
        });

        // Initialize an empty list to store unique countries
        const uniqueCountriesList = [];

        // Iterate over the bookings to extract the countries and add them to the list
        userBookings.forEach(booking => {
            const country = booking.Property.country;
            // Check if the country is not already in the list before adding it
            if (!uniqueCountriesList.includes(country)) {
                uniqueCountriesList.push(country);
            }
        });

        // Get the number of unique countries by counting the length of the list
        const numberOfUniqueCountries = uniqueCountriesList.length;

        // Add the user type to the user object
        user.dataValues.userType = userType;
        // Add total property reviews to the user object
        user.dataValues.totalPropertyReviews = totalPropertyReviews;
        // Add average property rating to the user object
        user.dataValues.averagePropertyRating = averagePropertyRating;
        // Add total guest reviews to the user object
        user.dataValues.totalGuestReviews = totalGuestReviews;
        // Add total rented properties to the user object
        user.dataValues.totalRentedProperties = totalRentedProperties;
        // Add total owned properties to the user object
        user.dataValues.totalOwnedProperties = totalOwnedProperties;
        // Add total favorite properties to the user object
        user.dataValues.totalFavoriteProperties = user.favoriteProperty.length
        // Add total unique countries to the user object
        user.dataValues.totalUniqueCountries = numberOfUniqueCountries


        // If user is found, return it along with links for actions (HATEOAS)
        res.status(200).json({ 
            success: true, 
            data: user,
            links:[
                { "rel": "self", "href": `/users/${userId}`, "method": "GET" },
                { "rel": "delete", "href": `/users/${userId}`, "method": "DELETE" },
                { "rel": "modify", "href": `/users/${userId}`, "method": "PATCH" },
            ]
        });

    }
    catch (err) {
        console.log(err);
        // If an error occurs, return a 500 response with an error message
        return res.status(500).json({ 
            success: false, 
            msg: `Error retrieving user with ID ${userId}.`
        });
        
    };
};

/**
 * Retrieves properties belonging to a specific owner by their ID.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.findProperties = async (req, res) => {
    try {
        // Extract owner ID from request parameters
        const owner_id = req.params.user_id;

        // Find properties by owner ID
        let properties = await Property.findAll({ 
            where: { owner_id: owner_id  },
            include: [
                {
                    model: db.paymentMethod,
                    as: 'paymentMethod',
                    attributes: ["description"],
                    through: { attributes: ["payment_method_id"] } // Specifing atributes from the payment_method table
                }, 
                {
                    model: db.facility,
                    as: 'facilities',
                    attributes: ["name"],
                    through: { attributes: ["facility_id"] } // Specifing atributes from the property_facility table
                }, 
                {
                    model: db.photo,
                    as: 'photos',
                    attributes: ["url_photo"],
                    //through: { attributes: ["facility_id"] } // Specifing atributes from the property_facility table
                },
                {
                    model: db.booking,
                    as: 'rating',
                    attributes: [
                        "number_stars", 
                        "comment", 
                        //[Sequelize.fn('AVG', Sequelize.col('number_stars')), 'average_rating']
                    ],
                    //through: { attributes: ["facility_id"] } // Specifing atributes from the property_facility table
                },
            ],
        });

        // If no properties found for the owner, return a 404 response
        if (properties.length === 0) {
            return res.status(404).json({
                success: false, 
                msg: `Properties for owner with ID ${owner_id} not found.`
            });
        }

        // Add links to each property
        properties = properties.map(property => {
            const plainProperty = property.get({ plain: true }); // Convert to plain JavaScript object
            plainProperty.links = [
                { "rel": "self", "href": `/properties/${plainProperty.property_id}`, "method": "GET" },
                { "rel": "delete", "href": `/properties/${plainProperty.property_id}`, "method": "DELETE" },
                { "rel": "modify", "href": `/properties/${plainProperty.property_id}`, "method": "PATCH" }
            ];
            return plainProperty;
        });

        // If properties are found, return them along with links for actions (HATEOAS)
        res.status(200).json({ 
            success: true, 
            data: properties,
            links: [
                { "rel": "add-property", "href": `/properties`, "method": "POST" }
            ]
        });

    }
    catch (err) {
        // If an error occurs, return a 500 response with an error message
        return res.status(500).json({ 
            success: false, 
            msg: `Error retrieving properties for owner with ID ${req.params.user_id}.`
        });
        
    };
};

/**
 * Retrieves properties belonging to a specific owner by their ID.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.findPropertiesCurrent = async (req, res) => {
    try {
        // Extract owner ID from request parameters
        const owner_id = req.userData.user_id;

        // Find properties by owner ID
        let properties = await Property.findAll({ 
            where: { owner_id: owner_id  },
            include: [
                {
                    model: db.paymentMethod,
                    as: 'paymentMethod',
                    attributes: ["description"],
                    through: { attributes: ["payment_method_id"] } // Specifing atributes from the payment_method table
                }, 
                {
                    model: db.facility,
                    as: 'facilities',
                    attributes: ["name"],
                    through: { attributes: ["facility_id"] } // Specifing atributes from the property_facility table
                }, 
                {
                    model: db.photo,
                    as: 'photos',
                    attributes: ["url_photo"],
                    //through: { attributes: ["facility_id"] } // Specifing atributes from the property_facility table
                },
                {
                    model: db.booking,
                    as: 'rating',
                    attributes: [
                        "number_stars", 
                        "comment", 
                        //[Sequelize.fn('AVG', Sequelize.col('number_stars')), 'average_rating']
                    ],
                    //through: { attributes: ["facility_id"] } // Specifing atributes from the property_facility table
                },
            ],
        });

        // If no properties found for the owner, return a 404 response
        if (properties.length === 0) {
            return res.status(404).json({
                success: false, 
                msg: `Properties for owner with ID ${owner_id} not found.`
            });
        }

        // Add links to each property
        properties = properties.map(property => {
            const plainProperty = property.get({ plain: true }); // Convert to plain JavaScript object
            plainProperty.links = [
                { "rel": "self", "href": `/properties/${plainProperty.property_id}`, "method": "GET" },
                { "rel": "delete", "href": `/properties/${plainProperty.property_id}`, "method": "DELETE" },
                { "rel": "modify", "href": `/properties/${plainProperty.property_id}`, "method": "PATCH" }
            ];
            return plainProperty;
        });

        // If properties are found, return them along with links for actions (HATEOAS)
        res.status(200).json({ 
            success: true, 
            data: properties,
            links: [
                { "rel": "add-property", "href": `/properties`, "method": "POST" }
            ]
        });

    }
    catch (err) {
        //console.log(err);
        // If an error occurs, return a 500 response with an error message
        return res.status(500).json({ 
            success: false, 
            msg: `Error retrieving properties for owner with ID ${owner_id}.`
        });
        
    };
};


/**
 * Retrieves bookings belonging to a specific guest by their ID.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.findBookingsCurrent = async (req, res) => {
    try {
        // Extract guest ID from request parameters
        const guest_id = req.userData.user_id;

        // Defining the base where clause with the guest ID
        let whereClause = { guest_id: guest_id };

        // Checking the value of the 'status' query parameter
        if (req.query.status === 'upcoming') {
            // If the status is 'upcoming', set the condition to get bookings with check_out_date
            // greater than or equal to the current date (future bookings)
            whereClause.check_out_date = {
                [Op.gte]: new Date() 
            };
        } else if (req.query.status === 'past') {
            // If the status is 'past', set the condition to get bookings with check_out_date
            // less than the current date (past bookings)
            whereClause.check_out_date = {
                [Op.lt]: new Date() 
            };
        }

        // Find bookings by owner ID
        let bookings = await Booking.findAll({ 
            where: whereClause,
            include: {
                model: db.property,
                include: [
                    {
                        model: db.photo,
                        as: 'photos'
                    },
                ]
            }
        });

        // If no bookings found for the owner, return a 404 response
        if (bookings.length === 0) {
            return res.status(404).json({
                success: false, 
                msg: `Booking for guest with ID ${guest_id} not found.`
            });
        }

        // Add links to each booking
        bookings = bookings.map(booking => {
            const plainBooking = booking.get({ plain: true }); // Convert to plain JavaScript object
            plainBooking.links = [
                { "rel": "self", "href": `/bookings/${plainBooking.booking_id}`, "method": "GET" },
                { "rel": "delete", "href": `/bookings/${plainBooking.booking_id}`, "method": "DELETE" },
                { "rel": "modify", "href": `/bookings/${plainBooking.booking_id}`, "method": "PATCH" }
            ];
            return plainBooking;
        });

        // If booking are found, return them along with links for actions (HATEOAS)
        res.status(200).json({ 
            success: true, 
            data: bookings,
            links: [
                { "rel": "add-booking", "href": `/bookings`, "method": "POST" }
            ]
        });

    }
    catch (err) {
        // If an error occurs, return a 500 response with an error message
        return res.status(500).json({ 
            success: false, 
            msg: `Error retrieving bookings for guest with ID ${guest_id}.`
        });
        
    };
};

/**
 * Retrieves favorite properties belonging to the current user.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.findFavoritePropertiesCurrent = async (req, res) => {
    try {
        // Extract user ID from request parameters
        const user_id = req.userData.user_id;

        // Find favorite properties by user ID
        let favorites = await User.findAll({ 
            where: { user_id: user_id },
            include: [
                {
                    model: db.property,
                    as: 'favoriteProperty',
                    include: [
                        {
                            model: db.photo,
                            as: 'photos'
                        },
                    ]
                },
            ],
            attributes: [] // Exclude other attributes of the user

        });

        // If no favorite properties found for the user, return a 404 response
        if (favorites[0].favoriteProperty.length === 0) {
            return res.status(404).json({
                success: false, 
                msg: `Favorite properties for user with ID ${user_id} not found.`
            });
        }
        
        // If favorite properties are found, return them along with links for actions (HATEOAS)
        res.status(200).json({ 
            success: true, 
            data: favorites,
            links: [
                { "rel": "add-favorite", "href": `/users/current/favorites`, "method": "POST" }
            ]
        });

    }
    catch (err) {
        console.log(err);
        // If an error occurs, return a 500 response with an error message
        return res.status(500).json({ 
            success: false, 
            msg: `Error retrieving favorite properties for user with ID ${req.userData.user_id}.`
        });
        
    };
};

/**
 * Adds a property to the favorites.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.addFavorite = async (req, res) => {
    try {
        // Find the user by their ID
        const user = await User.findByPk(req.userData.user_id, 
            {
                include: [
                    {
                        model: db.property,
                        as: 'favoriteProperty'  // Include the user's favorite properties
                    }
                ]
            }
        );

        // Find the property by its ID
        const property = await Property.findByPk(req.body.property_id);

        // Check if the property is already in the user's favorites
        const propertyAlreadyFavorited = user.favoriteProperty.some(property => property.property_id === req.body.property_id);

        if (propertyAlreadyFavorited) {
            // If the property is already in the favorite list, return a 404 response
            return res.status(400).json({ 
                success: false, 
                msg: `Property with ID ${req.body.property_id} is already in favorites.` 
            });
        }

        // Check if the property exists
        if (!property) {
            // If the property does not exist, return a 404 response
            return res.status(404).json({ 
                success: false, 
                msg: `Property with ID ${req.body.property_id} not found.` });
        }

        // Count the number of favorite properties of the user
        const favoritePropertiesCount = user.favoriteProperty.length + 1;
        //console.log(favoritePropertiesCount);

        // Define badge IDs
        const favoriteFinderBadge = 7;           // Badge when user adds 1st property to the favorites
        const favoriteCollectorBadge = 8;        // Badge when user adds 3rd property to the favorites
        const favoriteConnoisseurBadge = 9;      // Badge when user adds 5ft property to the favorites

        // Check the favorite properties count and update badges accordingly
        if (favoritePropertiesCount === 1) {
            // Add the finder badge
            await user.addBadge(favoriteFinderBadge);
        } else if (favoritePropertiesCount === 3) {
            // Remove the finder badge
            await user.removeBadge(favoriteFinderBadge);
            // Add the collector badge
            await user.addBadge(favoriteCollectorBadge);
        } else if (favoritePropertiesCount  === 5) {
            // Remove the collector badge
            await user.removeBadge(favoriteCollectorBadge);
            // Add the connoisseur badge
            await user.addBadge(favoriteConnoisseurBadge);
        } 

        // Add the property to the user's favorite properties (Magic Method from the N:N relation)
        await user.addFavoriteProperty(property);

        // Return a success message along with status code 201 (Created)
        res.status(201).json({
            success: true,
            msg: "Property added to the favorites sucessfully.",
        });
    }
    catch (err) {
        // If a validation error occurs, return a 400 response with error messages
        if (err instanceof ValidationError)
            res.status(400).json({ 
                success: false, 
                msg: err.errors.map(e => e.message) });
        else
            // If an error occurs, return a 500 response with the error message
            return res.status(500).json({
                success: false, 
                msg: err.message || "Some error occurred while adding property to the favorites."
            });
    };
};

/**
 * Remove a property from the favorites.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.deleteFavorite = async (req, res) => {
    try {
        // Find the user by their ID
        const user = await User.findByPk(req.userData.user_id);
        // Find the property by its ID
        const property = await Property.findByPk(req.params.property_id);

        // Verifying if the property is in the user's favorite list (Magic Method from the N:N relation)
        const isFavorite = await user.hasFavoriteProperty(property);

        // Check if the property exists
        if (!property) {
            // If the property does not exist, return a 404 response
            return res.status(404).json({ 
                success: false, 
                msg: `Property with ID ${req.params.property_id} not found.` });
        }

        // If the property is not in the favorites list, return a 404 response
        if (!isFavorite) {
            return res.status(404).json({
                success: false,
                msg: `Property with ID ${req.params.property_id} is not in the user's favorites.`
            });
        }

        // Check if the property exists
        if (!property) {
            // If the property does not exist, return a 404 response
            return res.status(404).json({ 
                success: false, 
                msg: `Property with ID ${req.params.property_id} not found.` });
        }

        // Remove the property to the user's favorite properties (Magic Method from the N:N relation)
        await user.removeFavoriteProperty(property);

        // Return a success message along with status code 200 (Ok)
        res.status(200).json({
            success: true,
            msg: "Property removed from favorites successfully.",
        });
    }
    catch (err) {
        // If an error occurs, return a 500 response with the error message
        return res.status(500).json({
            success: false, 
            msg: err.message || "Some error occurred while removing property from favorites."
        });
    };
};






  
  
