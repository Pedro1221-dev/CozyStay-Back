// Importing all the models
const db = require("../models/index.js");
// Define a variable Booking to represent the Booking model in the database
const Booking = db.booking;

//"Op" necessary for LIKE operator
const { Op, ValidationError, UniqueConstraintError } = require('sequelize');

// Importing the uploadImage and destroy functions from the cloudinary utilities
const { uploadImage, deleteImage } = require('../utilities/cloudinary');

// Importing the nodemailer library
const nodemailer = require("nodemailer");
// Import PDFKit for generating PDFs
const PDFDocument = require('pdfkit');
// Import the filesystem module
const fs = require('fs');
// Import the operating system module
const os = require('os');
// Import the path module for handling file paths
const path = require('path');
// Import Axios for making HTTP requests
const axios = require('axios'); 

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
            // Delete the invoice
            await deleteImage(booking.cloudinary_invoice_id)

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
            // Delete the invoice
            await deleteImage(booking.cloudinary_invoice_id)
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

/**
 * Rate a specified booking
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
*/
exports.rateBooking = async (req, res) => {
    try {
        // Extract number_stars and comment from the request body
        const { number_stars, comment} = req.body;

        // Check if the booking exists
        const booking = await db.booking.findByPk(req.params.booking_id);

        // If the booking does not exist, return a 404 response
        if (!booking) {
            return res.status(404).json({
                success: false,
                msg: `Booking with ID ${req.params.booking_id} not found.`
            });
        }

        // Get the check-out date of the booking and the current date
        const checkoutDate = new Date(booking.check_out_date);
        const currentDate = new Date();
        
        // Check if the check-out date is greater than the current date
        if (checkoutDate > currentDate) {
            // return a 400 response indicating that the booking cannot be rated until the check-out date
            return res.status(400).json({
                success: false,
                msg: `The booking cannot be rated until the check-out date`
            });
        }

        // Update the booking with the provided number of stars, comment, and current date as the rating date
        await db.booking.update(
            { 
                number_stars: number_stars, 
                comment: comment,
                rating_date: new Date()
            },
            { 
                where: 
                    { 
                        booking_id: req.params.booking_id 
                    } 
            }
        );

        // Return a success message if the booking is rated successfully
        res.status(200).json({
            success: true,
            msg: `Booking with ID ${req.params.booking_id } rated successfully.`,
        });


    } catch (err) {
        // If a validation error occurs, return a 400 response with error messages
        if (err instanceof ValidationError)
            res.status(400).json({ 
                success: false, 
                msg: err.errors.map(e => e.message) });
        else
            // If an error occurs, return a 500 response with an error message
            res.status(500).json({
                success: false,
                msg: `Error deleting booking with ID ${req.params.booking_id}.`
            });
    }
};

