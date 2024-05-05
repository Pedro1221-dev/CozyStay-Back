const db = require("../models/index.js");
// Define a variable User to represent the User model in the database
const User = db.user;

//"Op" necessary for LIKE operator
const { Op } = require('sequelize');

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

        // Retrieve all users from the database
        let users = await User.findAll();

        // Destructure query parameters
        const { limit: queryLimit, page: queryPage, name, blocked} = req.query;

        // Pagination information
        // Calculate the total number of users
        const totalUsers = users.length;
        // Set the limit per page, defaulting to 10 if not specified in the query parameters
        const limit = queryLimit ? parseInt(queryLimit) : 10;
        // Calculate the total number of pages based on the total number of users and the limit per page
        const totalPages = Math.ceil(totalUsers / limit);
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

        // Handle out-of-range page number
        if (currentPage > totalPages) {
            return res.status(404).json({ message: "No more results available" });
        }

        // Validate query parameters
        if (isNaN(limit) || limit <= 5) {
            return res.status(400).json({ message: "Limit must be a positive integer, greater than 5" });
        }

        if (isNaN(currentPage) || currentPage < 1) {
            return res.status(400).json({ message: "Page must be 1 or a positive integer" });
        }

        // Previous and next page links
        // Calculate the page number for the previous page
        const previousPage = currentPage > 1 ? currentPage - 1 : null;
        // Calculate the page number for the next page
        // If currentPage is less than totalPages, set nextPage to currentPage + 1
        // If currentPage is 1, set nextPage to 2
        // Otherwise, set nextPage to null
        const nextPage = currentPage < totalPages ? currentPage + 1 : (currentPage === 1 ? 2 : null);

        // Find users with pagination and search options
        users = await User.findAll({
            limit: limit,
            offset: offset,
            ...searchOptions,
        });

        // Handle no results found
        if (users.length === 0) {
            return res.status(400).json({ message: "No results found" });
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
          }
        ]
      });
        
    } catch (error) {
        // If an error occurs, respond with an error status code and message
        res.status(500).json({ message: error.message });
    }
};
  
  