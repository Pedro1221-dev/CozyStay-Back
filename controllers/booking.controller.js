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

/**
 * Creates a new booking.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.create = async (req, res) => {
    try {
        // Extracts the property_id, check_in_date, check_out_date, number_guests, final_price, payment_method_id properties from the request body
        const { property_id, check_in_date, check_out_date, number_guests, final_price, payment_method_id } = req.body;

        // Need to retrieve the user id (guest_id) who made the reservation from the token

        // Save the booking in the database
        let newBooking = await Booking.create(req.body);

        // Return a sucess message,along with links for actions (HATEOAS)
        res.status(201).json({
            success: true,
            msg: "Booking successfully created.",
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
                msg: err.message || "Some error occurred while creating the booking."
            });
    };
};

/**
 * Deletes a booking by their ID.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
*/
exports.delete = async (req, res) => {
    try {
        // Attempt to delete the booking with the specified ID
        let result = await Booking.destroy({ 
            where: { booking_id: req.params.booking_id}
        });


        // Check if the booking was successfully deleted
        if (result == 1) {
            // Return a success message if the booking was found and deleted
            return res.status(200).json({
                success: true, 
                msg: `Booking with id ${req.params.booking_id} was successfully deleted!`
            });
        }

         // If the booking was not found, return a 404 response
        return res.status(404).json({
            success: false, 
            msg: `Booking with ID ${req.params.booking_id} not found.`
        });
    }
    catch (err) {
         // If an error occurs, return a 500 response with an error message
        res.status(500).json({
            success: false, 
            msg: `Error deleting booking with ID ${req.params.booking_id}.`
        });
    };
};