const db = require("../models/index.js");
// Define a variable Property to represent the Property model in the database
const Property = db.property;
// Define a variable PaymentMethod to represent the User model in the database
const PaymentMethod = db.paymentMethod;
// Define a variable Facility to represent the User model in the database
const Facility = db.facility;
// Define a variable Photo to represent the User model in the database
const Photo = db.photo;

//"Op" necessary for LIKE operator
const { Op, ValidationError, UniqueConstraintError, Sequelize } = require('sequelize');

/**
 * Retrieves a list of proprieties with optional pagination, filtering and sorting.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.findAll = async (req, res) => {
    try {
        // Initialize search options object
        const searchOptions = {};
 
        // Destructure query parameters
        const { 
            limit: queryLimit, 
            page: queryPage, 
            destination, 
            number_guests_allowed, 
            price, 
            number_bedrooms, 
            number_beds, 
            number_bathrooms,
            typology,
            sort,
            direction,
        } = req.query;

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
        
        // Initializing variables to store minimum price and maximum price
        let minPrice, maxPrice;
        if (price) {
            // Split the price parameter into minPrice and maxPrice based on a delimiter ('-')
            const priceRange = price.split('-').map(val => parseInt(val.trim()));
            // If both minPrice and maxPrice are provided
            if (priceRange.length === 2) {
                minPrice = priceRange[0];
                maxPrice = priceRange[1];
            } else if (priceRange.length === 1) {
                // If only one value is provided, consider it as maxPrice and set minPrice as undefined
                minPrice = undefined;
                maxPrice = priceRange[1];
            }
        }

        // Use minPrice and maxPrice to construct the price range condition and then merging it with the existing 'where' conditions
        if (minPrice || maxPrice) {
            let priceCondition = {};

            if (minPrice) {
                priceCondition[Op.gte] = minPrice; // Greater than or equal to minPrice
            }

            if (maxPrice) {
                priceCondition[Op.lte] = maxPrice; // Less than or equal to maxPrice
            }

            // Merge the existing 'where' conditions with the new 'price' range condition
            searchOptions.where = { 
                ...searchOptions.where,
                price: priceCondition
            };
        }

        // Function to add search conditions based on parameters
        const addSearchCondition = (param, field) => {
            if (param) {
                // If parameter exists, add it to the search options
                searchOptions.where = {
                    ...searchOptions.where,
                    [field]: { [Op.gte]: parseInt(param) } // Using Op.gte to find properties with the specified field greater than or equal to the provided value
                };
            }
        };

        // Add search conditions for number_guests_allowed, number_bedrooms, number_beds, and number_bathrooms
        addSearchCondition(number_guests_allowed, 'number_guests_allowed');
        addSearchCondition(number_bedrooms, 'number_bedrooms');
        addSearchCondition(number_beds, 'number_beds');
        addSearchCondition(number_bathrooms, 'number_bathrooms');

        // Add 'typology' query parameter to search options if provided
        if (typology) {
            const selectedTypologies = typology.split(',').map(t => t.trim());
            searchOptions.where = { 
                ...searchOptions.where, 
                typology: selectedTypologies 
            };
        }

        // Add 'sort' query parameter to search options if provided
        if (sort) {
            // Verifies if direction was specified, if it wasn't, use default one 'ASC'
            const selectedDirection = direction ? direction.toUpperCase() : 'ASC';

            searchOptions.order = [['property_id', selectedDirection]];
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
            include: [
                {
                    model: db.paymentMethod,
                    as: 'payment-method',
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
                    attributes: ["url_photo"],
                    //through: { attributes: ["facility_id"] } // Specifing atributes from the property_facility table
                },
                {
                    model: db.rating,
                    attributes: [
                        "number_stars", 
                        "comment", 
                        //[Sequelize.fn('AVG', Sequelize.col('number_stars')), 'average_rating']
                    ],
                    //through: { attributes: ["facility_id"] } // Specifing atributes from the property_facility table
                },
            ]
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

        // Handle no results found
        if (properties.length === 0) {
            return res.status(400).json({ message: "No results found" });
        }

        // Handle out-of-range page number
        if (currentPage > totalPages) {
            return res.status(404).json({ message: "No more results available" });
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


/**
 * Retrieves a propriety by their ID.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.findOne = async (req, res) => {
    try {
        // Find the property by their ID
        let property = await Property.findByPk(req.params.property_id, {
            include: [
                {
                    model: db.paymentMethod,
                    as: 'payment-method',
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
                    attributes: ["url_photo"],
                    //through: { attributes: ["facility_id"] } // Specifing atributes from the property_facility table
                },
                {
                    model: db.rating,
                    attributes: [
                        "number_stars", 
                        "comment", 
                        //[Sequelize.fn('AVG', Sequelize.col('number_stars')), 'average_rating']
                    ],
                    //through: { attributes: ["facility_id"] } // Specifing atributes from the property_facility table
                },
            ]
        });

        // If the property is not found, return a 404 response
        if (!property) {
            return res.status(404).json({
                success: false, 
                msg: `Property with ID ${req.params.property_id} not found.`
            });
        }

        // If property is found, return it along with links for actions (HATEOAS)
        res.status(200).json({ 
            success: true, 
            data: property,
            links:[
                { "rel": "self", "href": `/properties/${property.property_id}`, "method": "GET" },
                { "rel": "delete", "href": `/properties/${property.property_id}`, "method": "DELETE" },
                { "rel": "modify", "href": `/properties/${property.property_id}`, "method": "PUT" },
            ]
        });

    }
    catch (err) {
        // If an error occurs, return a 500 response with an error message
        return res.status(500).json({ 
            success: false, 
            msg: `Error retrieving property with ID ${req.params.property_id}.`
        });
        
    };
};

/**
 * Deletes a property by their ID.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
*/
exports.delete = async (req, res) => {
    try {
        // Attempt to delete the property with the specified ID
        let result = await Property.destroy({ 
            where: { property_id: req.params.property_id}
        });


        // Check if the property was successfully deleted
        if (result == 1) {
            // Return a success message if the property was found and deleted
            return res.status(200).json({
                success: true, 
                msg: `Property with id ${req.params.property_id} was successfully deleted!`
            });
        }

         // If the property was not found, return a 404 response
        return res.status(404).json({
            success: false, 
            msg: `Property with ID ${req.params.property_id} not found.`
        });
    }
    catch (err) {
         // If an error occurs, return a 500 response with an error message
        res.status(500).json({
            success: false, 
            msg: `Error deleting property with ID ${req.params.property_id}.`
        });
    };
};

