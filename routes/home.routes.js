// Importing the express module
const express = require('express');
// Creating an instance of the express router
const router = express.Router();

// import home controller middleware
const homeController = require("../controllers/home.controller");

router.route('/')
    .get( homeController.findAll ) // PUBLIC


router.all('*', (req, res) => {
    res.status(404).json({ message: 'CozyStay: what???' }); //send a predefined error message
})

//export this router
module.exports = router;