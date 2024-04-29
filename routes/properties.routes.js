const express = require('express');
const router = express.Router();

// import properties controller middleware
const propertiesController = require("../controllers/properties.controller");

router.route('/')
    //.get( propertiesController.findAll )
    //.post ( propertiesController.xxx )

router.route('/:property_id')
    //.get( propertiesController.xxx ) 
    //.patch( propertiesController.xxx )
    //.delete( propertiesControler.xxx)

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