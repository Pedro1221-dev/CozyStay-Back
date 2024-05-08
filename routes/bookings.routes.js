const express = require('express');
const router = express.Router();

// import bookings controller middleware
const bookingController = require("../controllers/booking.controller");

router.route('/')
    .post( bookingController.create )

router.route('/:booking_id/rates')
    //.post( bookingsController.xxx )

router.route('/:booking_id')
    .get( bookingController.findOne ) 
    .delete( bookingController.delete)
    
router.route('/upcoming')
    //.get( bookingsController.xxx ) 

router.route('/past')
    //.get( bookingsController.xxx ) 



router.all('*', (req, res) => {
    res.status(404).json({ message: 'CozyStay: what???' }); //send a predefined error message
})

//export this router
module.exports = router;