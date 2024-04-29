const express = require('express');
const router = express.Router();

// import bookings controller middleware
const bookingsController = require("../controllers/bookings.controller");

router.route('/')
    //.post( bookingsController.xxx )

router.route('/:booking_id/rates')
    //.post( bookingsController.xxx )

router.route('/:booking_id')
    //.get( bookingsController.xxx ) 
    //.delete( bookingsControler.xxx)
    
router.route('/upcoming')
    //.get( bookingsController.xxx ) 

router.route('/past')
    //.get( bookingsController.xxx ) 



router.all('*', (req, res) => {
    res.status(404).json({ message: 'CozyStay: what???' }); //send a predefined error message
})

//export this router
module.exports = router;