// Importing the bcrypt library
const bcrypt = require('bcrypt');
// Importing the jsonwebtoken library
const jwt = require('jsonwebtoken');
// Importing all the models
const db = require("../models/index.js");
// Define a variable User to represent the User model in the database
const User = db.user;
// Define a variable Language to represent the User model in the database
//const Language = db.language;
// Define a variable Badge to represent the User model in the database
//const Badge = db.badge;
// Define a variable Property to represent the User model in the database
//const Property = db.property;

//"Op" necessary for LIKE operator
const { Op, ValidationError, UniqueConstraintError } = require('sequelize');

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
            return res.status(400).json({ message: "O parâmetro 'blocked' deve ser um valor booleano ('0' for false and '1' for true)"});
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
                    as: 'favorite-properties',
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
            return res.status(400).json({ message: "No results found" });
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
        // Find the user by their ID
        //let user = await User.findByPk(req.params.user_id);

        let user = await User.findByPk(req.params.user_id, {
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
                    attributes: ["title", "description"],
                    through: { attributes: ["badge_id"] } // Specifing atributes from the user_badge table
                }, 
                {
                    model: db.property,
                    attributes: ["property_id"],
                    as: 'favorite-properties',
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
                { "rel": "modify", "href": `/users/${user.user_id}`, "method": "PUT" },
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
 * Deletes a user by their ID.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
*/
exports.delete = async (req, res) => {
    try {
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
            return res.status(404).json({
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
 * Creates a new user.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.create = async (req, res) => {
    try {
        // Extracts the password property from the request body
        const { password } = req.body;

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
        
        // Save the user in the database
        let newUser = await User.create(req.body);

        // Return a sucess message,along with links for actions (HATEOAS)
        res.status(201).json({
            success: true,
            msg: "User successfully created.",
            links: [
                { "rel": "self", "href": `/user/${newUser.user_id}`, "method": "GET" },
                { "rel": "delete", "href": `/user/${newUser.user_id}`, "method": "DELETE" },
                { "rel": "modify", "href": `/user/${newUser.user_id}`, "method": "PUT" },
            ]
        });
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
        
        // If user doesn't exist, return 401 Unauthorized status with an error message
        if (!user) {
            return res.status(401).json({
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
                    expiresIn: '20m'
                }
            );
            return res.status(200).json({
                msg: 'Auth successful',
                accessToken: token
            });
        } else {
            // If passwords don't match, return 401 Unauthorized status with an error message
            return res.status(401).json({
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
                    attributes: ["title", "description"],
                    through: { attributes: ["badge_id"] } // Specifing atributes from the user_badge table
                }, 
                {
                    model: db.property,
                    attributes: ["property_id"],
                    as: 'favorite-properties',
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

        // If user is found, return it along with links for actions (HATEOAS)
        res.status(200).json({ 
            success: true, 
            data: user,
            links:[
                { "rel": "self", "href": `/users/${userId}`, "method": "GET" },
                { "rel": "delete", "href": `/users/${userId}`, "method": "DELETE" },
                { "rel": "modify", "href": `/users/${userId}`, "method": "PUT" },
            ]
        });

    }
    catch (err) {
        // If an error occurs, return a 500 response with an error message
        return res.status(500).json({ 
            success: false, 
            msg: `Error retrieving user with ID ${userId}.`
        });
        
    };
};



  
  