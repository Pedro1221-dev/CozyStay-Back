// Importing the express module
const express = require('express');
// Creating an instance of the express router
const router = express.Router();
// Importing middleware functions
const checkAuth = require('../middleware/check-auth');
const checkCurrent = require('../middleware/check-current');
const checkAdmin= require('../middleware/check-admin');

// import user controller middleware
const userController = require("../controllers/user.controller");

router.route('/')
    .get( userController.findAll ) // PROTECTED
    .post(userController.create)  // PUBLIC

router.route('/:user_id')
    .get( userController.findOne )  // PUBLIC
    .delete( checkAuth, userController.delete) // PROTECTED
    .patch( checkAuth, checkCurrent, userController.update) // PROTECTED

router.route('/:user_id/properties')
    //.get( usersController.xxx )  // PUBLIC

router.route('/current')
    //.get( usersController.xxx )  // PROTECTED
    //.patch( usersController.xxx )

router.route('/current/properties')
    //.get( usersController.xxx ) // PROTECTED

router.route('/current/bookings')
    //.get( usersController.xxx ) // PROTECTED

router.route('/current/favorites')
    //.get( usersController.xxx ) // PROTECTED
    //.post( usersController.xxx ) // PROTECTED

router.route('/current/favorites/:property_id')
    //.delete( usersController.xxx ) // PROTECTED

router.route('/verifyEmail')
    //.post( usersController.xxx ) // PUBLIC

router.route('/login')
    .post( userController.login ) // PUBLIC


router.all('*', (req, res) => {
    res.status(404).json({ message: 'CozyStay: what???' }); //send a predefined error message
})

//export this router
module.exports = router;