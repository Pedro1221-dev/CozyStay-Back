const db = require("../models/index.js");
// Define a variable Property to represent the Property model in the database
const Property = db.property;

//"Op" necessary for LIKE operator
//const { Op, ValidationError, UniqueConstraintError } = require('sequelize');


exports.findAll = async (req, res) => {
    try {
        // Initialize search options object
        const searchOptions = {};
 
        // Destructure query parameters
        const { limit: queryLimit, page: queryPage, destination} = req.query;

        // Pagination information
        // Set the limit per page, defaulting to 10 if not specified in the query parameters
        const limit = queryLimit ? parseInt(queryLimit) : 10;
        // Determine the current page, defaulting to 1 if not specified in the query parameters
        const currentPage = queryPage ? parseInt(queryPage) : 1;
        // Calculate the offset for pagination, which determines the starting index of the properties to be fetched for the current page
        const offset = (currentPage - 1) * limit;

        // Add 'destination' query parameter to search options if provided
        if (destination) {
            // Split the destination into city and country
            const [city, country] = destination.split(',').map(item => item.trim());
            
            // Create the where clause based on city and/or country
            if (city && country) {
                // If both city and country are provided, search by both
                searchOptions.where = { city: city, country: country };
            } else if (city) {
                // If only city is provided, search by city
                searchOptions.where = { city: city };
            } else if (country) {
                // If only country is provided, search by country
                searchOptions.where = { country: country };
            }
        }

        // Validate query parameters
        if (isNaN(limit) || limit <= 5) {
            return res.status(400).json({ message: "Limit must be a positive integer, greater than 5" });
        }

        if (isNaN(currentPage) || currentPage < 1) {
            return res.status(400).json({ message: "Page must be 1 or a positive integer" });
        }

        // Find properties with pagination and search options
        const properties = await Property.findAll({
            limit: limit,
            offset: offset,
            ...searchOptions,
        });

        // Calculate the total number of properties after applying pagination
        const totalProperties = await Property.count({
            where: searchOptions.where // Apply the same search options for counting
        });
        // Calculate the total number of pages based on the total number of properties and the limit per page
        const totalPages = Math.ceil(totalProperties / limit);
        // Previous and next page links
        // Calculate the page number for the previous page
        const previousPage = currentPage > 1 ? currentPage - 1 : null;
        // Calculate the page number for the next page
        // If currentPage is less than totalPages, set nextPage to currentPage + 1
        // If currentPage is 1, set nextPage to 2
        // Otherwise, set nextPage to null
        const nextPage = currentPage < totalPages ? currentPage + 1 : (currentPage === 1 ? 2 : null);

        // Handle out-of-range page number
        if (currentPage > totalPages) {
            return res.status(404).json({ message: "No more results available" });
        }

        // Handle no results found
        if (properties.length === 0) {
            return res.status(400).json({ message: "No results found" });
        }

        // Create a new array of properties with added links
        const propertiesWithLinks = properties.map(property => ({
            ...property.toJSON(), // Convert the Sequelize object to a simple JavaScript object
            links: [
                { "rel": "self", "href": `/properties/${property.property_id}`, "method": "GET" },
                { "rel": "delete", "href": `/properties/${property.property_id}`, "method": "DELETE" },
                { "rel": "modify", "href": `/properties/${property.property_id}`, "method": "PATCH" }
            ]
        }));

        // Send response with pagination and data
        res.status(200).json({ 
            success: true, 
            pagination: {
                total: totalProperties,
                pages: totalPages,
                current: currentPage,
                limit: limit
            },
            data: propertiesWithLinks,
            links: [
            { 
                "rel": "add-property", 
                "href": `/properties`, 
                "method": "POST" 
            },
            { 
                "rel": "previous-page",
                "href": `/properties?limit=${limit}&page=${previousPage}`,
                "method": "GET"
            },
            { 
                "rel": "next-page",
                "href": `/properties?limit=${limit}&page=${nextPage}`,
                "method": "GET"
            },
            { 
                "rel": "last-page",
                "href": `/properties?limit=${limit}&page=${totalPages}`,
                "method": "GET"
            },
            { 
                "rel": "first-page",
                "href": `/properties?limit=${limit}&page=1`,
                "method": "GET"
            }
            ]
        });
    } catch (err) {
        // If an error occurs, respond with an error status code and message
        res.status(500).json({ 
            success: false, 
            msg: "Some error occurred while retrieving the properties."
        });
    }
};