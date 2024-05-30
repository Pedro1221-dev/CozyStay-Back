// Importing the express module
const express = require('express');
// Creating an instance of the express router
const router = express.Router();
// Importing middleware functions
const checkAuth = require('../middleware/check-auth');
const checkAdmin= require('../middleware/check-admin');

// Importing multer 
const upload = require('../config/multerConfig'); 

// import property controller middleware
const propertyController = require("../controllers/property.controller");

router.route('/')
    .get( propertyController.findAll ) // PUBLIC
    .post ( checkAuth, upload.array('photos', { minCount: 1, maxCount: 5 }), propertyController.create ) // PROTECTED (user logged in)

router.route('/:property_id')
    .get( propertyController.findOne )  // PUBLIC
    .patch( checkAuth, upload.array('photos', { minCount: 1, maxCount: 5 }), propertyController.update ) // PROTECTED (user logged in)
    .delete( checkAuth, propertyController.delete) // PROTECTED (user logged in)

router.route('/:property_id/confirm')
    .patch( checkAuth, checkAdmin, propertyController.confirm ) // PROTECTED (admin logged in)

router.route('/:property_id/payment-methods')
    //.get( propertiesController.xxx ) // PUBLIC

router.route('/:property_id/reviews')
    //.get( propertiesController.xxx ) // PUBLIC
    

router.all('*', (req, res) => {
    res.status(404).json({ message: 'CozyStay: what???' }); //send a predefined error message
})

//export this router
module.exports = router;