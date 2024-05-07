const express = require('express');
const router = express.Router();

// import property controller middleware
const propertyController = require("../controllers/property.controller");

router.route('/')
    .get( propertyController.findAll )
    //.post ( propertiesController.xxx )

router.route('/:property_id')
    .get( propertyController.findOne ) 
    //.patch( propertiesController.xxx )
    .delete( propertyController.delete)

router.route('/:property_id/confirm')
    //.patch( propertiesController.xxx )

router.route('/:property_id/payment-methods')
    //.get( propertiesController.xxx ) 

router.route('/:property_id/reviews')
    //.get( propertiesController.xxx ) 
    

router.all('*', (req, res) => {
    res.status(404).json({ message: 'CozyStay: what???' }); //send a predefined error message
})

//export this router
module.exports = router;