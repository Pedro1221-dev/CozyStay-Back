// Importing all the models
const db = require("../models/index.js");
// Define a variable Property to represent the Property model in the database
const Property = db.property;
// Define a variable PaymentMethod to represent the User model in the database
//const PaymentMethod = db.paymentMethod;
// Define a variable Facility to represent the User model in the database
//const Facility = db.facility;
// Define a variable Photo to represent the User model in the database
//const Photo = db.photo;

// Importing the uploadImage and destroy functions from the cloudinary middleware
const { uploadImage, deleteImage }  = require('../middleware/cloudinary');

//"Op" necessary for LIKE operator
const { Op, ValidationError, UniqueConstraintError, Sequelize, where } = require('sequelize');

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
            status,
            sort,
            direction,
        } = req.query;

        // Pagination information
        // Set the limit per page, defaulting to 24 if not specified in the query parameters
        const limit = queryLimit ? parseInt(queryLimit) : 24;
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

        if (status) {
            searchOptions.where = {
                ...searchOptions.where,
                status: status ? status : 'available'
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

        // Merge the existing 'where' conditions with the status atribute (return only available properties)
        /* searchOptions.where = {
            ...searchOptions.where,
            status: 'available'
        }; */

        // Find properties with pagination and search options
        const properties = await Property.findAll({
            limit: limit,
            offset: offset,
            ...searchOptions,
            attributes: ["property_id", "city", "country", "title", "price", "number_bedrooms", "number_beds"],
            include: [
                {
                    model: db.photo,
                    as: 'photos',
                    attributes: ["url_photo"],
                },
                {
                    model: db.booking, // Assuming 'rating' is a Booking model
                    as: 'rating', // Assuming 'rating' is the alias for the association
                    attributes: ["number_stars"], // Assuming 'number_stars' is the attribute for the rating
                },
            ],
        });

        // Loop through each property to calculate totalStars and numValidRatings
        for (const property of properties) {
            /// Calculate the average rating
            let totalStars = 0;
            // Counter to track the number of valid ratings
            let numValidRatings = 0; 
            for (const booking of property.rating) {
                // Check if the number of stars is not null (review was done)
                if (booking.number_stars !== null) { 
                    // If not null, add the number of stars to the total
                    totalStars += booking.number_stars;
                    // Increment the counter for valid ratings
                    numValidRatings++; 
                }
            }
            // Calculate the average rating for each property
            const averageRating = totalStars / numValidRatings;
            // Add the average rating to each property
            property.dataValues.averageRating = averageRating;
        }

        // Calculate the total number of properties after applying pagination
        const totalProperties = await Property.count({
            where: {
                ...searchOptions.where, // Merge existing search conditions
            }
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
                    as: 'photos',
                    attributes: ["url_photo"],
                },
                {
                    model: db.booking,
                    as: 'rating',
                    attributes: ["number_stars", "comment", "rating_date"],
                    where: {
                        number_stars: {
                            [Sequelize.Op.not]: null
                        }
                    },
                    include: [
                        { 
                            model: db.user,
                            attributes: ["user_id", "name", "url_avatar", "nationality"],
                        }
                    ]

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

        // Find the owner of the property
        let owner = await db.user.findByPk(property.owner_id, {
            attributes: ['user_id', 'name', 'url_avatar', 'host_since'],
            include: [
                {
                    model: db.language,
                    attributes: ["language"],
                    as: 'language',
                    through: { attributes: [] } // Specifing atributes from the user_language table
                },
            ]
        });

        /// Calculate the average rating
        let totalStars = 0;
        // Counter to track the number of valid ratings
        let numValidRatings = 0; 

        // Loop through each booking/rating in the property
        property.rating.forEach(booking => {
            // Check if the number of stars is not null (review was not done)
            if (booking.number_stars !== null) { 
                // If not null, add the number of stars to the total
                totalStars += booking.number_stars;
                // Increment the counter for valid ratings
                numValidRatings++; 
            }
        });

        // Calculate the average rating
        const averageRating = totalStars / numValidRatings;

        // Calculate the average rating of the host
        // Finds the average of the number_stars column from the booking table
        const averageRatingHost = await db.booking.findOne({
            attributes: [
                [Sequelize.fn('AVG', Sequelize.col('number_stars')), 'average_rating']
            ],
            include: [{
                model: db.property,
                where: { owner_id: property.owner_id },
                attributes: [],
            }]
        });

        // Count total reviews for the host
        // Counts the number of bookings where the property belongs to the host and has a non-null number_stars
        const totalReviewsHost = await db.booking.count({
            where: {
                property_id: {
                    [Sequelize.Op.in]: db.sequelize.literal(
                        `(SELECT property_id FROM property WHERE owner_id = ${property.owner_id})`
                    )
                },
                number_stars: {
                    [Sequelize.Op.not]: null
                }
            }
        });

        // Add the average rating to the property object
        property.dataValues.averageRating = averageRating;
        // Attach the total reviews count to the owner object
        owner.dataValues.total_reviews = totalReviewsHost;
        // Attach the average rating to the owner object
        owner.dataValues.userRating = averageRatingHost;  
        // Attach the owner information to the property object
        property.dataValues.host = owner

        // If property is found, return it along with links for actions (HATEOAS)
        res.status(200).json({
            success: true,
            data: property,
            links: [
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
 * Deletes a property by their ID. This endpoint serves two purposes:
 * 
 * 1. Allows an administrator to delete any property by providing its ID.
 * 2. Allows a property owner to delete their own property by providing its ID.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
*/
exports.delete = async (req, res) => {
    try {
        // Retrieve the user information from the token in the header
        const loggedInUser = req.userData; 

        const property = await Property.findByPk(req.params.property_id);
        

        // Check if the logged-in user is an admin or if they own the property
        if (loggedInUser.type !== 'admin' && loggedInUser.user_id !== property.owner_id) {
            return res.status(403).json({ 
                success: false, 
                msg: "Unauthorized: You don't have permission to perform this action." });
        }

        // Find all photos associated with the property ID
        let photos = await db.photo.findAll({
            where: {
                property_id: req.params.property_id
            }
        });

        // Delete all the photos from Cloudinary
        if (photos && photos.length > 0) {
            for (let photo of photos) {
                await deleteImage(photo.cloudinary_photo_id);
            }
        }

        // Attempt to delete the property with the specified ID
        let result = await Property.destroy({
            where: { property_id: req.params.property_id }
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

        // Find all photos associated with the property ID
        let photos = await db.photo.findAll({
            where: {
                property_id: req.params.property_id
            }
        });
        

        // Attempt to update the property with the provided data
        let affectedRows = await Property.update(
            req.body, {
            where: {
                property_id: req.params.property_id
            }
        });

        // If there are files attached to the request, process them
        if (req.files) {
            try {
                // Delete old photo if it exists
                if (photos && photos.length > 0) {
                    for (let photo of photos) {
                        // Delete the photo from the database
                        await db.photo.destroy({
                            where: { photo_id: photo.photo_id } 
                        });
        
                        // Delete the photo from Cloudinary
                        await deleteImage(photo.cloudinary_photo_id);
                    }
                }

                const promises = req.files.map(async (photoFile) => {
                    // Upload each photo image
                    const photoResult = await uploadImage(photoFile, "properties");

                    // Create a new photo record in the database
                    const newPhoto = await db.photo.create({
                        property_id: req.params.property_id, 
                        url_photo: photoResult.secure_url,
                        cloudinary_photo_id: photoResult.public_id
                    });

                    
                    // Increment the affectedRows count
                    affectedRows ++
                });
        
                // Wait for all photo upload operations to complete
                await Promise.all(promises);

            } catch (uploadError) {
                // Handle upload errors
                return res.status(500).json({
                    success: false,
                    msg: "Error uploading image: " + uploadError.message
                });
            }
        }

        // If no rows were affected, return a success message indicating no updates were made
        if (affectedRows[0] === 0) {
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

        // Count the number of properties the user owns
        const propertyCount = await Property.count({
            where: {
                owner_id: req.body.owner_id
            }
        });

        // Find the user by ID provided in the request body
        let user = await db.user.findByPk(req.body.owner_id);

        // Define badge IDs
        const propertyDebutBadge = 1;        // Badge when user register 1st property
        const propertyPortfolioBadge = 2;    // Badge when user register 3rd property
        const propertyMagnateBadge = 3;      // Badge when user register 5th property

        // Check the property count and update badges accordingly
        if (propertyCount === 0) {
            // Set host_since to the current date
            user.host_since = new Date();
            // Save the changes to the database
            await user.save();
            // Add the debut badge
            await user.addBadge(propertyDebutBadge);
        } else if (propertyCount === 2) {
            // Remove the debut badge
            await user.removeBadge(propertyDebutBadge);
            // Add the portfolio badge
            await user.addBadge(propertyPortfolioBadge);
        } else if (propertyCount === 4) {
            // Remove the portfolio badge
            await user.removeBadge(propertyPortfolioBadge);
            // Add the magnate badge
            await user.addBadge(propertyMagnateBadge);
        }

        // Save the property in the database
        let newProperty = await Property.create(req.body);

        // Process and upload photos if provided
        if (req.files) {
            try {
                const promises = req.files.map(async (photoFile) => {
                    const photoResult = await uploadImage(photoFile, "properties");
                    await db.photo.create({
                        property_id: newProperty.property_id,
                        url_photo: photoResult.secure_url,
                        cloudinary_photo_id: photoResult.public_id
                    });
                });
                await Promise.all(promises);
            } catch (error) {
                // Handle any error that might occur during file upload or database creation
                console.error("Error uploading photos:", error);
                // Return an error response to the client
                return res.status(500).json({
                    success: false,
                    msg: "An error occurred while uploading photos."
                });
            }
        }
        

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
                msg: err.errors.map(e => e.message)
            });
        // If an error occurs, return a 500 response with an error message
        else
            res.status(500).json({
                success: false,
                msg: err.message || "Some error occurred while creating the property."
            });
    };
};


