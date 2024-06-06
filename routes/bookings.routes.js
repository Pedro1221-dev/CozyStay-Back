// Importing the express module
const express = require('express');
// Creating an instance of the express router
const router = express.Router();
// Importing middleware functions
const checkAuth = require('../middleware/check-auth');

// import bookings controller middleware
const bookingController = require("../controllers/booking.controller");

router.route('/')
    .post( checkAuth, bookingController.create ) // PROTECTED (user logged in)

router.route('/:booking_id/rate')
    .post( checkAuth, bookingController.rateBooking) // PROTECTED (user logged in)

router.route('/:booking_id')
    .get( checkAuth, bookingController.findOne )  // PROTECTED (user logged in)
    .delete( checkAuth, bookingController.delete) // PROTECTED (user logged in)

router.route('/send-invoice')
    .post(checkAuth, bookingController.sendInvoice) // PROTECTED (user logged in)
    
router.route('/upcoming')
    //.get( bookingsController.xxx )  // PROTECTED

router.route('/past')
    //.get( bookingsController.xxx )  // PROTECTED



router.all('*', (req, res) => {
    res.status(404).json({ message: 'CozyStay: what???' }); //send a predefined error message
})

//export this router
module.exports = router;