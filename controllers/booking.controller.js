// Importing all the models
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
        // Extract the property_id, check_in_date, check_out_date, number_guests from the request body
        const { property_id, check_in_date, check_out_date, number_guests } = req.body;

        // Need to retrieve the user id (guest_id) who made the reservation from the token
        // Retrieving the user id (guest_id) who made the reservation from the token
        const guest_id = req.userData.user_id;

        // Set the guest_id in the req.body object
        req.body.guest_id = guest_id;

        // Set the booking_date in the req.body object
        req.body.booking_date = new Date();

        // Check if check-out date is greater than check-in date
        if (new Date(check_out_date) <= new Date(check_in_date)) {
            return res.status(400).json({
                success: false,
                msg: "Check-out date must be greater than check-in date."
            });
        }

        // Fetch the property to check the allowed number of guests
        const property = await db.property.findOne({ where: { property_id } });
        
        if (!property) {
            return res.status(404).json({
                success: false,
                msg: "Property not found."
            });
        }

        // Check if the number of guests allowed is greater or equal to the number of guests in the reservation
        if (property.number_guests_allowed < number_guests) {
            return res.status(400).json({
                success: false,
                msg: `The maximum number of guests allowed for this property is ${property.number_guests_allowed}.`
            });
        }

        // Find conflicting bookings for the same property and overlapping dates
        const conflictingBookings  = await db.booking.findOne({
            where: {
                property_id,
                [Op.or]: [
                    {
                        // Case 1: New check-in date falls between existing booking's check-in and check-out dates
                        check_in_date: {
                            [Op.between]: [check_in_date, check_out_date]
                        }
                    },
                    {
                        // Case 2: New check-out date falls between existing booking's check-in and check-out dates
                        check_out_date: {
                            [Op.between]: [check_in_date, check_out_date]
                        }
                    },
                    {   
                        // Case 3: New booking completely overlaps an existing booking (check-in date before or equal to new check-in date
                        // and check-out date after or equal to new check-out date)
                        [Op.and]: [
                            {
                                check_in_date: {
                                    [Op.lte]: check_in_date
                                }
                            },
                            {
                                check_out_date: {
                                    [Op.gte]: check_out_date
                                }
                            },
                        ]
                    }
                ]
            }
        })

        // If there are conflicting bookings, return an error response
        if (conflictingBookings) {
            return res.status(400).json({
                success: false,
                msg: "The property is already booked for the selected dates."
            });
        }

        

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
        // Find the booking with the specified ID
        const booking = await db.booking.findByPk(req.params.booking_id);

        // Check if the booking exists
        if (!booking) {
            // If the booking doesn't exist, return a 404 response
            return res.status(404).json({
                success: false,
                msg: `Booking with ID ${req.params.booking_id} not found.`
            });
        }

        // Calculate the difference between check-in date and current date in days
        // Get the check-in date of the booking
        const checkInDate = new Date(booking.check_in_date);
        // Get the current date
        const currentDate = new Date();
        // Milliseconds in a day
        const oneDay = 1000 * 60 * 60 * 24; 
        // Calculate the difference in days
        const differenceInDays = Math.floor((checkInDate.getTime() - currentDate.getTime()) / oneDay);
        // Get the final price of the booking
        const refundAmount = booking.final_price;

        // Apply cancellation rules based on the difference in days
        if (differenceInDays < 2) {
            // Return a 400 response indicating cancellation is not allowed within 2 days of check-in
            return res.status(400).json({
                success: false,
                msg: `The booking cannot be canceled within 2 days of check-in.`
            });
        } else if (differenceInDays <= 7) {
            // Cancel the booking and return 50% refund
            await db.booking.destroy({
                where: { booking_id: req.params.booking_id }
            });

            // Return a 200 response indicating successful cancellation with 50% refund
            return res.status(200).json({
                success: true,
                msg: `Booking with id ${req.params.booking_id} was canceled. 50% of the amount refunded.`,
                refundAmount: refundAmount * 0.5
            });
        } else {
            // Cancel the booking and return full refund
            const result = await db.booking.destroy({
                where: { booking_id: req.params.booking_id }
            });

            // Check if the booking was successfully deleted
            if (result === 1) {
                // Return a 200 response indicating successful cancellation with full refund
                return res.status(200).json({
                    success: true,
                    msg: `Booking with id ${req.params.booking_id} was canceled. Full amount refunded.`,
                    refundAmount: parseInt(refundAmount)
                });
            } 
        }
    } catch (err) {
        // If an error occurs, return a 500 response with an error message
        res.status(500).json({
            success: false,
            msg: `Error deleting booking with ID ${req.params.booking_id}.`
        });
    }
};
