const db = require("../models/index.js");
// Define a variable Booking to represent the Booking model in the database
const Booking = db.booking;

//"Op" necessary for LIKE operator
const { Op, ValidationError, UniqueConstraintError } = require('sequelize');

/**
 * Retrieves a booking by their ID.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.findOne = async (req, res) => {
    try {
        // Find the booking by their ID
        let booking = await Booking.findByPk(req.params.booking_id);

        // If the booking is not found, return a 404 response
        if (!booking) {
            return res.status(404).json({
                success: false, 
                msg: `Booking with ID ${req.params.booking_id} not found.`
            });
        }

        // If property is found, return it along with links for actions (HATEOAS)
        res.status(200).json({ 
            success: true, 
            data: booking,
            links:[
                { "rel": "self", "href": `/properties/${booking.property_id}`, "method": "GET" },
                //{ "rel": "delete", "href": `/properties/${booking.property_id}`, "method": "DELETE" },
                //{ "rel": "modify", "href": `/properties/${booking.property_id}`, "method": "PUT" },
            ]
        });

    }
    catch (err) {
        // If an error occurs, return a 500 response with an error message
        return res.status(500).json({ 
            success: false, 
            msg: `Error retrieving booking with ID ${req.params.booking_id}.`
        });
        
    };
};