/**
 * Sends an invoice for a booking via email.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.sendInvoice = async (req, res) => {
    try {
        // Fetch the booking details from the database including associated user and property
        const booking = await db.booking.findByPk(req.body.booking_id, {
            include: [
                {
                    model: db.user,
                    attributes: ['name', 'email']
                },
                {
                    model: db.property,
                    attributes: ['title', 'address', 'description', 'typology', 'city', 'country']
                }
            ]
        });

        const paymentMethod = await db.paymentMethod.findByPk(booking.payment_method_id)
        
        // If booking not found, return a 404 response
        if (!booking) {
            return res.status(404).json({
                success: false,
                msg: `Booking with ID ${req.body.booking_id} not found.`
            });
        }

        // Calculate the number of nights
        const checkInDate = new Date(booking.check_in_date);
        const checkOutDate = new Date(booking.check_out_date);
        const oneDay = 1000 * 60 * 60 * 24; 
        const nightsDifference = Math.floor((checkOutDate.getTime() - checkInDate.getTime()) / oneDay);
        const nightsText = nightsDifference > 1 ? 'nights' : 'night';
        const nights = `${nightsDifference} ${nightsText}`;

        
        // Format the booking date
        const bookingDate = new Date(booking.booking_date);
        const options = { weekday: 'long', month: 'long', day: '2-digit', year: 'numeric' };
        const formattedDate = bookingDate.toLocaleDateString('en-US', options);

        // Format the check-in date
        const options1 = { month: 'long', day: '2-digit', year: 'numeric' };
        const formattedCheckIndate = checkInDate.toLocaleDateString('en-US', options1)

        // Format the check-out date
        const options2 = { month: 'long', day: '2-digit', year: 'numeric' };
        const formattedCheckOutdate = checkOutDate.toLocaleDateString('en-US', options2)

        // Format the booking date
        const options3 = { weekday: 'short', month: 'long', day: '2-digit', year: 'numeric' };
        const formattedBookingDate = bookingDate.toLocaleDateString('en-US', options3)

        // Create a temporary file path
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, `invoice_${req.body.booking_id}.pdf`);
        
        // Create a new PDF document
        const doc = new PDFDocument();
        const pdfStream = fs.createWriteStream(tempFilePath);
        doc.pipe(pdfStream);
        
        // Fetch the logo image
        const response = await axios.get('https://res.cloudinary.com/dc8ckrwlq/image/upload/v1717701427/logo/logo_gmail_wwgkzs.png', { responseType: 'arraybuffer' });

        // Add the logo image to the document
        doc.image(response.data, { width: 50, height: 50,  align: 'left' }  ); 
        doc.fontSize(12).font('Helvetica-Bold').text(`Cozy Stay`, { align: 'right' });
        doc.fontSize(12).font('Helvetica').text(`Escola Superior de Media Artes e Design - Politécnico do Porto`, { align: 'right'});
        doc.fontSize(12).font('Helvetica').text(`R. Dom Sancho I 1, Argivai`, { align: 'right' });
        doc.fontSize(12).font('Helvetica').text(`Portugal`, { align: 'right' })

        // Draw a gray line
        doc
            .moveTo(50, 150) // Starting point
            .lineTo(550, 150) // Ending point
            .lineWidth(1) // Line width
            .strokeColor('#CCCCCC') // Line color
            .stroke(); // Draw the line

        // Add confirmed booking details
        doc
            .fontSize(20)
            .font('Helvetica-Bold')
            .text(`Confirmed: ${nights} in ${booking.Property.dataValues.city}, ${booking.Property.dataValues.country}`, 50, 180, { align: 'left' });
        
        // Add booking user details
        doc
            .fontSize(12)
            .font('Helvetica')
            .text('Booked by ', 50, 220, { continued: true })
            .font('Helvetica-Bold')
            .text(booking.User.dataValues.name);

        // Add booking date
        doc 
            .fontSize(10)
            .font('Helvetica')
            .text(formattedDate, 50, 240, { align: 'left' })

        // Add booking status
        doc 
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('Accepted', 50, 220, { align: 'right' })

        // Add booking ID
        doc 
            .fontSize(10)
            .font('Helvetica')
            .text(`ID: ${booking.booking_id}`, 50, 235, { align: 'right' })

        // Add rectangle for check-in and check-out dates
        doc
            .rect(
                50, // x
                280, // y
                250, // width
                300 // height
            )
            .strokeColor('#CCCCCC')
            .stroke();

        // Add check-in date
        doc 
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('Check In', 70, 300, { align: 'left' })

        doc 
            .fontSize(12)
            .font('Helvetica-Bold')
            .text(formattedCheckIndate, 70, 310, { align: 'left' })

        // Add arrow symbol
        doc 
            .fontSize(20)
            .font('Helvetica')
            .text('>', 170, 305, { align: 'left' })

        // Add check-out date
        doc 
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('Check Out', 210, 300, { align: 'left' })

        doc 
            .fontSize(12)
            .font('Helvetica-Bold')
            .text(formattedCheckOutdate, 210, 310, { align: 'left' })

        // Add line separator
        doc
            .moveTo(70, 340) // Starting point
            .lineTo(290, 340) // Ending point
            .lineWidth(1) // Line width
            .strokeColor('#CCCCCC') // Line color
            .stroke(); // Draw the line

        // Add property details
        doc 
            .fontSize(14)
            .font('Helvetica-Bold')
            .text(`${booking.Property.dataValues.title}`, 70, 360, { align: 'left' })

        doc 
            .fontSize(12)
            .font('Helvetica')
            .text(`${booking.Property.dataValues.address}`, 70, 380, { align: 'left' })

        doc 
            .fontSize(12)
            .font('Helvetica')
            .text(`${booking.Property.dataValues.typology}`, 70, 400, { align: 'left' })
        
        doc 
            .fontSize(12)
            .font('Helvetica')
            .text(`${booking.Property.dataValues.description}`, 70, 420, { align: 'left' })

        doc 
            .fontSize(12)
            .font('Helvetica')
            .text(`${booking.Property.dataValues.city},`, 70, 440, { align: 'left' })

        doc 
            .fontSize(12)
            .font('Helvetica')
            .text(`${booking.Property.dataValues.country}`, 70, 460, { align: 'left' })
        
        doc
            .moveTo(70, 500) // Starting point
            .lineTo(290, 500) // Ending point
            .lineWidth(1) // Line width
            .strokeColor('#CCCCCC') // Line color
            .stroke(); // Draw the line
        
        doc 
            .fontSize(14)
            .font('Helvetica-Bold')
            .text(`${booking.number_guests} Travelers on this trip`, 70, 530, { align: 'left' })

        doc
            .rect(
                325, // x
                280, // y
                225, // width
                140 // height
            )
            .strokeColor('#CCCCCC')
            .stroke();
        
        doc 
            .fontSize(16)
            .font('Helvetica-Bold')
            .text(`Charges`, 340, 300, { align: 'left' })

        doc 
            .fontSize(12)
            .font('Helvetica')
            .text(`${booking.final_price / nightsDifference} x ${nights}`, 340, 330, { align: 'left' })

        doc 
            .fontSize(12)
            .font('Helvetica')
            .text(`${booking.final_price}`, 470, 330, { align: 'right' })
        
        doc 
            .fontSize(12)
            .font('Helvetica')
            .text(`Service fee`, 340, 360, { align: 'left' })

        doc 
            .fontSize(12)
            .font('Helvetica')
            .text(`${booking.final_price * 0.1}`, 470, 360, { align: 'right' })
        
        doc 
            .fontSize(12)
            .font('Helvetica-Bold')
            .text(`Total`, 340, 390, { align: 'left' })

        doc 
            .fontSize(14)
            .font('Helvetica-Bold')
            .text(`${(booking.final_price * 1.1).toFixed(2)}`, 470, 390, { align: 'right' })
        
        doc
            .rect(
                325, // x
                440, // y
                225, // width
                140 // height
            )
            .strokeColor('#CCCCCC')
            .stroke();
        
        doc 
            .fontSize(16)
            .font('Helvetica-Bold')
            .text(`Payment`, 340, 460, { align: 'left' })
        
        doc 
            .fontSize(12)
            .font('Helvetica')
            .text(`Paid with ${paymentMethod.description}`, 340, 490, { align: 'left' })

        doc 
            .fontSize(8)
            .font('Helvetica')
            .text(`${formattedBookingDate}`, 340, 505, { align: 'left' })

        doc 
            .fontSize(12)
            .font('Helvetica')
            .text(`${(booking.final_price * 1.1).toFixed(2)}`, 470, 490, { align: 'right' })

        doc 
            .fontSize(14)
            .font('Helvetica-Bold')
            .text(`Total paid`, 340, 540, { align: 'left' })

        doc 
            .fontSize(14)
            .font('Helvetica-Bold')
            .text(`${(booking.final_price * 1.1).toFixed(2)}`, 470, 540, { align: 'right' })
        
        doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('Cost per traveler ', 50, 595, )

        doc
            .fontSize(10)
            .font('Helvetica')
            .text('This trip was', 50, 610, { continued: true })
            .font('Helvetica-Bold')
            .text(` ${(booking.final_price * 1.1 / (booking.number_guests * nightsDifference)).toFixed(2)}`, { continued: true })
            .font('Helvetica')
            .text(' per person, per night,')
            .moveDown(0.2)
            .font('Helvetica')
            .text('including taxes and other fees.')
  
        // Draw a gray line
        doc
            .moveTo(50, 650) // Starting point
            .lineTo(550, 650) // Ending point
            .lineWidth(1) // Line width
            .strokeColor('#CCCCCC') // Line color
            .stroke(); // Draw the line
        
        // "Need Help?" text
        doc 
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('Need Help?', 50, 670, { align: 'left' })

        // "Accepted" text
        doc 
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('Accepted', 50, 670, { align: 'right' })

        // Booking ID
        doc 
            .fontSize(10)
            .font('Helvetica')
            .text(`ID: ${booking.booking_id}`, 50, 685, { align: 'right' })

        
        // End the PDF document generation
        doc.end();

        // Listen for the 'finish' event of the PDF stream, then sends an email with the generated invoice attached.
        pdfStream.on('finish', async () => {
            // Construct email options
            const mailOptions = {
                from: process.env.AUTH_EMAIL,
                to: booking.User.dataValues.email,
                subject: 'Your Booking Invoice',
                text: `Dear ${booking.User.dataValues.name},\n\nPlease find attached your booking invoice for the reservation ID ${req.body.booking_id}. If you have any questions or need further assistance, feel free to contact us.\n\nBest regards,\nThe Cozy Stay Team`,
                attachments: [
                    {
                        filename: `invoice_${req.body.booking_id}.pdf`,
                        path: tempFilePath
                    }
                ]
            };

            try {
                // Attempt to send the email
                await transporter.sendMail(mailOptions);

                // If successful, send a success response
                res.status(200).json({
                    success: true,
                    msg: `Invoice for booking with ID ${req.body.booking_id} sent successfully.`
                });

                // Upload the PDF to Cloudinary
                const pdfBuffer = fs.readFileSync(tempFilePath);
                const cloudinaryResult = await uploadImage(
                    {
                        buffer: pdfBuffer,
                        mimetype: 'application/pdf'
                    },
                    'invoices'
                );

                // Update the booking record with Cloudinary details
                await db.booking.update(
                    { 
                        invoice: cloudinaryResult.secure_url,
                        cloudinary_invoice_id: cloudinaryResult.public_id
                    },
                    {
                        where: { booking_id: req.body.booking_id }
                    }
                );

                // Delete the temporary PDF file
                fs.unlink(tempFilePath, (err) => {
                    if (err) console.error(`Error deleting temporary file: ${err}`);
                });
            } catch (emailError) {
                // If sending email fails, send an error response
                res.status(500).json({
                    success: false,
                    msg: `Error sending the invoice for the booking with ID ${req.body.booking_id}.`
                });

                // Delete the temporary PDF file
                fs.unlink(tempFilePath, (err) => {
                    if (err) console.error(`Error deleting temporary file: ${err}`);
                });
            }
        });
    } catch (err) {
        // If a validation error occurs, return a 400 response with error messages
        if (err instanceof ValidationError)
            res.status(400).json({ 
                success: false, 
                msg: err.errors.map(e => e.message) });
        else
            // If an error occurs, return a 500 response with an error message
            res.status(500).json({
                success: false,
                msg: `Error sending the invoice for the booking with ID ${req.body.booking_id}.`
            });
    }
}
