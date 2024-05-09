// Importing the express module
const express = require('express');
// Creating an instance of the express router
const router = express.Router();

// import bookings controller middleware
const bookingController = require("../controllers/booking.controller");

router.route('/')
    .post( bookingController.create ) // PROTECTED

router.route('/:booking_id/rates')
    //.post( bookingsController.xxx ) // PROTECTED

router.route('/:booking_id')
    .get( bookingController.findOne )  // PROTECTED
    .delete( bookingController.delete) // PROTECTED
    
router.route('/upcoming')
    //.get( bookingsController.xxx )  // PROTECTED

router.route('/past')
    //.get( bookingsController.xxx )  // PROTECTED



router.all('*', (req, res) => {
    res.status(404).json({ message: 'CozyStay: what???' }); //send a predefined error message
})

//export this router
module.exports = router;