/**
 * Update a property by their ID.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.update = async (req, res) => {
    try {
        // Find the property by their ID
        let property = await Property.findByPk(req.params.property_id);

        // If the property is not found, return a 404 response
        if (!property) {
            return res.status(404).json({
                success: false, msg: `Property with ID ${req.params.property_id} not found.`
            });
        }

        // Attempt to update the property with the provided data
        let affectedRows = await Property.update(
            req.body, { 
                where: { 
                    property_id: req.params.property_id
                } 
            });

        // If no rows were affected, return a success message indicating no updates were made
        if(affectedRows[0] === 0){
            return res.status(404).json({
                success: true, 
                msg: `No updates were made to property with ID ${req.params.property_id}.`
            });
        }

        // Return a success message indicating the property was updated successfully
        return res.json({
            success: true,
            msg: `Property with ID ${req.params.property_id} was updated successfully.`
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
            msg: `Error retrieving property with ID ${req.params.property_id}.`
        });
    };
};

/**
 * Creates a new property.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.create = async (req, res) => {
    try {
        // Extracts the properties from the request body
        // const { owner_id, title, city, country, address, number_bedrooms, number_beds, number_bathrooms, number_guests_allowed, description, typology, price} = req.body;
        
        // Save the property in the database
        let newProperty = await Property.create(req.body);

        // Return a sucess message,along with links for actions (HATEOAS)
        res.status(201).json({
            success: true,
            msg: "Property sucessfully sent to validation.",
            /* links: [
                { "rel": "self", "href": `/user/${newUser.user_id}`, "method": "GET" },
                { "rel": "delete", "href": `/user/${newUser.user_id}`, "method": "DELETE" },
                { "rel": "modify", "href": `/user/${newUser.user_id}`, "method": "PUT" },
            ] */
        });
    }
    catch (err) {
        // If a validation error occurs, return a 400 response with error messages
        if (err instanceof ValidationError)
            res.status(400).json({ 
                success: false, 
                msg: err.errors.map(e => e.message) });
        // If an error occurs, return a 500 response with an error message
        else
            res.status(500).json({
                success: false, 
                msg: err.message || "Some error occurred while creating the property."
            });
    };
};


