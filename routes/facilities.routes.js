// Importing the express module
const express = require('express');
// Creating an instance of the express router
const router = express.Router();

// Importing middleware functions
const checkAuth = require('../middleware/check-auth');

// import facility controller middleware
const facilityController = require("../controllers/facility.controller");

router.route('/')
    .get( checkAuth, facilityController.findAll ) // PUBLIC


router.all('*', (req, res) => {
    res.status(404).json({ message: 'CozyStay: what???' }); //send a predefined error message
})

//export this router
module.exports = router;